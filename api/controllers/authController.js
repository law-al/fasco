const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const crypto = require('crypto');
const { sendMail } = require('../utils/sendEmail');

exports.checkStatus = asyncErrorHandler(async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'You are not logged in',
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'User is logged in',
    data: {
      user: req.session.user,
    },
  });
});

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
    return res.status(201).json({
      status: 'success',
      message: 'User created successfully',
    });
  }

  const user = await User.create(req.body);

  req.session.user = { id: user._id.toString(), email: user.email, firstname: user.firstname, lastname: user.lastname };

  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
  });
});

exports.login = asyncErrorHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new CustomError('User not found!', 400);

  if (!user && !(await user.isPasswordMatched(password, user.password))) throw new CustomError('User not found!', 404);

  req.session.user = { id: user._id.toString(), email: user.email, firstname: user.firstname, lastname: user.lastname };

  user.passwordResetToken = undefined;
  user.passwordResetTimer = undefined;
  await user.save({ validateBeforeSave: false });

  // assign user session max age
  req.session.cookie.maxAge = +process.env.USER_SESSION_MAX_AGE;

  res.status(200).json({
    status: 'success',
    message: 'User logged in successfully',
    data: {
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
      },
    },
  });
});

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new CustomError('Email not found', 400);

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

    res.status(200).json({
      status: 'success',
      message: 'Reset link sent',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTimer = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new CustomError('There was an error sending reset password email. Please try again later', 404));
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res) => {
  const { token } = req.params;

  const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken,
    passwordResetTimer: { $gte: Date.now() }, // meaning return queries where the passwordTimer is greater than Date.now()
  });

  if (!user) throw new CustomError('Reset link has expired', 404);

  user.password = req.body.newPassword;
  user.confirmPassword = req.body.newConfirmPassword;
  user.passwordChangedAt = Date.now();
  user.updatedAt = Date.now();
  user.passwordResetToken = undefined;
  user.passwordResetTimer = undefined;

  await user.save();

  req.session.destroy();
  res.clearCookie('connect.sid');

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully, Please login again',
  });
});
