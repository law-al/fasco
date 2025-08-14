const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const jwt = require('jsonwebtoken');

exports.protect = asyncErrorHandler(async (req, res, next) => {
  if (!req.session)
    throw new CustomError('Session expired, Please login again', 400);

  if (!req.session.user?.token)
    throw new CustomError('User not logged in', 400);

  const { token } = req.session.user;

  const decodedToken = jwt.verify(token, process.env.JWT_PASS);

  if (!decodedToken)
    throw new CustomError('Something went wrong, Please login again', 400);

  const user = await User.findById(decodedToken.id);

  // check if password is changed
  // This ensures any JWT issued before a password change becomes invalid,
  // so stolen tokens can't be used after the password is updated.
  const isModified = user.passwordModified(decodedToken.iat);

  if (isModified)
    throw new CustomError('Password has been changed, Please login again', 400);

  req.user = user;
  next();
});
