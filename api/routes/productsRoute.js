const {
  addCategory,
  getAllCategories,
} = require('../controllers/categoryController');
const {
  addProduct,
  getAllProducts,
  getFeatured,
  getProduct,
} = require('../controllers/productController');
const { checkRole } = require('../middleware/checkRole');
const { protect } = require('../middleware/protect');

const router = require('express').Router();

// ==========================================
// CATEGORY
// ==========================================
router.route('/get-all-categories').get(getAllCategories);
router.route('/add-category').post(protect, checkRole('admin'), addCategory);

// ==========================================
// PRODUCT
// ==========================================
router.route('/get-all-products').get(getAllProducts);
router.route('/get-featured-products').get(getFeatured);
router.route('/get-product/:productId').get(getProduct);
router.route('/add-product').post(protect, checkRole('admin'), addProduct);
// remain update and delete products

module.exports = router;
