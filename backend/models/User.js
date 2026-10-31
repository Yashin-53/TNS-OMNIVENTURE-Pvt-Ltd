const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true, // email is optional, but unique when present
      set: (v) => v || undefined,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
    isActive: { type: Boolean, default: true },

    // login by OTP
    otpHash: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.otpHash;
    delete ret.otpExpires;
    delete ret.otpAttempts;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
