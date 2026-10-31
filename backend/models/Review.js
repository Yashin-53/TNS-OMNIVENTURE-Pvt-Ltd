const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
    pros: { type: String, trim: true, maxlength: 500 },
    cons: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true } // createdAt is the review date
);

// one review per user per property
reviewSchema.index({ property: 1, user: 1 }, { unique: true });

// Recalculate the average rating stored on the property
reviewSchema.statics.calcStats = async function (propertyId) {
  const id = new mongoose.Types.ObjectId(propertyId);
  const [stats] = await this.aggregate([
    { $match: { property: id } },
    { $group: { _id: '$property', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await mongoose.model('Property').findByIdAndUpdate(id, {
    ratingAvg: stats ? Math.round(stats.avg * 10) / 10 : 0,
    ratingCount: stats ? stats.count : 0,
  });
};

module.exports = mongoose.model('Review', reviewSchema);
