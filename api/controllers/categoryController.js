const { StatusCodes } = require('http-status-codes');
const Category = require('../models/categoryModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');

exports.addCategory = asyncErrorHandler(async (req, res) => {
  const category = await Category.create(req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'A category has been added',
    data: {
      category,
    },
  });
});

exports.getAllCategories = asyncErrorHandler(async (req, res) => {
  const categories = await Category.find();

  if (!categories)
    throw new CustomError('No categories found', StatusCodes.BAD_REQUEST);

  res.status(StatusCodes.OK).json({
    status: 'success',
    length: categories.length,
    data: {
      categories,
    },
  });
});
