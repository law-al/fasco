const { StatusCodes } = require('http-status-codes');
const { Coupon, CouponUsage } = require('../models/couponModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const CustomError = require('../utils/CustomError');

exports.addCoupon = asyncErrorHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: { coupon },
  });
});

exports.getAllCoupon = asyncErrorHandler(async (req, res) => {
  const coupons = await Coupon.find();

  if (coupons?.length === 0) {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: null,
    });
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    length: coupons.length,
    data: { coupons },
  });
});

/* ------------------------------
   APPLY COUPON
--------------------------------*/
exports.applyCoupon = asyncErrorHandler(async (req, res) => {
  const { code } = req.body;
  const { user } = req.session;
  if (!user || !user.token) throw new CustomError('User not logged in', StatusCodes.BAD_REQUEST);

  // Check if user has a cart
  const cart = await Cart.findOne({ userId: user.id });
  if (!cart) throw new CustomError('User needs to have a cart', StatusCodes.BAD_REQUEST);

  // Check if coupon exists
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new CustomError('Coupon does not exist', StatusCodes.BAD_REQUEST);

  // Check if user has used this coupon before
  const couponUsage = await CouponUsage.findOne({ userId: user.id, couponId: coupon._id });
  if (couponUsage) throw new CustomError('User has already used this coupon', StatusCodes.BAD_REQUEST);

  const totalPrice = cart.totalPrice;

  // check if coupon is applicable
  let couponResult;
  try {
    couponResult = coupon.applyCoupon(totalPrice);
  } catch (error) {
    throw error;
  }

  // Save applied coupon to cart
  cart.appliedCoupon = {
    code: code,
    discount: couponResult.discount,
    appliedAt: Date.now(),
  };

  await cart.save();

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Coupon applied successfully',
    data: {
      totalPrice: cart.totalPrice,
      discount: couponResult.discount,
      finalAmount: couponResult.finalAmount,
      couponCode: coupon.name,
    },
  });
});
