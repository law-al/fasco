const { StatusCodes } = require('http-status-codes');
const Coupon = require('../models/couponModel');
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

exports.applyCoupon = asyncErrorHandler(async (req, res) => {
  const { code } = req.body;
  const { user } = req.session;
  if (!user || !user.token) throw new CustomError('User not logged in', StatusCodes.BAD_REQUEST);

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) throw new CustomError('Coupon does not exist', StatusCodes.BAD_REQUEST);

  const cart = await Cart.findOne({ userId: user.id });

  if (!cart) throw new CustomError('User needs to have a cart', StatusCodes.BAD_REQUEST);

  const totalPrice = cart.totalPrice;

  const couponResult = coupon.applyCoupon(totalPrice);

  const couponExist = await Cart.findOne({ 'appliedCoupon.code': code });

  if (couponExist) throw new CustomError('Coupon already applied', StatusCodes.BAD_REQUEST);

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
