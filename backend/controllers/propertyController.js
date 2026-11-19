const Property = require('../models/Property');
const Review = require('../models/Review');
const ListingVisit = require('../models/ListingVisit');
const mongoose = require('mongoose');
const httpError = require('../utils/httpError');
const { uploadFiles, deleteFiles, deletePropertyMedia } = require('../utils/cloudinaryUpload');
const { MAX_IMAGES, MAX_VIDEOS } = require('../config/mediaLimits');

// Lists arrive as JSON text ('["a","b"]') because the form is multipart
const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return String(value).split(',').map((s) => s.trim()).filter(Boolean);
  }
};

// Turns the flat form body into the nested schema shape
const buildData = (b) => ({
  title: b.title,
  description: b.description,
  type: b.type,
  listingType: b.listingType,
  location: { address: b.address, city: b.city, state: b.state, pincode: b.pincode },
  dimension: { area: b.area, unit: b.unit },
  bedrooms: b.bedrooms,
  bathrooms: b.bathrooms,
  price: b.price,
  taxes: { stampDuty: b.stampDuty, registration: b.registration, gst: b.gst },
  highlights: parseList(b.highlights),
  amenities: parseList(b.amenities),
});

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const canEdit = (user, property) =>
  user.role === 'admin' || String(property.owner._id || property.owner) === String(user._id);

// GET /api/properties?q=&city=&type=&listingType=&sort=&page=&limit=
exports.getProperties = async (req, res) => {
  const { q, city, type, listingType, sort, page, limit } = req.query;
  const filter = { isActive: true };
  if (type) filter.type = type;
  if (listingType) filter.listingType = listingType;
  if (city) filter['location.city'] = new RegExp(`^${escapeRegex(city.trim())}$`, 'i');

  // every word of the search must match title, location or type
  if (q) {
    filter.$and = q.split(/\s+/).filter(Boolean).map((word) => {
      const rx = new RegExp(escapeRegex(word), 'i');
      return {
        $or: [
          { title: rx },
          { type: rx },
          { 'location.address': rx },
          { 'location.city': rx },
          { 'location.state': rx },
          { 'location.pincode': rx },
        ],
      };
    });
  }

  const sorts = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 } };
  const pageNo = Math.max(parseInt(page) || 1, 1);
  const perPage = Math.min(parseInt(limit) || 10, 50);

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .select('title type listingType location dimension bedrooms bathrooms price taxes images ratingAvg ratingCount createdAt')
      .sort(sorts[sort] || sorts.newest)
      .skip((pageNo - 1) * perPage)
      .limit(perPage),
    Property.countDocuments(filter),
  ]);

  res.json({ properties, total, page: pageNo, pages: Math.ceil(total / perPage) });
};

// GET /api/properties/cities
exports.getCities = async (req, res) => {
  const cities = await Property.aggregate([
    {
      $match: {
        isActive: true,
        'location.city': { $type: 'string', $ne: '' },
        'location.state': { $type: 'string', $ne: '' },
      },
    },
    {
      $group: {
        _id: { state: '$location.state', city: '$location.city' },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, city: '$_id.city', state: '$_id.state', count: 1 } },
    { $sort: { count: -1, city: 1 } },
  ]);
  res.json(cities);
};

// GET /api/properties/mine
exports.getMyProperties = async (req, res) => {
  const properties = await Property.find({ owner: req.user._id }).select('+views').sort({ createdAt: -1 });
  res.json(properties);
};

// POST /api/properties/:id/view
exports.recordView = async (req, res) => {
  const visitorId = req.body?.visitorId;
  if (typeof visitorId !== 'string' || !/^[A-Za-z0-9-]{16,64}$/.test(visitorId)) {
    return res.status(400).json({ message: 'visitorId must be 16 to 64 letters, numbers, or hyphens' });
  }
  if (!mongoose.isValidObjectId(req.params.id)) return res.json({ counted: false });

  const property = await Property.findById(req.params.id).select('owner isActive');
  if (!property || !property.isActive) return res.json({ counted: false });
  if (req.user && (req.user.role === 'admin' || String(property.owner) === String(req.user._id))) {
    return res.json({ counted: false });
  }

  try {
    await ListingVisit.create({ property: property._id, visitorId });
  } catch (err) {
    if (err.code === 11000) return res.json({ counted: false });
    throw err;
  }

  await Property.updateOne({ _id: property._id }, { $inc: { views: 1 } }, { timestamps: false });
  res.json({ counted: true });
};

