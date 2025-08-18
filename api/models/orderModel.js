const mongoose = require('mongoose');

const orderItemsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  color: String,
  size: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: String,
  sku: String,
});

const shippingAddressSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
  },
  street: {
    type: String,
    required: [true, 'A street is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'A city is required'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'A state is required'],
    trim: true,
  },
  zipCode: {
    type: String,
    required: [true, 'A zip code is required'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'A country is required'],
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
});

const billingSchema = new mongoose.Schema({
  subTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['card', 'bank_transfer', 'mobile_money', 'apple_pay', 'google_pay', 'crypto'],
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: String,
  paidAt: Date,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customerEmail: {
      type: String,
      validate: {
        validator: function (email) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: 'Please enter a valid email address',
      },
    },
    items: {
      type: [orderItemsSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    billing: {
      type: billingSchema,
      required: true,
    },
    payment: {
      type: paymentSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    note: {
      type: String,
      maxlength: 500,
    },
    trackingNumber: String,
  },
  {
    timestamps: true,
  }
);

// Validation to ensure either userId or customerEmail is provided
orderSchema.pre('validate', function () {
  if (!this.userId && !this.customerEmail) {
    this.invalidate('userId', 'Either userId or customerEmail must be provided');
  }
});

// Index for common queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customerEmail: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
