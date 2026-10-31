const User = require('../models/User');
const removeUser = require('../utils/removeUser');
const httpError = require('../utils/httpError');

// PUT /api/users/me
exports.updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  ['name', 'phone', 'email', 'location'].forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });
  // buyers and sellers can switch role, admin stays admin
  if (user.role !== 'admin' && ['buyer', 'seller'].includes(req.body.role)) {
    user.role = req.body.role;
  }

  await user.save();
  res.json(user);
};

// PUT /api/users/me/password  { currentPassword, newPassword }
exports.changePassword = async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(String(req.body.currentPassword || '')))) {
    throw httpError(400, 'Current password is incorrect');
  }
  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
};

// DELETE /api/users/me  { password }
exports.deleteAccount = async (req, res) => {
  if (req.user.role === 'admin') throw httpError(400, 'Admin account cannot be deleted');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(String(req.body.password || '')))) {
    throw httpError(400, 'Password is incorrect');
  }
  await removeUser(user);
  res.json({ message: 'Account deleted' });
};
