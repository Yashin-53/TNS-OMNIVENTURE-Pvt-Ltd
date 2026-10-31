const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendOtp = require('../utils/sendOtp');
const httpError = require('../utils/httpError');

// identifier can be a phone number or an email
const byIdentifier = (identifier) => {
  const value = String(identifier || '').trim();
  return value.includes('@') ? { email: value.toLowerCase() } : { phone: value };
};

const sendSession = (res, user, status = 200) =>
  res.status(status).json({ token: generateToken(user._id), user });

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, phone, email, password, location, role } = req.body;
  const user = await User.create({
    name,
    phone,
    email,
    password,
    location,
    role: role === 'seller' ? 'seller' : 'buyer', // admin can never be created from here
  });
  sendSession(res, user, 201);
};

// POST /api/auth/login  { identifier, password }
exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  const user = await User.findOne(byIdentifier(identifier)).select('+password');
  if (!user || !(await user.comparePassword(String(password || '')))) {
    throw httpError(401, 'Invalid phone/email or password');
  }
  if (!user.isActive) throw httpError(403, 'Your account is deactivated. Please contact support.');
  sendSession(res, user);
};

// POST /api/auth/send-otp  { identifier }
exports.sendLoginOtp = async (req, res) => {
  const user = await User.findOne(byIdentifier(req.body.identifier));
  if (!user) throw httpError(404, 'No account found with this phone or email');
  if (!user.isActive) throw httpError(403, 'Your account is deactivated. Please contact support.');

  const otp = String(crypto.randomInt(100000, 1000000));
  user.otpHash = await bcrypt.hash(otp, 10);
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // valid for 5 minutes
  user.otpAttempts = 0;
  await user.save();
  await sendOtp(user, otp);

  // devOtp is returned only outside production so you can test without an SMS provider
  res.json({
    message: 'OTP sent',
    ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
  });
};

// POST /api/auth/verify-otp  { identifier, otp }
exports.verifyLoginOtp = async (req, res) => {
  const user = await User.findOne(byIdentifier(req.body.identifier)).select(
    '+otpHash +otpExpires +otpAttempts'
  );
  if (!user || !user.otpHash || user.otpExpires < new Date()) {
    throw httpError(400, 'OTP expired. Please request a new one');
  }
  if (!user.isActive) throw httpError(403, 'Your account is deactivated. Please contact support.');

  if (!(await bcrypt.compare(String(req.body.otp || ''), user.otpHash))) {
    user.otpAttempts += 1;
    if (user.otpAttempts >= 5) user.otpHash = undefined; // too many wrong tries
    await user.save();
    throw httpError(400, 'Incorrect OTP');
  }

  user.otpHash = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await user.save();
  sendSession(res, user);
};

// GET /api/auth/me
exports.getMe = (req, res) => res.json(req.user);
