const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema({
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
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, 'A firstname is required'],
      trim: true,
      lowercase: true,
      minLength: [2, 'Firstname must be at least 2 characters'],
    },
    lastname: {
      type: String,
      required: [true, 'A lastname is required'],
      trim: true,
      lowercase: true,
      minLength: [2, 'Lastname must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'An email is required'],
      unique: [true, 'Email already registered'],
      validate: [validator.isEmail, 'Email not valid'],
      lowercase: true, // Good practice for emails
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      // validate: {
      //   validator: function(v) {
      //     return validator.isMobilePhone(v, 'any');
      //   },
      //   message: 'Phone number not valid'
      // },
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
    },
    password: {
      type: String,
      required: [true, 'A password is required'],
      minLength: [4, 'Password must be at least 4 characters long'],
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'A password is required'],
      minLength: [4, 'Password must be 4 characters long'],
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'Password mismatch',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    address: [addressSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTimer: Date,
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.password;
        delete ret.confirmPassword;

        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.password;
        delete ret.confirmPassword;

        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  // if the current doc the this doc (the password) is not modified, proceed.... else we hash it
  if (!this.isModified('password')) next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre(/^find/, async function (next) {
  if (this.getOptions().addIsInActive) {
    this.find();
  } else {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

userSchema.methods.isPasswordMatched = async (inputedPassword, hashedPasswordFromDB) => {
  return await bcrypt.compare(inputedPassword, hashedPasswordFromDB);
};

userSchema.methods.passwordModified = function (issuedAtToken) {
  if (this.passwordChangedAt) {
    const passwordChangedDate = parseInt(new Date(this.passwordChangedAt).getTime()) / 1000;

    return issuedAtToken < passwordChangedDate;
  }
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetToken = hashedToken;
  this.passwordResetTimer = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema); // Convention: capitalize model names
module.exports = User;
