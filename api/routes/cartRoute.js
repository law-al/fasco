const { addToCart, getCart, mergeCart, deleteItemInCart } = require('../controllers/cartController');

const router = require('express').Router();

router.route('/get-cart').get(getCart);
router.route('/add-to-cart').post(addToCart);
router.route('/delete-cart-item/:sku').delete(deleteItemInCart);
router.route('/merge-cart').patch(mergeCart);

module.exports = router;
