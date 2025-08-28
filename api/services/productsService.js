const Product = require('../models/productModel');
const { StatusCodes } = require('http-status-codes');

exports.findProductByName = async function (productName) {
  // This is done for exact match of the product name
  const words = productName.trim().split(/\s+/);
  const regexCondition = words.map(word => {
    return { name: { $regex: word, $options: 'i' } };
  });

  // regexCondition [{name: {$regex: 'red", $options: "i"}},{name: {$regex: 'dress", $options: "i"}} ] if user search for red dress

  try {
    let product = await Product.findOne({ $and: regexCondition });

    if (!product) {
      return {
        error: 'Product not found',
        message: `Product not found with product or product does not exist`,
      };
    }

    return {
      status: 'success',
      product: {
        id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.salesPrice || product.price,
        sizes: product.sizes,
        colors: product.colors,
        onSale: product.salesPrice ? true : false,
        inventory: product.inventory,
        product_link: `http://localhost:3000/collections/${product.name.split(' ').join('-')}`,
      },
    };
  } catch (error) {
    return { error: 'Product not found' };
  }
};

exports.findProductByCriteria = async function (criteria) {
  try {
    let query = {
      $or: [
        { name: { $regex: criteria.query || criteria.product_name, $options: 'i' } },
        { description: { $regex: criteria.product_name, $options: 'i' } },
        { shortDescription: { $regex: criteria.product_name, $options: 'i' } },
      ],
    };

    if (criteria.size) {
      query.sizes = { $in: [criteria.size] };
    }

    if (criteria.min_price || criteria.max_price) {
      query.$and = query.$and || [];

      if (criteria.min_price) {
        // Price >= min_price
        query.$and.push({
          $or: [
            { salesPrice: { $gte: criteria.min_price } }, // On sale price
            {
              $and: [
                { salesPrice: { $exists: false } }, // No sale price
                { price: { $gte: criteria.min_price } }, // Regular price
              ],
            },
          ],
        });
      }

      if (criteria.max_price) {
        // Price <= max_price
        query.$and.push({
          $or: [
            { salesPrice: { $lte: criteria.max_price } }, // On sale price
            {
              $and: [
                { salesPrice: { $exists: false } }, // No sale price
                { price: { $lte: criteria.max_price } }, // Regular price
              ],
            },
          ],
        });
      }
    }

    if (criteria.on_sale === true) {
      query.salesPrice = { $exists: true, $ne: null };
    } else if (criteria.on_sale === false) {
      query.$or = [{ salesPrice: { $exists: false } }, { salesPrice: null }];
    }

    if (criteria.gender === 'unisex') {
      query.gender = { $in: ['men', 'women'] };
    } else {
      query.gender = { $in: [criteria.gender] };
    }

    let products = await Product.find(query).populate('category').limit(20);

    if (products.length === 0) {
      return {
        error: 'Product not found',
        message: `No products found matching: ${productName}`,
        searchCriteria: criteria,
      };
    }

    const processedProducts = products.map(product => {
      const actualPrice = product.salesPrice || product.price;
      return {
        id: product._id,
        name: product.name,
        description: product.description,
        category: product.category?.name || 'Unknown',
        price: actualPrice,
        originalPrice: product.price,
        sizes: product.sizes,
        colors: product.colors,
        gender: product.gender,
        onSale: product.salesPrice ? true : false,
        discount: product.salesPrice ? Math.round(((product.price - product.salesPrice) / product.price) * 100) : 0,
        product_link: `http://localhost:3000/collections/${product.name.split(' ').join('-')}`,
      };
    });

    return {
      success: true,
      length: products.length,
      searchCriteria: criteria,
      products: processedProducts,
      message: `Found ${products.length} product(s) matching your criteria.`,
    };
  } catch (error) {
    return { error: 'Search failed' };
  }
};
