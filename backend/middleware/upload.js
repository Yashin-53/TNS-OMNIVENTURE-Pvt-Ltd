const multer = require('multer');
const httpError = require('../utils/httpError');
const { MAX_FILE_MB, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } = require('../config/mediaLimits');

// Files stay in memory and are streamed to Cloudinary by the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images') {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return cb(httpError(400, `“${file.originalname}” isn’t supported. Use JPG, PNG or WebP photos.`), false);
      }
    } else if (file.fieldname === 'videos') {
      if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        return cb(httpError(400, '“${name}” isn’t supported. Use an MP4, MOV or WebM video.'.replace('${name}', file.originalname)), false);
      }
    }
    cb(null, true);
  },
});

const propertyMediaUpload = upload.fields([
  { name: 'images', maxCount: 4 },
  { name: 'videos', maxCount: 1 },
]);

exports.propertyMedia = (req, res, next) => {
  propertyMediaUpload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(httpError(400, 'Each photo or video must be 10 MB or smaller. Please choose a smaller file.'));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(httpError(400, 'You can upload up to 4 photos and 1 video.'));
      }
      return next(httpError(400, 'Please choose valid photo or video files.'));
    }
    next(err);
  });
};
