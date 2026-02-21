const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/leaveController');

router.post('/', protect, ctrl.applyLeave);
router.get('/my', protect, ctrl.getMyLeaves);
router.get('/team', protect, authorize('teamlead', 'admin'), ctrl.getTeamLeaves);
router.get('/all', protect, authorize('admin'), ctrl.getAllLeaves);
router.get('/stats', protect, authorize('admin'), ctrl.getLeaveStats);
router.patch('/:id/review', protect, authorize('teamlead', 'admin'), ctrl.reviewLeave);

module.exports = router;
