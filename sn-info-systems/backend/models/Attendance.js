const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  loginTime: { type: Date },
  logoutTime: { type: Date },
  totalHours: { type: Number, default: 0 },
  status: { type: String, enum: ['Present', 'Late', 'Absent', 'Half Day'], default: 'Present' },
  loginLocation: {
    lat: Number,
    lng: Number,
  },
  logoutLocation: {
    lat: Number,
    lng: Number,
  },
  faceVerifiedLogin: { type: Boolean, default: false },
  faceVerifiedLogout: { type: Boolean, default: false },
  notes: { type: String },
}, { timestamps: true });

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
