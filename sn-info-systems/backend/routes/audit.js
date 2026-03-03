const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/auditController');

router.get('/timeline/today', protect, authorize('admin', 'teamlead'), ctrl.getTodayTimeline);
router.get('/', protect, authorize('admin'), ctrl.getAuditLogs);

module.exports = router;
