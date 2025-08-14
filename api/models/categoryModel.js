const { mongoose } = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      lowercase: true,
      minLength: [2, 'Category name must be at least 2 characters long'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
        },
        message: 'Slug must contain only letters, numbers, and hyphens',
      },
    },
    description: {
      type: String,
      required: [true, 'Category description is required'],
      lowercase: true,
      minLength: [10, 'Description must be at least 10 characters long'],
      trim: true,
    },
    image: String,
    isActive: Boolean,
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
