const User = require('../models/User');
const Team = require('../models/Team');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -faceEmbedding').populate('team', 'name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, team, isActive, phone } = req.body;
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) return res.status(404).json({ message: 'User not found' });

    const oldTeamId = existingUser.team ? existingUser.team.toString() : null;
    const incomingTeamId = team === '' || team === null ? null : (team ? team.toString() : oldTeamId);
    const nextRole = role || existingUser.role;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        role: nextRole,
        team: incomingTeamId,
        isActive,
        phone,
      },
      { new: true }
    ).select('-password -faceEmbedding').populate('team', 'name');

    if (oldTeamId && oldTeamId !== incomingTeamId) {
      await Team.findByIdAndUpdate(oldTeamId, { $pull: { members: req.params.id } });
      await Team.updateMany({ _id: oldTeamId, leader: req.params.id }, { $unset: { leader: 1 } });
    }

    if (incomingTeamId) {
      await Team.findByIdAndUpdate(incomingTeamId, { $addToSet: { members: req.params.id } });
      if (nextRole === 'teamlead') {
        await Team.findByIdAndUpdate(incomingTeamId, { leader: req.params.id });
      }
    }

    if (nextRole !== 'teamlead') {
      await Team.updateMany({ leader: req.params.id }, { $unset: { leader: 1 } });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const { name, description, leaderId } = req.body;
    const team = await Team.create({ name, description, leader: leaderId });
    if (leaderId) {
      await User.findByIdAndUpdate(leaderId, { team: team._id });
    }
    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('leader', 'name email').populate('members', 'name email');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyTeamMembers = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('role team');
    if (!me) return res.status(404).json({ message: 'User not found' });

    const fallbackTeam = await Team.findOne({ leader: req.user._id, isActive: true }).select('_id');
    const teamId = me.team || fallbackTeam?._id;
    if (!teamId) return res.status(400).json({ message: 'No team assigned to this team leader' });

    const members = await User.find({
      team: teamId,
      isActive: true,
      role: { $ne: 'admin' },
    })
      .select('-password -faceEmbedding')
      .sort({ name: 1 });

    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { name, description, leaderId, memberIds } = req.body;
    const existingTeam = await Team.findById(req.params.id);
    if (!existingTeam) return res.status(404).json({ message: 'Team not found' });

    const nextMemberIds = Array.isArray(memberIds)
      ? [...new Set(memberIds.map(String))]
      : existingTeam.members.map(String);
    const nextLeaderId = leaderId || null;

    const previousMemberIds = existingTeam.members.map(String);
    const removedMemberIds = previousMemberIds.filter(id => !nextMemberIds.includes(id));
    const addedMemberIds = nextMemberIds.filter(id => !previousMemberIds.includes(id));

    if (nextMemberIds.length > 0) {
      await Team.updateMany(
        { _id: { $ne: existingTeam._id }, members: { $in: nextMemberIds } },
        { $pull: { members: { $in: nextMemberIds } } }
      );
    }

    if (nextLeaderId) {
      await Team.updateMany(
        { _id: { $ne: existingTeam._id }, leader: nextLeaderId },
        { $unset: { leader: 1 } }
      );
    }

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description, leader: nextLeaderId, members: nextMemberIds },
      { new: true }
    ).populate('leader', 'name email').populate('members', 'name email role');

    if (addedMemberIds.length > 0) {
      await User.updateMany({ _id: { $in: addedMemberIds } }, { team: team._id });
    }

    if (removedMemberIds.length > 0) {
      await User.updateMany(
        { _id: { $in: removedMemberIds }, team: team._id },
        { $unset: { team: 1 } }
      );
    }

    if (nextLeaderId) {
      await User.findByIdAndUpdate(nextLeaderId, { team: team._id, role: 'teamlead' });
      if (!nextMemberIds.includes(String(nextLeaderId))) {
        await Team.findByIdAndUpdate(team._id, { $addToSet: { members: nextLeaderId } });
      }
    }

    if (existingTeam.leader && String(existingTeam.leader) !== String(nextLeaderId || '')) {
      const oldLeader = await User.findById(existingTeam.leader);
      if (oldLeader && oldLeader.role === 'teamlead') {
        await User.findByIdAndUpdate(existingTeam.leader, { role: 'intern' });
      }
    }

    const refreshed = await Team.findById(team._id).populate('leader', 'name email').populate('members', 'name email role');
    res.json(refreshed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    await Team.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Team deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addUserToTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { team: teamId }, { new: true })
      .select('-password -faceEmbedding').populate('team', 'name');
    await Team.findByIdAndUpdate(teamId, { $addToSet: { members: req.params.id } });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
