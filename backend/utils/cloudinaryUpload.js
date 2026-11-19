const cloudinary = require('../config/cloudinary');
const httpError = require('./httpError');
const {
  MAX_VIDEO_SECONDS,
  IMAGE_TARGET_MB,
  VIDEO_TARGET_MB,
  IMAGE_MAX_EDGE,
  VIDEO_MAX_HEIGHT,
  STRIP_VIDEO_AUDIO,
} = require('../config/mediaLimits');

const FOLDER = 'tns-omniventure/properties';

// Upload one file buffer (from multer memory storage)
exports.uploadBuffer = (buffer, resourceType = 'image') =>
  new Promise((resolve, reject) => {
    const options = { folder: FOLDER, resource_type: resourceType };
    if (resourceType === 'image') {
      options.transformation = [
        { width: IMAGE_MAX_EDGE, height: IMAGE_MAX_EDGE, crop: 'limit' },
        { quality: 'auto:good' },
      ];
      options.format = 'webp';
    } else {
      options.transformation = [
        { height: VIDEO_MAX_HEIGHT, crop: 'limit' },
        { quality: 'auto:good', video_codec: 'h264' },
      ];
      options.format = 'mp4';
      if (STRIP_VIDEO_AUDIO) options.audio_codec = 'none';
    }
    const stream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err) return reject(err);
        const media = {
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
        };
        if (resourceType === 'video') media.duration = result.duration;
        resolve(media);
      }
    );
    stream.end(buffer);
  });

// Upload sequentially so every successful upload is tracked for cleanup.
exports.uploadFiles = async (files = [], resourceType = 'image', title = '') => {
  const uploaded = [];
  try {
    for (const file of files) {
      const result = await exports.uploadBuffer(file.buffer, resourceType);
      const media = {
        url: result.url || result.secure_url,
        publicId: result.publicId || result.public_id,
        bytes: result.bytes,
      };
      if (resourceType === 'video') media.duration = result.duration;
      uploaded.push({ media, publicId: media.publicId, type: resourceType });

      const label = title ? `Property “${title}”` : file.originalname || 'Uploaded file';
      if (resourceType === 'image' && Number(result.bytes) > IMAGE_TARGET_MB * 1024 * 1024) {
        console.warn(`${label}: image is larger than ${IMAGE_TARGET_MB} MB (${result.bytes} bytes)`);
      }
      if (resourceType === 'video' && Number(result.bytes) > VIDEO_TARGET_MB * 1024 * 1024) {
        console.warn(`${label}: video is larger than ${VIDEO_TARGET_MB} MB (${result.bytes} bytes)`);
      }

      if (resourceType === 'video' && Number(result.duration) > MAX_VIDEO_SECONDS + 1) {
        await exports.deleteFiles([{ publicId: media.publicId, type: 'video' }]);
        uploaded.pop();
        throw httpError(400, 'Video must be 2 minutes or shorter. Please upload a shorter clip.');
      }
    }
  } catch (err) {
    await exports.deleteFiles(uploaded);
    throw err;
  }
  return uploaded.map((item) => item.media);
};

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
