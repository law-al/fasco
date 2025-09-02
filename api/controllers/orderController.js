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

  if (!req.session.user) {
    throw new CustomError('User not logged in', 401);
  }

  const { user } = req.session;
  const userCart = await Cart.findOne({ userId: user.id });

  if (!userCart || userCart.items.length === 0) {
    throw new CustomError('User does not have a cart to checkout', 400);
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
        products: JSON.stringify(userCart.items.map(item => item.name)),
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

    res.status(200).json({
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
  try {
    const orderNumber = paymentIntent.metadata.orderNumber;
    const couponId = paymentIntent.metadata.couponId;
    const userId = paymentIntent.metadata.userId;
    const status = paymentIntent.status === 'succeeded' ? 'paid' : 'failed';

    // Get payment method details
    const paymentMethodID = paymentIntent.payment_method;
    const paymentMethodDetails = await stripe.paymentMethods.retrieve(paymentMethodID);

    // Update order with payment details
    const updatedOrder = await Order.findOneAndUpdate(
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

    if (!updatedOrder) {
      console.error('Order not found for orderNumber:', orderNumber);
      return;
    }

    // Handle coupon usage if coupon was applied
    if (couponId && couponId !== 'null') {
      try {
        await Coupon.findOneAndUpdate({ _id: couponId }, { $inc: { currentUses: 1 } });

        // Create coupon usage record
        await CouponUsage.create({
          userId: userId,
          couponId: couponId,
          usedAt: new Date(),
        });

        console.log('Coupon usage updated for couponId:', couponId);
      } catch (couponError) {
        console.error('Error updating coupon usage:', couponError);
      }
    }

    const clearedCart = await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          items: [],
          totalPrice: 0,
          appliedCoupon: null,
        },
      },
      { new: true }
    );

    if (clearedCart) {
      console.log('Successfully cleared cart for user:', userId);
    } else {
      console.error('Cart not found for user:', userId);
    }
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    // NOTE: Consider implementing a retry mechanism or dead letter queue
  }
}

// if failed
async function handleFailedPayment(paymentIntent) {
  try {
    const orderNumber = paymentIntent.metadata.orderNumber;

    // Update order status to 'failed'
    const updatedOrder = await Order.findOneAndUpdate(
      { orderNumber },
      {
        status: 'failed',
        'payment.status': 'failed',
      },
      { new: true }
    );

    if (!updatedOrder) {
      console.error('Order not found for failed payment, orderNumber:', orderNumber);
    } else {
      console.log('Order marked as failed:', orderNumber);
    }
  } catch (error) {
    console.error('Error in handleFailedPayment:', error);
  }
}
