const router = require('express').Router();
const review = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.delete('/:id', protect, review.deleteReview);

module.exports = router;
