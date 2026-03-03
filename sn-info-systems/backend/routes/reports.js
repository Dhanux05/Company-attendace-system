const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

router.get('/attendance.csv', protect, authorize('admin', 'teamlead'), ctrl.exportAttendanceCsv);
router.get('/leaves.csv', protect, authorize('admin', 'teamlead'), ctrl.exportLeaveCsv);
router.get('/kpis.csv', protect, authorize('admin'), ctrl.exportKpiCsv);
router.get('/monthly-summary', protect, authorize('admin', 'teamlead'), ctrl.getMonthlySummary);

module.exports = router;
