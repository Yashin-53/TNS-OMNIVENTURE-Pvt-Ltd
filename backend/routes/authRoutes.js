const router = require('express').Router();
const auth = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/send-otp', auth.sendLoginOtp);
router.post('/verify-otp', auth.verifyLoginOtp);
router.get('/me', protect, auth.getMe);

module.exports = router;