// GET /api/properties/:id  (dealer phone/email are hidden from guests)
exports.getProperty = async (req, res) => {
  const property = await Property.findById(req.params.id).populate(
    'owner',
    'name phone email location createdAt'
  );
  if (!property) throw httpError(404, 'Property not found');
  if (!property.isActive && !(req.user && canEdit(req.user, property))) {
    throw httpError(404, 'Property not found');
  }

  const data = property.toJSON();
  if (!req.user) {
    delete data.owner.phone;
    delete data.owner.email;
  }
  res.json(data);
};

// POST /api/properties  (multipart: fields + images + videos)
exports.createProperty = async (req, res) => {
  const images = req.files?.images || [];
  if (!images.length) throw httpError(400, 'Add at least one image');
  if (images.length > MAX_IMAGES) throw httpError(400, 'A property can have at most 4 photos');
  const videos = req.files?.videos || [];
  if (videos.length > MAX_VIDEOS) throw httpError(400, 'A property can have only 1 video');

  // validate before uploading so we never leave orphan files on Cloudinary
  const property = new Property({ ...buildData(req.body), owner: req.user._id });
  await property.validate();

  let newImages = [];
  let newVideos = [];
  try {
    newImages = await uploadFiles(images, 'image', buildData(req.body).title);
    newVideos = await uploadFiles(videos, 'video', buildData(req.body).title);
    property.images = newImages;
    property.videos = newVideos;
    await property.save();
  } catch (err) {
    await deleteFiles([
      ...newImages.map((item) => ({ publicId: item.publicId, type: 'image' })),
      ...newVideos.map((item) => ({ publicId: item.publicId, type: 'video' })),
    ]);
    throw err;
  }

  res.status(201).json(property);
};

// PUT /api/properties/:id  (removeImages / removeVideos = JSON list of media _ids)
exports.updateProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw httpError(404, 'Property not found');
  if (!canEdit(req.user, property)) throw httpError(403, 'You can only edit your own property');

  const removeImageIds = parseList(req.body.removeImages).map(String);
  const removeVideoIds = parseList(req.body.removeVideos).map(String);
  const keptImages = property.images.filter((i) => !removeImageIds.includes(String(i._id)));
  const keptVideos = property.videos.filter((v) => !removeVideoIds.includes(String(v._id)));

  const newImageFiles = req.files?.images || [];
  if (keptImages.length + newImageFiles.length > MAX_IMAGES) {
    throw httpError(400, 'A property can have at most 4 photos');
  }
  const newVideoFiles = req.files?.videos || [];
  if (keptVideos.length + newVideoFiles.length > MAX_VIDEOS) {
    throw httpError(400, 'A property can have only 1 video');
  }
  if (keptImages.length + newImageFiles.length === 0) {
    throw httpError(400, 'A property needs at least one image');
  }

  const removed = [
    ...property.images.filter((i) => removeImageIds.includes(String(i._id))).map((i) => ({ publicId: i.publicId, type: 'image' })),
    ...property.videos.filter((v) => removeVideoIds.includes(String(v._id))).map((v) => ({ publicId: v.publicId, type: 'video' })),
  ];

  property.set(buildData(req.body));
  property.images = keptImages;
  property.videos = keptVideos;
  await property.validate();

  let newImages = [];
  let newVideos = [];
  try {
    newImages = await uploadFiles(newImageFiles, 'image', property.title);
    newVideos = await uploadFiles(newVideoFiles, 'video', property.title);
    property.images = [...keptImages, ...newImages];
    property.videos = [...keptVideos, ...newVideos];
    await property.save();
  } catch (err) {
    await deleteFiles([
      ...newImages.map((item) => ({ publicId: item.publicId, type: 'image' })),
      ...newVideos.map((item) => ({ publicId: item.publicId, type: 'video' })),
    ]);
    throw err;
  }
  await deleteFiles(removed);

  res.json(property);
};

// DELETE /api/properties/:id
exports.deleteProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw httpError(404, 'Property not found');
  if (!canEdit(req.user, property)) throw httpError(403, 'You can only delete your own property');

  await deletePropertyMedia(property);
  await Review.deleteMany({ property: property._id });
  await ListingVisit.deleteMany({ property: property._id });
  await property.deleteOne();
  res.json({ message: 'Property deleted' });
};
