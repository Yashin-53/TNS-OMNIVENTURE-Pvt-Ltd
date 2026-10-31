const Property = require('../models/Property');
const Review = require('../models/Review');
const httpError = require('../utils/httpError');

// GET /api/properties/:id/reviews
exports.getReviews = async (req, res) => {
  const reviews = await Review.find({ property: req.params.id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  res.json(reviews);
};

// POST /api/properties/:id/reviews  { rating, pros, cons }
exports.addReview = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property || !property.isActive) throw httpError(404, 'Property not found');
  if (String(property.owner) === String(req.user._id)) {
    throw httpError(400, 'You cannot review your own property');
  }
  if (await Review.findOne({ property: property._id, user: req.user._id })) {
    throw httpError(400, 'You have already reviewed this property');
  }

  const { rating, pros, cons } = req.body;
  if (!pros?.trim() && !cons?.trim()) throw httpError(400, 'Write at least one pro or con');

  const review = await Review.create({ property: property._id, user: req.user._id, rating, pros, cons });
  await Review.calcStats(property._id);
  await review.populate('user', 'name');
  res.status(201).json(review);
};

// DELETE /api/reviews/:id  (review author or admin)
exports.deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw httpError(404, 'Review not found');
  if (req.user.role !== 'admin' && String(review.user) !== String(req.user._id)) {
    throw httpError(403, 'You can only delete your own review');
  }
  await review.deleteOne();
  await Review.calcStats(review.property);
  res.json({ message: 'Review deleted' });
};
