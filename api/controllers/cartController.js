const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const Product = require('../models/productModel');
const mongoose = require('mongoose');
const { Coupon } = require('../models/couponModel');
const e = require('express');

const checkAndUpdateInventory = async (product, productId, sku, quantity, session) => {
  const productInInventory = product.inventory.find(val => val.sku === sku);
  if (!productInInventory || productInInventory.quantity === 0) throw new CustomError('Product does not exist in inventory', 404);

  // Atomically check and decrement inventory in one operation
  const updatedProduct = await Product.findOneAndUpdate(
    {
      _id: productId,
      inventory: {
        $elemMatch: {
          sku: sku,
          quantity: { $gte: quantity },
        },
      },
    },
    {
      $inc: {
        'inventory.$.quantity': -quantity,
      },
    },
    { session }
  );

  // If no document returned, means the condition wasn't met
  if (!updatedProduct) {
    throw new CustomError('Not enough inventory available', 400);
  }

  return product;
};

const restoreProductInventory = async (cart, session) => {
  for (const item of cart.items) {
    await Product.findOneAndUpdate(
      {
        _id: item.productId,
        inventory: {
          $elemMatch: {
            sku: item.sku,
            color: item.color,
            size: item.size,
          },
        },
      },
      { $inc: { 'inventory.$.quantity': item.quantity } },
      { session }
    );
  }
};

const cleanupExpiredGuestCarts = async session => {
  try {
    const expiredCarts = await Cart.find({
      guestId: { $ne: null },
      expiresAt: { $lt: new Date() },
    }).session(session);

    for (const cart of expiredCarts) {
      await restoreProductInventory(cart, session);
    }

    // then delete expired carts
    await Cart.deleteMany({
      guestId: { $ne: null },
      expiresAt: { $lt: new Date() },
    }).session(session);

    if (expiredCarts.length > 0) {
      console.log(`Cleaned up ${expiredCarts.length} expired guest carts`);
    }
  } catch (error) {
    console.error('Error cleaning up expired carts:', error);
    throw error;
  }
};

