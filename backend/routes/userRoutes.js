const router = require('express').Router();
const user = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/me').put(user.updateProfile).delete(user.deleteAccount);
router.put('/me/password', user.changePassword);

module.exports = router;
