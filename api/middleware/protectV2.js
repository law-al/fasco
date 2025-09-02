const User = require('../models/userModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');

exports.protect = asyncErrorHandler(async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    throw new CustomError('Not authorized', 401);
  }

  const token = req.headers.authorization.split(' ')[1];

  if (!token) throw new CustomError('Not authorized', 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_PASS);

    if (!decoded) throw new CustomError('Invalid token', 403);

    const user = await User.findById(decoded.id);

    if (!user) throw new CustomError('User not found', 404);

    req.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      throw new CustomError('Invalid token', 403);
    }
    throw error;
  }
});
