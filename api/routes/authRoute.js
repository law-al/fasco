const { register, login, forgotPassword, resetPassword, checkStatus } = require('../controllers/authController');

const router = require('express').Router();

router.get('/check-status', checkStatus);
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').patch(resetPassword);

module.exports = router;
