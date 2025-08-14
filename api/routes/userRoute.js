const {
  getAllUser,
  updateMe,
  updatePassword,
  deleteMe,
} = require('../controllers/userController');
const { checkRole } = require('../middleware/checkRole');
const { protect } = require('../middleware/protect');

const router = require('express').Router();

router.route('/get-users').get(protect, getAllUser);
router.route('/update-password').patch(protect, updatePassword);
router.route('/update-me').patch(protect, updateMe);
router.route('/delete-me').delete(protect, deleteMe);

module.exports = router;
