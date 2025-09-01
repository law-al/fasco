const { addCategory, getAllCategories } = require('../controllers/categoryController');
const { addProduct, getAllProducts, getFeatured, getProduct, getAllDealsOfTheMonth, addDeals, getNewArrivals } = require('../controllers/productController');
const { checkRole } = require('../middleware/checkRole');

const router = require('express').Router();

// ==========================================
// CATEGORY
// ==========================================
router.route('/get-all-categories').get(getAllCategories);
router.route('/add-category').post(checkRole('admin'), addCategory);

// ==========================================
// PRODUCT
// ==========================================
router.route('/products').get(getAllProducts);
router.route('/featured-products').get(getFeatured);
router.route('/get-product/:productId').get(getProduct);
router.route('/deals-of-the-month').get(getAllDealsOfTheMonth);
router.route('/new-arrivals').get(getNewArrivals);
router.route('/add-deals').post(addDeals);
router.route('/add-product').post(checkRole('admin'), addProduct);
// remain update and delete products

module.exports = router;
