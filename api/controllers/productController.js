const { StatusCodes } = require('http-status-codes');
const Product = require('../models/productModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const Category = require('../models/categoryModel');

exports.addProduct = asyncErrorHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'A product has been added',
    data: {
      product,
    },
  });
});

exports.getAllProducts = asyncErrorHandler(async (req, res) => {
  const {
    slug,
    brand,
    material,
    size,
    gender,
    color,
    priceLevel,
    search,
    sort,
  } = req.query;

  if (slug) {
    const category = await Category.findOne({ slug });
    if (category) {
      queryObj.category = category._id;
    }
  }

  console.log(slug);

  const queryObj = {};
  if (brand) {
    queryObj.brand = brand;
  }

  if (material) {
    queryObj.material = { $regex: material, $options: 'i' };
  }

  if (size) {
    queryObj.sizes = size.toUpperCase();
  }

  if (gender) {
    queryObj.gender = gender;
  }

  if (color) {
    queryObj.colors = color;
  }

  if (priceLevel) {
    console.log(priceLevel);
    switch (priceLevel) {
      case 'budget':
        queryObj.price = { $gt: 0, $lte: 50 };
        break;
      case 'value':
        queryObj.price = { $gt: 50, $lte: 100 };
        break;
      case 'standard':
        queryObj.price = { $gt: 100, $lte: 150 };
        break;
      case 'premium':
        queryObj.price = { $gt: 150, $lte: 200 };
        break;
      case 'luxury':
        queryObj.price = { $gt: 200, $lte: 500 };
        break;
      case 'ultra':
        queryObj.price = { $gt: 500 };
        break;
      default:
        return;
    }
  }

  if (search) {
    queryObj.$text = { $search: search.replace(/-/g, ' ') };
  }

  const results = Product.find(queryObj)
    .populate('category', '-createdAt')
    .lean();

  const sortObj = {};
  if (sort) {
    switch (sort) {
      case 'priceAsc':
        sortObj.price = 1;
        break;
      case 'priceDesc':
        sortObj.price = -1;
        break;
      default:
        break;
    }
  } else {
    sortObj.createdAt = -1;
  }

  results.sort(sortObj);

  const limit = +req.query?.limit || 5;
  const page = +req.query?.page || 1;
  const skip = (page - 1) * limit;

  results.skip(skip).limit(limit);

  const products = await results;

  if (products.length === 0) {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Products not found',
      data: null,
    });
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    length: products.length,
    data: {
      products,
    },
  });
});

exports.getFeatured = asyncErrorHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true });

  res.status(StatusCodes.OK).json({
    status: 'success',
    length: products.length,
    data: {
      products,
    },
  });
});

exports.getProduct = asyncErrorHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product)
    throw new CustomError('No product found', StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      product,
    },
  });
});
