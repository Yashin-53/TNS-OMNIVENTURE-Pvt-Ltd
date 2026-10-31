const cloudinary = require('../config/cloudinary');

const FOLDER = 'zameensetu/properties';

// Upload one file buffer (from multer memory storage)
exports.uploadBuffer = (buffer, resourceType = 'image') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// Upload many files, returns [{ url, publicId }]
exports.uploadFiles = (files = [], resourceType = 'image') =>
  Promise.all(
    files.map(async (file) => {
      const result = await exports.uploadBuffer(file.buffer, resourceType);
      return { url: result.secure_url, publicId: result.public_id };
    })
  );

// items: [{ publicId, type: 'image' | 'video' }]. Failures are ignored on purpose.
exports.deleteFiles = (items) =>
  Promise.all(
    items
      .filter((item) => item.publicId)
      .map((item) =>
        cloudinary.uploader.destroy(item.publicId, { resource_type: item.type }).catch(() => {})
      )
  );

// Delete every image/video of a property
exports.deletePropertyMedia = (property) =>
  exports.deleteFiles([
    ...property.images.map((i) => ({ publicId: i.publicId, type: 'image' })),
    ...property.videos.map((v) => ({ publicId: v.publicId, type: 'video' })),
  ]);
