const Property = require('../models/Property');
const Review = require('../models/Review');
const { deletePropertyMedia } = require('./cloudinaryUpload');

// Deletes a user together with their properties, media and reviews.
module.exports = async (user) => {
  const properties = await Property.find({ owner: user._id });
  for (const property of properties) await deletePropertyMedia(property);

  await Review.deleteMany({ property: { $in: properties.map((p) => p._id) } });
  await Property.deleteMany({ owner: user._id });

  // reviews written by this user on other people's properties
  const reviews = await Review.find({ user: user._id });
  await Review.deleteMany({ user: user._id });
  for (const propertyId of new Set(reviews.map((r) => String(r.property)))) {
    await Review.calcStats(propertyId);
  }

  await user.deleteOne();
};
