const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.get('/my', protect, ctrl.getMyNotifications);
router.get('/team-announcements', protect, authorize('intern', 'teamlead', 'admin'), ctrl.getTeamAnnouncements);
router.post('/team-announcements', protect, authorize('teamlead', 'admin'), ctrl.createTeamAnnouncement);
router.patch('/read-all', protect, ctrl.markAllRead);
router.patch('/:id/read', protect, ctrl.markAsRead);

module.exports = router;
