const { Coupon, CouponUsage } = require('../models/couponModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const CustomError = require('../utils/CustomError');

exports.addCoupon = asyncErrorHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);

  res.status(200).json({
    status: 'success',
    message: 'A coupon has been added',
    data: { coupon },
  });
});

exports.getAllCoupon = asyncErrorHandler(async (req, res) => {
  const coupons = await Coupon.find();

  if (coupons?.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No coupons found',
      data: null,
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Coupons retrieved successfully',
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
  if (!user) throw new CustomError('User not logged in', 401);
  const cart = await Cart.findOne({ userId: user.id });
  if (!cart) throw new CustomError('User needs to have a cart', 400);

  // Check if coupon exists
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new CustomError('Coupon does not exist', 400);

  // Check if user has used this coupon before
  const couponUsage = await CouponUsage.findOne({ userId: user.id, couponId: coupon._id });
  if (couponUsage) throw new CustomError('User has already used this coupon', 400);

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
    couponId: coupon._id,
    code: code,
    discount: couponResult.discount,
    appliedAt: Date.now(),
  };

  await cart.save();

  res.status(200).json({
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
