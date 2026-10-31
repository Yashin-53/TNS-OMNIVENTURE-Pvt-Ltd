const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String, // Cloudinary id, used for deleting
});

const propertySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, required: [true, 'Description is required'] },
    listingType: { type: String, enum: ['sale', 'rent'], default: 'sale' },
    type: {
      type: String,
      enum: ['flat', 'house', 'villa', 'plot', 'commercial', 'farmland'],
      required: [true, 'Property type is required'],
    },

    location: {
      address: { type: String, required: [true, 'Address is required'], trim: true },
      city: { type: String, required: [true, 'City is required'], trim: true },
      state: { type: String, required: [true, 'State is required'], trim: true },
      pincode: { type: String, trim: true },
    },

    dimension: {
      area: { type: Number, required: [true, 'Area is required'], min: [1, 'Area must be greater than 0'] },
      unit: { type: String, enum: ['sqft', 'sqm', 'sqyd', 'acre', 'hectare'], default: 'sqft' },
    },
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },

    // price is the base price (monthly rent for rent listings). Taxes are percentages of it.
    price: { type: Number, required: [true, 'Price is required'], min: [1, 'Price must be greater than 0'] },
    taxes: {
      stampDuty: { type: Number, default: 0, min: 0 },
      registration: { type: Number, default: 0, min: 0 },
      gst: { type: Number, default: 0, min: 0 },
    },

    highlights: [String],
    amenities: [String],
    images: [mediaSchema],
    videos: [mediaSchema],

    isActive: { type: Boolean, default: true },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, id: false }
);

propertySchema.virtual('taxAmount').get(function () {
  const t = this.taxes || {};
  const percent = (t.stampDuty || 0) + (t.registration || 0) + (t.gst || 0);
  return Math.round((this.price * percent) / 100);
});

propertySchema.virtual('totalPrice').get(function () {
  return this.price + this.taxAmount;
});

module.exports = mongoose.model('Property', propertySchema);
