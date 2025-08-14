const { StatusCodes } = require('http-status-codes');
const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');

exports.getAllUser = asyncErrorHandler(async (req, res) => {
  const users = await User.find();

  res.status(StatusCodes.OK).json({
    status: 'success',
    results: users.length, // ← Add count
    data: {
      users,
    },
  });
});

exports.updateMe = asyncErrorHandler(async (req, res) => {
  if (req.body.password || req.body.confirmPassword)
    throw new CustomError(
      'You cannot update your password using this endpoint',
      StatusCodes.BAD_REQUEST
    );

  const acceptedInput = ['firstname', 'lastname', 'email', 'phone', 'address'];
  const updateObj = {};

  Object.keys(req.body).forEach((val) => {
    if (acceptedInput.includes(val)) {
      updateObj[val] = req.body[val];
    }
  });

  const { address, ...otherFields } = updateObj;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    address
      ? {
          $set: otherFields,
          $push: { address: address },
          $currentDate: { updatedAt: true },
        }
      : {
          $set: updateObj,
          $currentDate: { updatedAt: true },
        },
    {
      runValidators: true,
      new: true,
    }
  );

  if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.updatePassword = asyncErrorHandler(async (req, res) => {
  const { currentPassword, password, confirmPassword } = req.body;

  if (!currentPassword || !password || !confirmPassword)
    throw new CustomError(
      'Please provide current password, new password and confirm password',
      StatusCodes.BAD_REQUEST
    );

  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

  const isMatch = await user.isPasswordMatched(currentPassword, user.password);
  if (!isMatch)
    throw new CustomError(
      'Current password is incorrect',
      StatusCodes.UNAUTHORIZED
    );

  user.password = password;
  user.confirmPassword = confirmPassword;
  user.passwordChangedAt = Date.now();
  user.updatedAt = Date.now();
  await user.save();

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Password updated successfully',
  });
});

exports.deleteMe = asyncErrorHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: { isActive: false },
    $currentDate: { updatedAt: true },
  });

  if (!user) throw new CustomError('User not logged in', StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'User account deleted successfully',
  });
});
