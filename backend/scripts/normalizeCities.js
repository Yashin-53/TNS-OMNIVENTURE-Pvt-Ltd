require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('../models/Property');
const indianStates = require('../utils/indianStates');

const normalizeCities = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const properties = await Property.find({}).select('title location.city location.state');
    let changed = 0;

    for (const property of properties) {
      const { city, state } = property.location;
      if (!indianStates.includes(state)) {
        console.log(`${property.title} — ${state}`);
        continue;
      }

      const normalizedCity = Property.normalizeCity(city);
      if (normalizedCity !== city) {
        await Property.updateOne(
          { _id: property._id },
          { $set: { 'location.city': normalizedCity } }
        );
        changed += 1;
      }
    }

    console.log(`Changed ${changed} properties`);
  } finally {
    await mongoose.disconnect();
  }
};

normalizeCities().catch((error) => {
  console.error('Could not normalize property cities:', error.message);
  process.exitCode = 1;
});
