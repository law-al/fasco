const { StatusCodes } = require('http-status-codes');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

const checkAndUpdateInventory = async (product, productId, sku, color, size, quantity, session) => {
  const productInInventory = product.inventory.find(val => val.sku === sku);
  if (!productInInventory || productInInventory.quantity === 0)
    throw new CustomError('Product does not exist in inventory', StatusCodes.NOT_FOUND);

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
    throw new CustomError('Not enough inventory available', StatusCodes.BAD_REQUEST);
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

exports.addToCart = asyncErrorHandler(async (req, res) => {
  const { productId, sku, quantity } = req.body;
  let cart;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Clean up expired carts using the same session
    await cleanupExpiredGuestCarts(session);

    const product = await Product.findById(productId).session(session).lean();

    if (!product) throw new CustomError('Product no longer in store', StatusCodes.BAD_REQUEST);

    if (req.session.user && req.session.user.token) {
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
          image: product.images.find(image => image.isPrimary === true).url,
          sku,
          quantity: Number(quantity),
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

        req.session.user = { cart: cart[0] };
        req.session.cookie.maxAge = +process.env.USER_SESSION_MAX_AGE;

        await session.commitTransaction();

        return res.status(StatusCodes.OK).json({
          status: 'success',
          message: 'cart created successfully',
          data: { cart: cart[0] },
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
            await Product.updateOne(
              { _id: productId, 'inventory.sku': sku },
              { $inc: { 'inventory.$.quantity': Math.abs(quantityDiff) } },
              { session }
            );
          }

          cart.items[productInCartIndex].quantity = Number(quantity);
        } else {
          await checkAndUpdateInventory(product, productId, sku, Number(quantity), session);

          cart.items.push({
            productId,
            name: product.name,
            color: product.inventory.find(item => item.sku === sku).color,
            size: product.inventory.find(item => item.sku === sku).size,
            image: product.images.find(image => image.isPrimary === true).url,
            sku,
            quantity: Number(quantity),
            priceAtTimeAdded: product.salesPrice || product.price,
          });
        }

        cart.totalPrice = cart.items
          .reduce((acc, item) => {
            return acc + item.priceAtTimeAdded * item.quantity;
          }, 0)
          .toFixed(2);

        await cart.save({ session });

        req.session.user = { cart };
        req.session.cookie.maxAge = +process.env.USER_SESSION_MAX_AGE;

        await session.commitTransaction();

        return res.status(StatusCodes.OK).json({
          status: 'success',
          message: 'cart updated successfully',
          data: { cart },
        });
      }
    } else {
      // Guest user flow
      if (!req.sessionID) throw new CustomError('No session ID', StatusCodes.BAD_REQUEST);
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
          image: product.images.find(image => image.isPrimary === true).url,
          sku,
          quantity: Number(quantity),
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

        req.session.guest = { cart: cart[0] };
        req.session.cookie.maxAge = +process.env.GUEST_SESSION_MAX_AGE;

        await session.commitTransaction();

        return res.status(StatusCodes.OK).json({
          status: 'success',
          message: 'guest cart added',
          data: { cart: cart[0] },
        });
      } else {
        // Update existing guest cart
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
            await Product.updateOne(
              { _id: productId, 'inventory.sku': sku },
              { $inc: { 'inventory.$.quantity': Math.abs(quantityDiff) } },
              { session }
            );
          }
          cart.items[productInCartIndex].quantity = Number(quantity);
        } else {
          await checkAndUpdateInventory(product, productId, sku, Number(quantity), session);
          cart.items.push({
            productId,
            name: product.name,
            color: product.inventory.find(item => item.sku === sku).color,
            size: product.inventory.find(item => item.sku === sku).size,
            image: product.images.find(image => image.isPrimary === true).url,
            sku,
            quantity: Number(quantity),
            priceAtTimeAdded: product.salesPrice || product.price,
          });
        }

        cart.totalPrice = cart.items
          .reduce((acc, item) => {
            return acc + item.priceAtTimeAdded * item.quantity;
          }, 0)
          .toFixed(2);

        // Update expiration time
        cart.expiresAt = new Date(Date.now() + Number(process.env.GUEST_SESSION_MAX_AGE));

        await cart.save({ session });

        req.session.guest = { cart };
        req.session.cookie.maxAge = +process.env.GUEST_SESSION_MAX_AGE;

        await session.commitTransaction();

        return res.status(StatusCodes.OK).json({
          status: 'success',
          message: 'cart updated successfully',
          data: { cart },
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

exports.getCart = asyncErrorHandler(async (req, res) => {
  let cart;
  if (req.session.user?.token) {
    const user = req.session.user;

    cart = await Cart.findOne({ userId: user.id });

    if (!cart) {
      return res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'User does not have a cart',
        cart: null,
      });
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      cartItemLength: cart.items.length,
      cart,
    });
  } else {
    const guestId = req.sessionID;

    cart = await Cart.findOne({ guestId });

    if (!cart) {
      return res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Guest does not have a cart',
        cart: null,
      });
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      cartItemLength: cart.items.length,
      cart,
    });
  }
});

