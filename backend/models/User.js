const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generateId } = require('../utils/idGenerator');

const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true }, // Auto-generated e.g., USER-0001
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // Optional for SUPER_ADMIN
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['SUPER_ADMIN', 'OWNER', 'DESIGNER'], default: 'DESIGNER' },
  phone: { type: String, trim: true },
  profilePhoto: { type: String },
  
  settings: {
    alertDelays: { type: Boolean, default: true },
    alertDeadlines: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

UserSchema.index({ companyId: 1 });
UserSchema.index({ email: 1 });

UserSchema.pre('save', async function(next) {
  if (this.isNew && !this.userId) {
    this.userId = await generateId('USER');
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
