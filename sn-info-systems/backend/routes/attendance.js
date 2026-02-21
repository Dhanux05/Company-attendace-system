const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/attendanceController');

router.post('/login', protect, ctrl.markLogin);
router.post('/logout', protect, ctrl.markLogout);
router.get('/today', protect, ctrl.getTodayStatus);
router.get('/my', protect, ctrl.getMyAttendance);
router.get('/team', protect, authorize('teamlead', 'admin'), ctrl.getTeamAttendance);
router.get('/all', protect, authorize('admin'), ctrl.getAllAttendance);
router.get('/analytics', protect, authorize('admin', 'teamlead'), ctrl.getAnalytics);

module.exports = router;
