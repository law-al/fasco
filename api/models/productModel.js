const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
    },
    altText: String,
    color: String,
    isPrimary: Boolean,
  },
  {
    _id: false,
  }
);

const inventorySchema = new mongoose.Schema({
  color: {
    type: String,
    lowercase: true,
  },
  size: String,
  quantity: {
    type: Number,
    min: [0, 'Quantity cannot be negative'],
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Product name is required'],
      lowercase: true,
      minLength: [2, 'Product name must be at least 2 characters long'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      lowercase: true,
      minLength: [10, 'Description must be at least 10 characters long'],
      trim: true,
    },
    shortDescription: {
      type: String,
      lowercase: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than zero'],
    },
    salesPrice: {
      type: Number,
      validate: {
        validator: function (value) {
          return !value || value <= this.price;
        },
        message: 'Sale price cannot exceed regular price',
      },
    },
    category: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    ], // should in case something changes in the category schema, it automatically updates
    brand: {
      type: String,
      lowercase: true,
    },
    material: {
      type: String,
      lowercase: true,
    },
    colors: {
      type: [String],
      lowercase: true,
    },
    sizes: {
      type: [String],
      lowercase: true,
    },
    gender: {
      type: [String],
      lowercase: true,
    },
    images: [imageSchema],
    inventory: [inventorySchema],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
