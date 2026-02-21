const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Team = require('./models/Team');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sn-info-systems');
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Team.deleteMany({});

  // Create admin
  const admin = await User.create({
    name: 'Admin User', email: 'admin@sninfo.com',
    password: 'admin123', role: 'admin'
  });

  // Create team leader
  const tl = await User.create({
    name: 'Team Leader', email: 'lead@sninfo.com',
    password: 'lead123', role: 'teamlead'
  });

  // Create interns
  const intern1 = await User.create({ name: 'Alice Intern', email: 'alice@sninfo.com', password: 'intern123', role: 'intern' });
  const intern2 = await User.create({ name: 'Bob Intern', email: 'bob@sninfo.com', password: 'intern123', role: 'intern' });

  // Create team
  const team = await Team.create({
    name: 'Frontend Team',
    description: 'React & UI Development',
    leader: tl._id,
    members: [intern1._id, intern2._id]
  });

  // Assign team to users
  await User.updateMany({ _id: { $in: [tl._id, intern1._id, intern2._id] } }, { team: team._id });

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('Admin:  admin@sninfo.com / admin123');
  console.log('Leader: lead@sninfo.com / lead123');
  console.log('Intern: alice@sninfo.com / intern123');
  console.log('Intern: bob@sninfo.com / intern123');

  process.exit(0);
};

seed().catch(console.error);
