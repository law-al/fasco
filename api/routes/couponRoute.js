const { getAllCoupon, addCoupon, applyCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/protect');

const router = require('express').Router();

router.route('/get-coupons').get(getAllCoupon);
router.route('/add-coupon').post(addCoupon);
router.route('/apply-coupon').post(applyCoupon);

module.exports = router;
