const CustomError = require('../utils/CustomError');
const { StatusCodes } = require('http-status-codes');

exports.checkRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return next(
        new CustomError(`User not ${role}`, StatusCodes.UNAUTHORIZED)
      );
    }

    next();
  };
};
