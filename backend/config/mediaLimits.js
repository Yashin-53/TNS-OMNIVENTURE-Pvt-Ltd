const MAX_IMAGES = 4;
const MAX_VIDEOS = 1;
const MAX_FILE_MB = 10;
const MAX_VIDEO_SECONDS = 120;
const IMAGE_TARGET_MB = 1;
const VIDEO_TARGET_MB = 5;
const IMAGE_MAX_EDGE = 1600;
const VIDEO_MAX_HEIGHT = 720;
const STRIP_VIDEO_AUDIO = false;

// Keep frontend/src/data/mediaLimits.js in sync (the apps are deployed separately).
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

module.exports = {
  MAX_IMAGES,
  MAX_VIDEOS,
  MAX_FILE_MB,
  MAX_VIDEO_SECONDS,
  IMAGE_TARGET_MB,
  VIDEO_TARGET_MB,
  IMAGE_MAX_EDGE,
  VIDEO_MAX_HEIGHT,
  STRIP_VIDEO_AUDIO,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
};
