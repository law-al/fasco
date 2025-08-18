const { StatusCodes } = require('http-status-codes');
const Order = require('../models/orderModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const { default: mongoose } = require('mongoose');
const Cart = require('../models/cartModel');

exports.createOrder = asyncErrorHandler(async (req, res) => {
  const { email, shippingAddress, paymentMethod } = req.body;

  if (!req.session.user || !req.session.user.token)
    throw new CustomError('User not logged in', StatusCodes.BAD_REQUEST);

  const { user } = req.session;

  const userCart = await Cart.findOne({ userId: user.id });
  if (!userCart || userCart.items.length === 0)
    throw new CustomError('User does not have a cart to checkout', StatusCodes.BAD_REQUEST);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const billing = {
        subTotal: userCart.totalPrice,
        tax: 0,
        shipping: 0,
        discount: userCart?.appliedCoupon.discount || 0,
        total: Number((userCart.totalPrice - (userCart?.appliedCoupon.discount || 0)).toFixed(2)),
      };

      await Order.create(
        [
          {
            orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            userId: user.id,
            customerEmail: email,
            items: userCart.items,
            shippingAddress,
            billing,
            payment: {
              method: paymentMethod,
            },
          },
        ],
        { session }
      );

      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Order created',
      });
    });
  } finally {
    await session.endSession();
  }
});
