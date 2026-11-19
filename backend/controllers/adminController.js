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

  const validSorts = ['joined_desc', 'joined_asc', 'listings_desc', 'listings_asc'];
  const sort = validSorts.includes(req.query.sort) ? req.query.sort : 'joined_desc';
  const [users, listingCounts] = await Promise.all([
    User.find(filter),
    Property.aggregate([{ $group: { _id: '$owner', count: { $sum: 1 } } }]),
  ]);
  const countsByOwner = new Map(listingCounts.map(({ _id, count }) => [String(_id), count]));
  const results = users.map((user) => ({
    ...user.toJSON(),
    listingCount: countsByOwner.get(String(user._id)) || 0,
  }));
  const joinedDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

  results.sort((a, b) => {
    if (sort === 'joined_asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === 'listings_desc') return (b.listingCount - a.listingCount) || joinedDate(a, b);
    if (sort === 'listings_asc') return (a.listingCount - b.listingCount) || joinedDate(a, b);
    return joinedDate(a, b);
  });
  res.json(results);
};

// GET /api/admin/properties  (includes hidden ones)
exports.getProperties = async (req, res) => {
  const validSorts = ['newest', 'views_desc', 'views_asc', 'price_asc', 'price_desc'];
  const sort = validSorts.includes(req.query.sort) ? req.query.sort : 'newest';
  const properties = await Property.find()
    .select('+views')
    .populate('owner', 'name phone');
  const createdAtDesc = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
  properties.sort((a, b) => {
    if (sort === 'views_desc') return ((b.views || 0) - (a.views || 0)) || createdAtDesc(a, b);
    if (sort === 'views_asc') return ((a.views || 0) - (b.views || 0)) || createdAtDesc(a, b);
    if (sort === 'price_asc') return (a.price - b.price) || createdAtDesc(a, b);
    if (sort === 'price_desc') return (b.price - a.price) || createdAtDesc(a, b);
    return createdAtDesc(a, b);
  });
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
