const { StatusCodes } = require('http-status-codes');
const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');

exports.getAllUser = asyncErrorHandler(async (req, res) => {
  const users = await User.find();

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Users fetched successfully',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = asyncErrorHandler(async (req, res) => {
  if (req.body.password || req.body.confirmPassword) throw new CustomError('You cannot update your password using this endpoint', StatusCodes.BAD_REQUEST);

  const acceptedInput = ['firstname', 'lastname', 'email', 'phone', 'address'];
  const updateObj = {};

  Object.keys(req.body).forEach(val => {
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
      returnDocument: 'after',
    }
  );

  if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      address: user.address,
    },
  });
});

exports.updatePassword = asyncErrorHandler(async (req, res) => {
  const { currentPassword, newPassword, newConfirmPassword } = req.body;

  if (!currentPassword || !newPassword || !newConfirmPassword) {
    throw new CustomError('Please provide all fields', StatusCodes.BAD_REQUEST);
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

  const isMatch = await user.isPasswordMatched(currentPassword, user.password);

  if (!isMatch) throw new CustomError('Current password is incorrect', StatusCodes.UNAUTHORIZED);

  user.password = newPassword;
  user.confirmPassword = newConfirmPassword;
  await user.save();

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Password updated successfully',
  });
});
