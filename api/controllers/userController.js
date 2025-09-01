const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');

exports.getAllUser = asyncErrorHandler(async (req, res) => {
  if (!req.selectedUser || req.selectedUser.role !== 'admin') {
    throw new CustomError('Unauthorized access', 403);
  }

  const users = await User.find();

  res.status(200).json({
    status: 'success',
    message: 'Users retrieved successfully',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = asyncErrorHandler(async (req, res) => {
  if (req.body.password || req.body.confirmPassword) throw new CustomError('You cannot update your password using this endpoint', 400);

  const acceptedInput = ['firstname', 'lastname', 'email', 'phone', 'address'];
  const updateObj = {};

  Object.keys(req.body).forEach(val => {
    if (acceptedInput.includes(val)) {
      updateObj[val] = req.body[val];
    }
  });

  const { address, ...otherFields } = updateObj;

  const user = await User.findByIdAndUpdate(
    req.user.id,
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

  if (!user) throw new CustomError('User not found', 404);

  res.status(200).json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      user,
    },
  });
});

exports.updatePassword = asyncErrorHandler(async (req, res) => {
  const { currentPassword, password, confirmPassword } = req.body;

  if (!currentPassword || !password || !confirmPassword) throw new CustomError('Please provide current password, new password and confirm password', 400);

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new CustomError('User not found', 404);

  const isMatch = await user.isPasswordMatched(currentPassword, user.password);
  if (!isMatch) throw new CustomError('Current password is incorrect', 401);

  user.password = password;
  user.confirmPassword = confirmPassword;
  user.passwordChangedAt = Date.now();
  user.updatedAt = Date.now();
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully',
  });
});

exports.deleteMe = asyncErrorHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, {
    $set: { isActive: false },
    $currentDate: { updatedAt: true },
  });

  if (!user) throw new CustomError('User not logged in', 404);

  res.status(200).json({
    status: 'success',
    message: 'User account deleted successfully',
  });
});
