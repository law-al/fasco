const { getAllUser, updateMe, updatePassword, deleteMe } = require('../controllers/userController');
const { checkRole } = require('../middleware/checkRole');

const router = require('express').Router();

router.route('/get-users').get(getAllUser);
router.route('/update-password').patch(updatePassword);
router.route('/update-me').patch(updateMe);
router.route('/delete-me').delete(deleteMe);

module.exports = router;
