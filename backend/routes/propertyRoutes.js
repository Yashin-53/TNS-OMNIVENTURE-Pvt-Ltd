const router = require('express').Router();
const property = require('../controllers/propertyController');
const review = require('../controllers/reviewController');
const { protect, optionalAuth, sellerOnly } = require('../middleware/auth');
const { propertyMedia } = require('../middleware/upload');

router.route('/')
  .get(property.getProperties)
  .post(protect, sellerOnly, propertyMedia, property.createProperty);

router.get('/mine', protect, property.getMyProperties); // keep above '/:id'

router.route('/:id')
  .get(optionalAuth, property.getProperty)
  .put(protect, propertyMedia, property.updateProperty)
  .delete(protect, property.deleteProperty);

router.route('/:id/reviews')
  .get(review.getReviews)
  .post(protect, review.addReview);

module.exports = router;
