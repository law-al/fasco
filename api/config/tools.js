const Product = require('../models/productModel');

const tools = [
  {
    type: 'function',
    name: 'get_product_by_name',
    description: 'Get additional details (materials, care instructions, inventory) for a specific product that was already shown in search results',
    parameters: {
      type: 'object',
      properties: {
        product_name: {
          type: 'string',
          description: 'Exact product name from previous search results that user wants details about',
        },
      },
      required: ['product_name'],
    },
  },

  {
    type: 'function',
    name: 'get_products_by_criteria',
    description: 'Search for products by name or description to find their IDs.',
    parameters: {
      type: 'object',
      properties: {
        product_name: {
          type: 'string',
          description: 'The main search term from the user input (product name, description, or general search term)',
        },
        size: {
          type: 'string',
          description: 'Optional: Filter by specific size',
          enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', '6', '7', '8', '9', '10', '11', '12'],
        },
        min_price: {
          type: 'number',
          description: 'Optional: Minimum price filter in USD (e.g., 25.99)',
          minimum: 0,
        },
        max_price: {
          type: 'number',
          description: 'Optional: Maximum price filter in USD (e.g., 199.99)',
          minimum: 0,
        },
        gender: {
          type: 'string',
          description: 'Optional: Filter by target gender/demographic',
          enum: ['men', 'women', 'unisex', 'boys', 'girls', 'kids'],
        },
        material: {
          type: 'string',
          description: 'Optional: Filter by material or fabric type.',
          enum: ['cotton', 'polyester', 'wool', 'silk', 'denim', 'leather', 'linen', 'cashmere', 'blend'],
        },
        color: {
          type: 'string',
          description: 'Optional: Filter by color',
        },
        on_sale: {
          type: 'boolean',
          description: 'Optional: Filter for products currently on sale/discount (true) or regular price items (false)',
        },
        sort_by: {
          type: 'string',
          description: 'Optional: How to sort the results',
          enum: ['price_low_to_high', 'price_high_to_low', 'newest', 'popular', 'rating'],
        },
        limit: {
          type: 'integer',
          description: 'Optional: Maximum number of products to return (default: 10, max: 50)',
          minimum: 1,
          maximum: 50,
          default: 10,
        },
      },
      required: ['product_name'],
    },
  },

  // {

  // }
];

module.exports = tools;
