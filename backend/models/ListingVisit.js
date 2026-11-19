const mongoose = require('mongoose');

const listingVisitSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  visitorId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

listingVisitSchema.index({ property: 1, visitorId: 1 }, { unique: true });
// MongoDB's TTL cleanup runs about once a minute, so expiry can lag slightly.
listingVisitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ListingVisit', listingVisitSchema);
