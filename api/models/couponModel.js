const mongoose = require('mongoose');
const CustomError = require('../utils/CustomError');
const { StatusCodes } = require('http-status-codes');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUses: {
      type: Number,
      default: null,
      min: 1,
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (endDate) {
          return endDate > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// virtuals is like part of the mongoose schema that doesn't get saved to the database
couponSchema.virtual('couponIsValid').get(function () {
  const now = Date.now();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.maxUses === null || this.currentUses < this.maxUses)
  );
});

couponSchema.methods.applyCoupon = function (orderAmount) {
  if (!this.couponIsValid) {
    throw new CustomError('Coupon is invalid', StatusCodes.BAD_REQUEST);
  }

  if (orderAmount < this.minimumAmount) {
    throw new CustomError(`Minimum order is ${this.minimumAmount}`);
  }

  let discount = 0;
  if (this.type === 'percentage') {
    discount = orderAmount * (this.value / 100);
  } else if (this.type === 'fixed') {
    discount = this.value;
  }

  return {
    discount,
    finalAmount: orderAmount - discount,
  };
};

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
