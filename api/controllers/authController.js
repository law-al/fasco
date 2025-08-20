const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail } = require('../utils/sendEmail');
const { StatusCodes } = require('http-status-codes');
const { skipMiddlewareFunction } = require('mongoose');

const signToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_PASS, {
    expiresIn: 30 * 60 * 1000,
  });
};

exports.register = asyncErrorHandler(async (req, res) => {
  // check if user exist and is not active

  const existingUser = await User.findOne({
    $and: [{ email: req.body.email }, { isActive: false }],
  }).setOptions({ addIsInActive: true });

  if (existingUser) {
    existingUser.firstname = req.body.firstname;
    existingUser.lastname = req.body.lastname;
    existingUser.phone = req.body.phone;
    existingUser.password = req.body.password;
    existingUser.confirmPassword = req.body.confirmPassword;
    existingUser.address = req.body.address;
    existingUser.isActive = true;
    existingUser.updatedAt = Date.now();
    existingUser.passwordResetToken = undefined;
    existingUser.passwordResetTimer = undefined;

    await existingUser.save();
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'User created successfully',
    });
  }

  // check if user exist and is active
  const existingUserIsActive = await User.findOne({
    $and: [{ email: req.body.email }, { isActive: true }],
  });

  if (existingUserIsActive) throw new CustomError('User has signed up already', StatusCodes.BAD_REQUEST);

  // else
  const user = await User.create(req.body);

  const token = signToken(user._id);

  req.session.user = { id: user._id.toString(), token };

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    message: 'user created',
  });
});

exports.login = asyncErrorHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new CustomError('user not found!', StatusCodes.BAD_REQUEST);

  const isMatch = await user.isPasswordMatched(password, user.password);

  if (!isMatch) throw new CustomError('wrong credentials!', StatusCodes.BAD_REQUEST);
  const token = signToken(user._id);

  req.session.user = { id: user._id.toString(), token };

  user.passwordResetToken = undefined;
  user.passwordResetTimer = undefined;

  // assign user session max age
  req.session.cookie.maxAge = +process.env.USER_SESSION_MAX_AGE;

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'user logged in',
  });
});

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new CustomError('Email not correct', StatusCodes.BAD_REQUEST);

  const resetToken = user.createResetPasswordToken();
  // calling this function set a passwordResetToken and a passwordResetTimer, then save the user
  await user.save({
    validateBeforeSave: false,
  });

  const requestUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
  const text = `We have recieved a password request. Please use the below link to reset your password\n\n${requestUrl}\n\nThis reset password link will be valid for only 10mins`;

  try {
    await sendMail({
      to: user.email,
      subject: `Password change request`,
      text,
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'reset link sent',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTimer = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new CustomError(
        'There was an error sending reset password email. Please try again later',
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res) => {
  const { token } = req.params;

  const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken,
    passwordResetTimer: { $gte: Date.now() }, // meaning return queries where the passwordTimer is greater than Date.now()
  });

  if (!user) throw new CustomError('Reset link has expired', StatusCodes.BAD_REQUEST);

  user.password = req.body.newPassword;
  user.confirmPassword = req.body.newConfirmPassword;
  user.passwordChangedAt = Date.now();
  user.updatedAt = Date.now();
  user.passwordResetToken = undefined;
  user.passwordResetTimer = undefined;

  await user.save();

  req.session.destroy();
  res.clearCookie('connect.sid');

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'password reset successfully, proceed to login',
  });
});
