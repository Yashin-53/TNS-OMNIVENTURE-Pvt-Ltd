// npm run seed:admin   -> creates the admin account (from .env)
// npm run seed:demo    -> admin + demo seller/buyer + sample properties and reviews
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');
const Review = require('./models/Review');

const photo = (id) => ({ url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`, publicId: '' });

const demoProperties = (owner) => [
  {
    owner, title: '3 BHK Apartment near Swaroop Nagar', listingType: 'sale', type: 'flat',
    description: 'Bright, well-ventilated 3 BHK on the 4th floor of a well-maintained society.\nSouth-east facing with a large balcony, modular kitchen and covered parking. Schools, hospitals and markets are within 1 km.',
    location: { address: 'Block C, Swaroop Nagar', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208002' },
    dimension: { area: 1450, unit: 'sqft' }, bedrooms: 3, bathrooms: 3,
    price: 6500000, taxes: { stampDuty: 7, registration: 1, gst: 5 },
    highlights: ['Corner flat with two balconies', 'Covered car parking included', 'Ready to move in', 'Gated society with 24x7 security'],
    amenities: ['Parking', 'Lift', '24x7 security', 'Power backup', 'Park / garden'],
    images: [photo('photo-1502672260266-1c1ef2d93688'), photo('photo-1560518883-ce09059eeffa')],
  },
  {
    owner, title: 'Residential plot in Kalyanpur', listingType: 'sale', type: 'plot',
    description: 'East-facing residential plot on a 30 ft road, inside a developed colony. Clear title, boundary wall done and water and electricity connections available at the plot.',
    location: { address: 'Sector 4, Kalyanpur', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208017' },
    dimension: { area: 200, unit: 'sqyd' }, price: 3800000, taxes: { stampDuty: 7, registration: 1, gst: 0 },
    highlights: ['East facing', '30 ft wide road', 'Clear title and mutation done'],
    amenities: ['Water supply', 'Gated community', 'CCTV'],
    images: [photo('photo-1500382017468-9049fed747ef')],
  },
  {
    owner, title: 'Modern 4 BHK Villa with garden', listingType: 'sale', type: 'villa',
    description: 'Contemporary independent villa with a private garden, home office room and double-height living area. Built with premium fittings and located in a quiet, green neighbourhood.',
    location: { address: 'Gomti Nagar Extension', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226010' },
    dimension: { area: 3200, unit: 'sqft' }, bedrooms: 4, bathrooms: 4, price: 21500000,
    taxes: { stampDuty: 7, registration: 1, gst: 0 },
    highlights: ['Private garden and sit-out', 'Home office room', 'Solar water heating', 'Two-car garage'],
    amenities: ['Parking', 'Power backup', 'CCTV', 'Swimming pool', 'Gated community'],
    images: [photo('photo-1512917774080-9991f1c4c750'), photo('photo-1600596542815-ffad4c1539a9'), photo('photo-1564013799919-ab600027ffc6')],
  },
  {
    owner, title: '2 BHK flat for rent, furnished', listingType: 'rent', type: 'flat',
    description: 'Fully furnished 2 BHK close to the metro station. Includes wardrobes, beds, sofa set, AC in both bedrooms and a fridge. Family or working professionals preferred.',
    location: { address: 'Sector 62', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' },
    dimension: { area: 1050, unit: 'sqft' }, bedrooms: 2, bathrooms: 2, price: 28000,
    taxes: { stampDuty: 0, registration: 0, gst: 0 },
    highlights: ['Fully furnished', 'Walking distance from metro', '11-month agreement'],
    amenities: ['Lift', 'Parking', 'Power backup', 'Gym', 'Near metro / bus stop'],
    images: [photo('photo-1522708323590-d24dbb6b0267'), photo('photo-1560448204-e02f11c3d0e2')],
  },
  {
    owner, title: 'Ground-floor shop on main market road', listingType: 'sale', type: 'commercial',
    description: 'High-footfall shop in an established market, suitable for retail, clinic or showroom. Wide frontage with a mezzanine for storage.',
    location: { address: 'Civil Lines Market', city: 'Jaipur', state: 'Rajasthan', pincode: '302006' },
    dimension: { area: 420, unit: 'sqft' }, bathrooms: 1, price: 9800000,
    taxes: { stampDuty: 6, registration: 1, gst: 5 },
    highlights: ['20 ft frontage', 'Mezzanine storage', 'Busy market with heavy footfall'],
    amenities: ['Power backup', 'CCTV', 'Parking'],
    images: [photo('photo-1486406146926-c627a92ad1ab')],
  },
  {
    owner, title: 'Farmland with mango orchard', listingType: 'sale', type: 'farmland',
    description: 'Fertile farmland with 120 mature mango trees, a tube well and a small farmhouse. Road access all year. Ideal as a weekend retreat or an income-generating orchard.',
    location: { address: 'Malihabad Road', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '227101' },
    dimension: { area: 2, unit: 'acre' }, price: 7200000, taxes: { stampDuty: 5, registration: 1, gst: 0 },
    highlights: ['120 mature mango trees', 'Tube well with pump', 'Small farmhouse on site'],
    amenities: ['Water supply', 'Parking'],
    images: [photo('photo-1500076656116-558758c991c1')],
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'ZameenSetu Admin',
      phone: process.env.ADMIN_PHONE || '9000000001',
      email: process.env.ADMIN_EMAIL || 'admin@zameensetu.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      location: 'Kanpur, Uttar Pradesh',
      role: 'admin',
    });
    console.log(`Admin created: ${admin.phone} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
  } else {
    console.log('Admin already exists');
  }

  if (process.argv.includes('--demo')) {
    await Promise.all([Property.deleteMany({}), Review.deleteMany({}), User.deleteMany({ phone: { $in: ['9000000002', '9000000003', '9000000004'] } })]);

    const seller = await User.create({ name: 'Rakesh Verma', phone: '9000000002', email: 'seller@demo.com', password: 'Demo@123', location: 'Kanpur, Uttar Pradesh', role: 'seller' });
    const buyer = await User.create({ name: 'Anjali Singh', phone: '9000000003', email: 'buyer@demo.com', password: 'Demo@123', location: 'Lucknow, Uttar Pradesh', role: 'buyer' });
    const buyer2 = await User.create({ name: 'Imran Khan', phone: '9000000004', password: 'Demo@123', location: 'Delhi', role: 'buyer' });

    const properties = await Property.insertMany(demoProperties(seller._id));

    await Review.insertMany([
      { property: properties[0]._id, user: buyer._id, rating: 5, pros: 'Very peaceful society, good water pressure and the builder kept every promise.', cons: 'Parking gets tight on weekends.' },
      { property: properties[0]._id, user: buyer2._id, rating: 4, pros: 'Great location near schools and the market.', cons: 'Lift maintenance could be faster.' },
      { property: properties[2]._id, user: buyer._id, rating: 5, pros: 'Spacious rooms, lovely garden and great finishing.', cons: 'A bit far from the main city.' },
    ]);
    for (const p of properties) await Review.calcStats(p._id);

    console.log('Demo data added.');
    console.log('Seller : 9000000002 / Demo@123');
    console.log('Buyer  : 9000000003 / Demo@123');
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
