require('dotenv').config({ path: './config.env' });
const { StatusCodes } = require('http-status-codes');
const Order = require('../models/orderModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const { default: mongoose } = require('mongoose');
const Cart = require('../models/cartModel');
const { Coupon, CouponUsage } = require('../models/couponModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/* ------------------------------
   CREATE ORDER
--------------------------------*/
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
        couponId: userCart.appliedCoupon ? userCart.appliedCoupon?.couponId?.toString() : null,
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

/* ------------------------------
   Stripe Webhook
--------------------------------*/
exports.createWebhook = asyncErrorHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_KEY);
  } catch (error) {
    console.log('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded', paymentIntent);
      await updateOrderStatus(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed', failedPayment);
      await handleFailedPayment(failedPayment);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

/* ------------------------------
   Update Order Status
--------------------------------*/
// if success
async function updateOrderStatus(paymentIntent) {
  const orderNumber = paymentIntent.metadata.orderNumber;
  const couponId = paymentIntent.metadata.couponId;
  const status = paymentIntent.status === 'succeeded' ? 'paid' : 'failed';

  const paymentMethodID = paymentIntent.payment_method;
  const paymentMethodDetails = await stripe.paymentMethods.retrieve(paymentMethodID);

  // Update order with payment details
  await Order.findOneAndUpdate(
    { orderNumber },
    {
      'payment.status': status,
      'payment.method': paymentMethodDetails.type,
      'payment.transactionId': paymentIntent.id,
      'payment.paidAt': new Date(paymentIntent.created * 1000),
      status: status === 'paid' ? 'processing' : 'failed',
    },
    { new: true }
  );

  // Update discount currentUses if coupon was applied
  if (couponId) {
    await Coupon.findOneAndUpdate({ _id: couponId }, { currentUses: { $inc: 1 } });
  }

  // Update CouponUsage
  await CouponUsage.create({
    userId: paymentIntent.metadata.userId,
    couponId: couponId,
  });

  // clear user cart
  await Cart.findOneAndUpdate({ userId: paymentIntent.metadata.userId }, { items: [] });
}

// if failed
async function handleFailedPayment(paymentIntent) {
  const orderNumber = paymentIntent.metadata.orderNumber;

  // Update order status to 'failed'
  await Order.findOneAndUpdate({ orderNumber }, { status: 'failed' });

  //
}
