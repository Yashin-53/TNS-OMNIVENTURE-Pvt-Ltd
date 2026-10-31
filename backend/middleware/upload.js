const multer = require('multer');
const httpError = require('../utils/httpError');

// Files stay in memory and are streamed to Cloudinary by the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    cb(ok ? null : httpError(400, 'Only image and video files are allowed'), ok);
  },
});

exports.propertyMedia = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 3 },
]);
