const { addToCart, getCart, deleteItemInCartCart, mergeCart } = require('../controllers/cartController');
const { protect } = require('../middleware/protect');

const router = require('express').Router();

router.route('/get-cart').get(getCart);
router.route('/add-to-cart').post(addToCart);
router.route('/delete-cart-item/:sku').delete(deleteItemInCartCart);
router.route('/merge-cart').patch(protect, mergeCart);

module.exports = router;
