const User = require('../models/User');
const Property = require('../models/Property');
const removeUser = require('../utils/removeUser');
const httpError = require('../utils/httpError');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  const [buyers, sellers, properties, inactiveUsers] = await Promise.all([
    User.countDocuments({ role: 'buyer' }),
    User.countDocuments({ role: 'seller' }),
    Property.countDocuments(),
    User.countDocuments({ isActive: false }),
  ]);
  res.json({ buyers, sellers, properties, inactiveUsers });
};

// GET /api/admin/users?q=
exports.getUsers = async (req, res) => {
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { location: rx }];
  }
  res.json(await User.find(filter).sort({ createdAt: -1 }));
};

// GET /api/admin/properties  (includes hidden ones)
exports.getProperties = async (req, res) => {
  const properties = await Property.find()
    .populate('owner', 'name phone')
    .sort({ createdAt: -1 });
  res.json(properties);
};

const findManagedUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw httpError(404, 'User not found');
  if (user.role === 'admin') throw httpError(400, 'Admin accounts cannot be changed here');
  return user;
};

// PATCH /api/admin/users/:id/status  - toggles active / deactivated
exports.toggleUserStatus = async (req, res) => {
  const user = await findManagedUser(req.params.id);
  user.isActive = !user.isActive;
  await user.save();
  // a deactivated user's listings are hidden from the site until reactivated
  await Property.updateMany({ owner: user._id }, { isActive: user.isActive });
  res.json(user);
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  const user = await findManagedUser(req.params.id);
  await removeUser(user);
  res.json({ message: 'User deleted' });
};
