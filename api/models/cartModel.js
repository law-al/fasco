const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    sku: String,
    color: String,
    size: String,
    iamge: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    priceAtTimeAdded: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    guestId: String,
    items: [cartItemSchema],
    totalPrice: Number,
    expiresAt: Date,
    appliedCoupon: {
      code: String,
      discount: Number,
      appliedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