exports.deleteItemInCartCart = asyncErrorHandler(async (req, res) => {
  // get cart item id
  const { sku } = req.params;
  let cart;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // check if cart item exist
    if (req.session.user?.token) {
      const user = req.session.user;
      cart = await Cart.findOne({ userId: user.id, 'items.sku': sku }).session(session);

      if (!cart) throw new CustomError('User cart not found', StatusCodes.BAD_REQUEST);

      const itemIndex = cart.items.findIndex(item => item.sku === sku);

      if (itemIndex > -1) {
        await Product.findOneAndUpdate(
          { _id: cart.items[itemIndex].productId, 'inventory.sku': sku },
          { $inc: { 'inventory.$.quantity': cart.items[itemIndex].quantity } },
          { session }
        );
        cart.items.splice(itemIndex, 1);
        cart.totalPrice = cart.items.reduce((acc, item) => acc + item.quantity * item.priceAtTimeAdded, 0).toFixed(2);
        await cart.save({ session });

        res.status(StatusCodes.OK).json({
          status: 'success',
          message: 'item deleted successfully',
          cart,
        });

        req.session.user = { cart };
        req.session.cookie.maxAge = +process.env.USER_SESSION_MAX_AGE;

        await session.commitTransaction();
      } else {
        throw new CustomError('item not found in cart', StatusCodes.BAD_REQUEST);
      }
    } else {
      const guestId = req.sessionID;
      cart = await Cart.findOne({ guestId, 'items.sku': sku }).session(session);

      if (!cart) throw new CustomError('Guest cart not found', StatusCodes.BAD_REQUEST);

      const itemIndex = cart.items.findIndex(item => item.sku === sku);

      if (itemIndex > -1) {
        await Product.findOneAndUpdate(
          { _id: cart.items[itemIndex].productId, 'inventory.sku': sku },
          { $inc: { 'inventory.$.quantity': cart.items[itemIndex].quantity } },
          { session }
        );
        cart.items.splice(itemIndex, 1);
        cart.totalPrice = cart.items.reduce((acc, item) => acc + item.quantity * item.priceAtTimeAdded, 0).toFixed(2);
        await cart.save({ session });

        req.session.guest = { cart };
        req.session.cookie.maxAge = +process.env.GUEST_SESSION_MAX_AGE;

        res.status(StatusCodes.OK).json({
          status: 'success',
          message: 'item deleted successfully',
          cart,
        });

        await session.commitTransaction();
      } else {
        throw new CustomError('item not found in cart', StatusCodes.BAD_REQUEST);
      }
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

exports.mergeCart = asyncErrorHandler(async (req, res) => {
  // check if user is logged in
  if (!req.session.user?.token) throw new CustomError('User needs to login', StatusCodes.BAD_REQUEST);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.session.user;
    const guestId = req.sessionID;

    // get guest cart
    const guestCart = await Cart.findOne({ guestId });

    // get user cart
    const userCart = await Cart.findOne({ userId: user.id });

    //loop through guest cart
    if (guestCart && userCart) {
      for (const guestCartItem of guestCart.items) {
        const existingItemIndex = userCart.items.findIndex(
          item =>
            item.sku === guestCartItem.sku && item.color === guestCartItem.color && item.size === guestCartItem.size
        );

        if (existingItemIndex > -1) {
          // item exist in user cart
          userCart.items[existingItemIndex].quantity += guestCartItem.quantity;
        } else {
          userCart.items.push(guestCartItem);
        }
      }
      userCart.totalPrice = userCart.items
        .reduce((acc, item) => acc + item.quantity * item.priceAtTimeAdded, 0)
        .toFixed(2);
      await userCart.save({ session });

      await Cart.findOneAndDelete({ guestId });
      req.session.guest = { cart: null };

      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'cart merged successfully',
        data: {
          cart: userCart,
        },
      });

      //   await session.commitTransaction();
    } else if (guestCart && !userCart) {
      // convert the guestCart to user cart
      guestCart.userId = user.id;
      guestCart.guestId = null;
      guestCart.expiresAt = null;
      await guestCart.save({ session });

      req.session.guest = { cart: null };
      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'cart merged successfully',
        data: {
          cart: guestCart,
        },
      });

      //   await session.commitTransaction();
    } else if (!guestCart && userCart) {
      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'cart merged successfully',
        data: {
          cart: userCart,
        },
      });
    } else {
      // no carts exist
      return res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'No carts to merge',
        data: { cart: null },
      });
    }
  } catch (error) {
    // await session.abortTransaction();
    throw error;
  } finally {
    // await session.endSession();
  }
});

exports.cleanupExpiredGuestCarts = cleanupExpiredGuestCarts;
