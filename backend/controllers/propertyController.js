const Property = require('../models/Property');
const Review = require('../models/Review');
const httpError = require('../utils/httpError');
const { uploadFiles, deleteFiles, deletePropertyMedia } = require('../utils/cloudinaryUpload');

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

// GET /api/properties?q=&type=&listingType=&sort=&page=&limit=
exports.getProperties = async (req, res) => {
  const { q, type, listingType, sort, page, limit } = req.query;
  const filter = { isActive: true };
  if (type) filter.type = type;
  if (listingType) filter.listingType = listingType;

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

// GET /api/properties/mine
exports.getMyProperties = async (req, res) => {
  const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(properties);
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

  // validate before uploading so we never leave orphan files on Cloudinary
  const property = new Property({ ...buildData(req.body), owner: req.user._id });
  await property.validate();

  const [newImages, newVideos] = await Promise.all([
    uploadFiles(images, 'image'),
    uploadFiles(req.files?.videos, 'video'),
  ]);
  property.images = newImages;
  property.videos = newVideos;
  await property.save();

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
  if (keptImages.length + newImageFiles.length === 0) {
    throw httpError(400, 'A property needs at least one image');
  }

  property.set(buildData(req.body));
  await property.validate();

  const [newImages, newVideos] = await Promise.all([
    uploadFiles(newImageFiles, 'image'),
    uploadFiles(req.files?.videos, 'video'),
  ]);

  const removed = [
    ...property.images.filter((i) => removeImageIds.includes(String(i._id))).map((i) => ({ publicId: i.publicId, type: 'image' })),
    ...property.videos.filter((v) => removeVideoIds.includes(String(v._id))).map((v) => ({ publicId: v.publicId, type: 'video' })),
  ];

  property.images = [...keptImages, ...newImages];
  property.videos = [...keptVideos, ...newVideos];
  await property.save();
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
  await property.deleteOne();
  res.json({ message: 'Property deleted' });
};
