const { default: mongoose } = require('mongoose');

const dealsSchema = new mongoose.Schema(
  {
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    ],
    dealType: {
      type: String,
      enum: ['deal-of-month', 'flash-sale', 'seasonal'],
      default: 'deal-of-month',
    },
    title: {
      type: String,
      required: [true, 'A deal title is required'],
    },
    description: {
      type: String,
      required: [true, 'A deal description is required'],
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dealsSchema.index({ isActive: 1, endDate: 1 });
const Deal = mongoose.model('Deal', dealsSchema);

module.exports = Deal;
