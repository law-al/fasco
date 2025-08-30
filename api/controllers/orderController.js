require('dotenv').config({ path: './config.env' });
const { StatusCodes } = require('http-status-codes');
const Order = require('../models/orderModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const { default: mongoose } = require('mongoose');
const Cart = require('../models/cartModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createOrder = asyncErrorHandler(async (req, res) => {
  const { customerEmail, shippingAddress } = req.body;

  if (!req.session.user || !req.session.user.token) {
    throw new CustomError('User not logged in', StatusCodes.BAD_REQUEST);
  }

  const { user } = req.session;
  const userCart = await Cart.findOne({ userId: user.id });

  if (!userCart || userCart.items.length === 0) {
    throw new CustomError('User does not have a cart to checkout', StatusCodes.BAD_REQUEST);
  }

  const mongoSession = await mongoose.startSession();

  let paymentIntent;
  let orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  try {
    await mongoSession.withTransaction(async () => {
      const billing = {
        subTotal: userCart.totalPrice,
        tax: 0,
        shipping: 0,
        discount: userCart?.appliedCoupon?.discount || 0,
        total: Number((userCart.totalPrice - (userCart?.appliedCoupon?.discount || 0)).toFixed(2)),
      };

      // Create order in database
      await Order.create(
        [
          {
            orderNumber: orderNumber,
            userId: user.id,
            customerEmail: customerEmail,
            items: userCart.items,
            shippingAddress,
            billing,
            payment: {
              status: 'pending',
            },
            status: 'pending',
          },
        ],
        { session: mongoSession }
      );
    });

    // Create Stripe payment intent AFTER successful database transaction
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round((userCart.totalPrice - (userCart?.appliedCoupon?.discount || 0)) * 100),
      currency: 'usd',
      receipt_email: customerEmail,
      description: `Order payment for ${userCart.items.length} items - Ordered by ${user.email}`,
      metadata: {
        userId: user.id,
        orderNumber: orderNumber,
        customerEmail: customerEmail,
        products: JSON.stringify(userCart.items.map(item => item.name)), // Fixed: 'products' not 'product'
        cartId: userCart._id.toString(),
      },
      shipping: {
        name: `${shippingAddress.firstname} ${shippingAddress.lastname}`,
        address: {
          line1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country || 'US',
        },
      },
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        orderNumber: orderNumber,
        total: userCart.totalPrice - (userCart?.appliedCoupon?.discount || 0),
      },
    });
  } catch (error) {
    // if order was created but payment intent failed, update order status to 'failed'
    if (orderNumber) {
      try {
        await Order.findOneAndUpdate({ orderNumber }, { status: 'failed' });
      } catch (updateError) {
        console.error('Failed to update order status:', updateError);
      }
    }
    throw error;
  } finally {
    await mongoSession.endSession();
  }
});
