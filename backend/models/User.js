const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['owner', 'designer'], default: 'designer' },
  phone: { type: String, trim: true },
  profilePhoto: { type: String },
  businessInfo: {
    companyName: { type: String, trim: true },
    address: { type: String, trim: true },
    gst: { type: String, trim: true },
    website: { type: String, trim: true }
  },
  designerInfo: {
    roleType: { type: String, trim: true },
    specialization: { type: String, trim: true }
  },
  settings: {
    alertDelays: { type: Boolean, default: true },
    alertDeadlines: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
