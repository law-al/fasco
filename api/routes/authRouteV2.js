const express = require('express');
const { register, login, refreshToken, forgetPassWord, resetPassword } = require('../controllers/authControllerV2');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forget-password', forgetPassWord);
router.patch('/reset-password/:resetToken', resetPassword);

module.exports = router;
