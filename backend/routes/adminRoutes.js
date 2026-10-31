const router = require('express').Router();
const admin = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/stats', admin.getStats);
router.get('/users', admin.getUsers);
router.get('/properties', admin.getProperties);
router.patch('/users/:id/status', admin.toggleUserStatus);
router.delete('/users/:id', admin.deleteUser);

module.exports = router;
