require('dotenv').config({ path: './config.env' });
const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const CustomError = require('../utils/CustomError');
const { sendMail } = require('../utils/sendEmail');

exports.register = asyncErrorHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user,
    },
  });
});

exports.login = asyncErrorHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.isPasswordMatched(password, user.password))) throw new CustomError('Incorrect email or password', 401);

  const accessToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_PASS, {
    expiresIn: '5m',
  });

  const refreshToken = jwt.sign({ id: user._id, email: user.email }, process.env.REFRESH_TOKEN_PASS, {
    expiresIn: '7d',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: 'success',
    message: 'User logged in successfully',
    accessToken,
    data: {
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    },
  });
});

exports.refreshToken = asyncErrorHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) throw new CustomError('No refresh token provided', 401);

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_PASS);

  if (!decoded) throw new CustomError('Invalid refresh token', 403);

  const user = await User.findById(decoded.id);

  if (!user) throw new CustomError('User not found', 404);

  const passwordIsModified = await user.passwordModified(decoded.iat);

  if (passwordIsModified) throw new CustomError('Password changed recently. Please log in again.', 401);

  const accessToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_PASS, {
    expiresIn: '5m',
  });

  res.status(200).json({
    status: 'success',
    accessToken,
    data: {
      user: {
        id: user._id,
        email: user.email,
      },
    },
  });
});

exports.forgetPassWord = asyncErrorHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) throw new CustomError('User not found', 404);

  const passwordResetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const requestUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${passwordResetToken}`;
  const text = `We have recieved a password request. Please use the below link to reset your password\n\n${requestUrl}\n\nThis reset password link will be valid for only 10mins`;

  try {
    await sendMail({
      email: user.email,
      subject: 'Password Reset Request',
      text,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTimer = undefined;
    await user.save({ validateBeforeSave: false });
    throw new CustomError('Email could not be sent, please try again', 500);
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res) => {
  const { resetToken } = req.params;

  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedResetToken, passwordResetTimer: { $gt: Date.now() } });

  if (!user) throw new CustomError('Invalid or expired password reset token', 400);

  user.password = req.body.newPassword;
  user.confirmPassword = req.body.newConfirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTimer = undefined;
  user.passwordChangedAt = Date.now();
  await user.save({
    validateBeforeSave: false,
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful',
  });
});
