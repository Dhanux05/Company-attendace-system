const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.get('/', protect, authorize('admin'), ctrl.getAllUsers);
router.put('/:id', protect, authorize('admin'), ctrl.updateUser);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteUser);
router.post('/:id/team', protect, authorize('admin'), ctrl.addUserToTeam);

// Teams
router.post('/teams', protect, authorize('admin'), ctrl.createTeam);
router.get('/teams', protect, ctrl.getAllTeams);
router.get('/team-members', protect, authorize('teamlead', 'admin'), ctrl.getMyTeamMembers);
router.put('/teams/:id', protect, authorize('admin'), ctrl.updateTeam);
router.delete('/teams/:id', protect, authorize('admin'), ctrl.deleteTeam);

module.exports = router;
