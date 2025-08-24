const { StatusCodes } = require('http-status-codes');
const Product = require('../models/productModel');
const { asyncErrorHandler } = require('../utils/asyncHandler');
const CustomError = require('../utils/CustomError');
const Category = require('../models/categoryModel');
const Deal = require('../models/dealsModel');

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
  const { slug, brand, material, size, gender, color, priceLevel, search, sort } = req.query;

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

  const results = Product.find(queryObj).populate('category', '-createdAt').lean();

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

  if (!product) throw new CustomError('No product found', StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      product,
    },
  });
});

exports.getNewArrivals = asyncErrorHandler(async (req, res) => {
  const { option } = req.query;
  let products;

  if (option === 'all') {
    products = await Product.find({ isActive: true }).sort({ createdAt: 1 }).limit(6);
  } else {
    products = await Product.find({ isActive: true })
      .populate({
        path: 'category',
        match: {
          slug: {
            $regex: `^${option}`,
            $options: 'i',
          },
        },
      })
      .sort({ createdAt: 1 });

    products = products.filter(product => product.category.length > 0).splice(0, 6);
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      products,
    },
  });
});

//  Deals

exports.checkExpiredDeals = async () => {
  try {
    const expiredDeals = await Deal.updateMany(
      { isActive: true, endDate: { $lt: new Date() } },
      {
        $set: { isActive: false },
      }
    );

    if (expiredDeals.length) {
      console.log(`${expiredDeals.length} deal is set to inActive`);
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

exports.getAllDealsOfTheMonth = asyncErrorHandler(async (req, res) => {
  // await checkExpiredDeals();
  const deals = await Deal.find({
    dealType: 'deal-of-month',
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  })
    .populate({
      path: 'products',
      match: { isActive: true },
    })
    .sort({ priority: -1 })
    .lean(); // return plain object instead of mongoose document

  if (deals?.length === 0) {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'No deals found',
      data: {
        deals,
      },
    });
  }

  // because .populate returns product that is match, it also returns product that does match, by setting it to null

  const dealResponse = deals
    .filter(deal => deal.products && deal.products.length > 0)
    .map(deal => {
      const productsWithDiscounts = deal.products.map(product => ({
        ...product,
        discountPrice: product.price - (product.price * deal.discountPercentage) / 100,
      }));

      return {
        products: productsWithDiscounts,
        dealType: deal.dealType,
        title: deal.title,
        description: deal.description,
        discountPercentage: deal.discountPercentage,
        endDate: deal.endDate,
      };
    });

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      deals: dealResponse,
    },
  });
});

exports.addDeals = asyncErrorHandler(async (req, res) => {
  await Deal.create(req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Deal successfully created',
  });
});
