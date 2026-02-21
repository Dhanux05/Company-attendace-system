const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['intern', 'teamlead', 'admin'], default: 'intern' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  faceEmbedding: { type: [Number], default: null },
  faceRegistered: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  phone: { type: String },
  joinDate: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