/* ------------------------------
   ADD TO CART AND UPDATE
--------------------------------*/
exports.addToCart = asyncErrorHandler(async (req, res) => {
  const { productId, sku, quantity } = req.body;
  let cart;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Clean up expired carts using the same session
    await cleanupExpiredGuestCarts(session);

    const product = await Product.findById(productId).session(session).lean();

    if (!product) throw new CustomError('Product no longer in store', 400);

    if (req.session.user) {
      const user = req.session.user;

      // Find existing cart for this user
      cart = await Cart.findOne({ userId: user.id.toString() }).session(session);

      if (!cart) {
        await checkAndUpdateInventory(product, productId, sku, Number(quantity), session);

        // Create new cart for user
        const items = {
          productId,
          name: product.name,
          color: product.inventory.find(item => item.sku === sku).color,
          size: product.inventory.find(item => item.sku === sku).size,
          image: product.images.find(image => image.isPrimary === true).url || product.images[0].url,
          sku,
          quantity: Number(quantity),
          maxQuantity: product.inventory.find(item => item.sku === sku).quantity,
          priceAtTimeAdded: product.salesPrice || product.price,
        };

        cart = await Cart.create(
          [
            {
              userId: user.id,
              guestId: null,
              items: [items],
              totalPrice: items.quantity * items.priceAtTimeAdded,
              expiresAt: null,
            },
          ],
          { session }
        );

        req.session.user.cart = { _id: cart[0]._id, itemCount: 1 };
        req.session.cookie.maxAge = process.env.USER_SESSION_MAX_AGE;

        await session.commitTransaction();

        return res.status(200).json({
          status: 'success',
          message: 'Cart created successfully',
          data: { cart: cart[0] },
          expiresAt: cart[0].expiresAt,
        });
      } else {
        // Update existing cart
        const productInCartIndex = cart.items.findIndex(item => {
          return item.productId.toString() === productId.toString() && item.sku === sku;
        });

        if (productInCartIndex > -1) {
          const currentQuantityInCart = cart.items[productInCartIndex].quantity;
          const quantityDiff = Number(quantity) - currentQuantityInCart;

          if (quantityDiff > 0) {
            // Need more items - reserve the difference
            await checkAndUpdateInventory(product, productId, sku, quantityDiff, session);
          } else if (quantityDiff < 0) {
            // Return items to inventory
            await Product.updateOne({ _id: productId, 'inventory.sku': sku }, { $inc: { 'inventory.$.quantity': Math.abs(quantityDiff) } }, { session });
          } else if (quantityDiff === 0) throw new CustomError('Item already in cart', 400);

          cart.items[productInCartIndex].quantity = Number(quantity);
        } else {
          await checkAndUpdateInventory(product, productId, sku, Number(quantity), session);

          cart.items.push({
            productId,
            name: product.name,
            color: product.inventory.find(item => item.sku === sku).color,
            size: product.inventory.find(item => item.sku === sku).size,
            image: product.images.find(image => image.isPrimary === true).url || product.images[0].url,
            sku,
            quantity: Number(quantity),
            maxQuantity: product.inventory.find(item => item.sku === sku).quantity,
            priceAtTimeAdded: product.salesPrice || product.price,
          });
        }

        cart.totalPrice = cart.items
          .reduce((acc, item) => {
            return acc + item.priceAtTimeAdded * item.quantity;
          }, 0)
          .toFixed(2);

        await cart.save({ session });

        req.session.user.cart = { _id: cart._id, itemCount: cart.items.length };
        req.session.cookie.maxAge = process.env.USER_SESSION_MAX_AGE;

        await session.commitTransaction();

        return res.status(200).json({
          status: 'success',
          message: 'Cart updated successfully',
          data: { cart },
          expiresAt: cart.expiresAt,
        });
      }
    } else {
      // Guest user flow
      if (!req.sessionID) throw new CustomError('No session ID', 400);
      const guestId = req.sessionID;

      cart = await Cart.findOne({ guestId }).session(session);

      if (!cart) {
        await checkAndUpdateInventory(product, productId, sku, Number(quantity), session);

        // Create new cart for guest
        const items = {
          productId,
          name: product.name,
          color: product.inventory.find(item => item.sku === sku).color,
          size: product.inventory.find(item => item.sku === sku).size,
          image: product.images.find(image => image.isPrimary === true).url || product.images[0].url,
          sku,
          quantity: Number(quantity),
          maxQuantity: product.inventory.find(item => item.sku === sku).quantity,
          priceAtTimeAdded: product.salesPrice || product.price,
        };

        const expirationTime = new Date(Date.now() + Number(process.env.GUEST_SESSION_MAX_AGE));

        cart = await Cart.create(
          [
            {
              userId: null,
              guestId,
              items: [items],
              totalPrice: items.quantity * items.priceAtTimeAdded,
              expiresAt: expirationTime,
            },
          ],
          { session }
        );

        req.session.guest = { cart: { _id: cart[0]._id, itemCount: 1 } };
        req.session.cookie.maxAge = Number(process.env.GUEST_SESSION_MAX_AGE);

        await session.commitTransaction();

        return res.status(200).json({
          status: 'success',
          message: 'Guest cart added',
          data: { cart: cart[0] },
          expiresAt: expirationTime,
        });
      } else {
        const productInCartIndex = cart.items.findIndex(item => {
          return item.productId.toString() === productId.toString() && item.sku === sku;
        });

        if (productInCartIndex > -1) {
          const currentQuantityInCart = cart.items[productInCartIndex].quantity;
          const quantityDiff = Number(quantity) - currentQuantityInCart;

          if (quantityDiff > 0) {
            // Need more items - reserve the difference
            await checkAndUpdateInventory(product, productId, sku, quantityDiff, session);
          } else if (quantityDiff < 0) {
            // Return items to inventory
            await Product.updateOne({ _id: productId, 'inventory.sku': sku }, { $inc: { 'inventory.$.quantity': Math.abs(quantityDiff) } }, { session });
          } else if (quantityDiff === 0) throw new CustomError('Item already in cart', 400);

          cart.items[productInCartIndex].quantity = Number(quantity);
        } else {
          await checkAndUpdateInventory(product, productId, sku, Number(quantity), session);
          cart.items.push({
            productId,
            name: product.name,
            color: product.inventory.find(item => item.sku === sku).color,
            size: product.inventory.find(item => item.sku === sku).size,
            image: product.images.find(image => image.isPrimary === true).url || product.images[0].url,
            sku,
            quantity: Number(quantity),
            maxQuantity: product.inventory.find(item => item.sku === sku).quantity,
            priceAtTimeAdded: product.salesPrice || product.price,
          });
        }

        cart.totalPrice = cart.items
          .reduce((acc, item) => {
            return acc + item.priceAtTimeAdded * item.quantity;
          }, 0)
          .toFixed(2);

        // Update expiration time
        const expirationTime = new Date(Date.now() + Number(process.env.GUEST_SESSION_MAX_AGE));
        cart.expiresAt = expirationTime;

        await cart.save({ session });

        req.session.guest = { cart: { _id: cart._id, itemCount: cart.items.length } };
        req.session.cookie.maxAge = Number(process.env.GUEST_SESSION_MAX_AGE);

        await session.commitTransaction();

        return res.status(200).json({
          status: 'success',
          message: 'Cart updated successfully',
          data: { cart },
          expiresAt: expirationTime,
        });
      }
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

/* ------------------------------
   GET CART
--------------------------------*/
exports.getCart = asyncErrorHandler(async (req, res) => {
  let cart;
  if (req.session.user) {
    const user = req.session.user;

    cart = await Cart.findOne({ userId: user.id });

    if (!cart) {
      return res.status(200).json({
        status: 'success',
        message: 'User does not have a cart',
        cart: null,
      });
    }

    res.status(200).json({
      status: 'success',
      items: cart.items.length,
      data: { cart },
    });
  } else {
    const guestId = req.sessionID;

    cart = await Cart.findOne({ guestId });

    if (!cart) {
      return res.status(200).json({
        status: 'success',
        message: 'Guest does not have a cart',
        cart: null,
      });
    }

    res.status(200).json({
      status: 'success',
      cartItemLength: cart.items.length,
      cart,
    });
  }
});

/* ------------------------------
   DELETE ITEM FROM CART
--------------------------------*/
exports.deleteItemInCart = asyncErrorHandler(async (req, res) => {
  // get cart item id
  const { sku } = req.params;
  let cart;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // check if cart item exist
    if (req.session.user) {
      const user = req.session.user;
      cart = await Cart.findOne({ userId: user.id, 'items.sku': sku }).session(session);

      if (!cart) throw new CustomError('User cart not found', 400);

      const itemIndex = cart.items.findIndex(item => item.sku === sku);

      if (itemIndex > -1) {
        await Product.findOneAndUpdate({ _id: cart.items[itemIndex].productId, 'inventory.sku': sku }, { $inc: { 'inventory.$.quantity': cart.items[itemIndex].quantity } }, { session });
        cart.items.splice(itemIndex, 1);
        cart.totalPrice = cart.items.reduce((acc, item) => acc + item.quantity * item.priceAtTimeAdded, 0).toFixed(2);

        if (cart.appliedCoupon) {
          try {
            const coupon = await Coupon.findOne({ name: cart.appliedCoupon.code });
            if (coupon) {
              // Recalculate discount
              try {
                const couponResult = coupon.applyCoupon(cart.totalPrice);
                cart.appliedCoupon.discount = couponResult.discount;
              } catch (error) {
                throw error;
              }
            }
          } catch (error) {
            cart.appliedCoupon = null;
            throw error;
          }
        }
        await cart.save({ session });

        req.session.user.cart = { _id: cart._id, itemCount: cart.items.length };
        req.session.cookie.maxAge = process.env.USER_SESSION_MAX_AGE;

        await session.commitTransaction();

        res.status(200).json({
          status: 'success',
          message: 'item deleted successfully',
          data: { cart },
          expiresAt: cart.expiresAt,
        });
      } else {
        throw new CustomError('item not found in cart', 400);
      }
    } else {
      const guestId = req.sessionID;
      cart = await Cart.findOne({ guestId, 'items.sku': sku }).session(session);

      if (!cart) throw new CustomError('Guest cart not found', 404);

      const itemIndex = cart.items.findIndex(item => item.sku === sku);

      if (itemIndex > -1) {
        await Product.findOneAndUpdate({ _id: cart.items[itemIndex].productId, 'inventory.sku': sku }, { $inc: { 'inventory.$.quantity': cart.items[itemIndex].quantity } }, { session });
        cart.items.splice(itemIndex, 1);
        cart.totalPrice = cart.items.reduce((acc, item) => acc + item.quantity * item.priceAtTimeAdded, 0).toFixed(2);
        await cart.save({ session });

        req.session.guest = { cart: { _id: cart._id, itemCount: cart.items.length } };
        req.session.cookie.maxAge = Number(process.env.GUEST_SESSION_MAX_AGE);

        await session.commitTransaction();

        res.status(200).json({
          status: 'success',
          message: 'Item deleted successfully',
          data: { cart },
          expiresAt: cart.expiresAt,
        });
      } else {
        throw new CustomError('Item not found in cart', 400);
      }
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

/* ------------------------------
   MERGE CART
--------------------------------*/
exports.mergeCart = asyncErrorHandler(async (req, res) => {
  // check if user is logged in
  if (!req.session.user) throw new CustomError('User needs to login', 400);
  let user;
  const session = await mongoose.startSession({});
  session.startTransaction();

  try {
    user = req.session.user;
    const guestId = req.sessionID;

    // get guest cart
    const guestCart = await Cart.findOne({ guestId });

    // get user cart
    const userCart = await Cart.findOne({ userId: user.id });

    //loop through guest cart
    if (guestCart && userCart) {
      for (const guestCartItem of guestCart.items) {
        const existingItemIndex = userCart.items.findIndex(item => item.sku === guestCartItem.sku && item.color === guestCartItem.color && item.size === guestCartItem.size);

        if (existingItemIndex > -1) {
          // item exist in user cart
          userCart.items[existingItemIndex].quantity += guestCartItem.quantity;
        } else {
          userCart.items.push(guestCartItem);
        }
      }
      userCart.totalPrice = userCart.items.reduce((acc, item) => acc + item.quantity * item.priceAtTimeAdded, 0).toFixed(2);
      await userCart.save({ session });
      await Cart.findOneAndDelete({ guestId }, { session });

      req.session.guest = null;
      req.session.user.cart = { _id: userCart._id, itemCount: userCart.items.length };

      await session.commitTransaction();

      return res.status(200).json({
        status: 'success',
        message: 'Cart merged successfully',
        data: {
          cart: userCart,
        },
        expiresAt: userCart.expiresAt || null,
      });
    } else if (guestCart && !userCart) {
      // convert the guestCart to user cart
      guestCart.userId = user.id;
      guestCart.guestId = null;
      guestCart.expiresAt = null;
      await guestCart.save({ session });

      req.session.guest = null;
      req.session.user.cart = { _id: guestCart._id, itemCount: guestCart.items.length };

      await session.commitTransaction();

      return res.status(200).json({
        status: 'success',
        message: 'Cart merged successfully',
        data: {
          cart: guestCart,
        },
        expiresAt: null,
      });
    } else if (!guestCart && userCart) {
      await session.commitTransaction();

      return res.status(200).json({
        status: 'success',
        message: 'Cart merged successfully',
        data: {
          cart: userCart,
        },
        expiresAt: userCart.expiresAt || null,
      });
    } else {
      // no carts exist
      await session.commitTransaction();

      return res.status(200).json({
        status: 'success',
        message: 'No carts to merge',
        data: { cart: null },
      });
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

exports.cleanupExpiredGuestCarts = cleanupExpiredGuestCarts;
