const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional, can be global company action
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  action: { type: String, required: true }, // e.g. PROJECT_CREATED, TASK_COMPLETED
  details: { type: mongoose.Schema.Types.Mixed }, // flexible JSON payload
  
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

ActivityLogSchema.index({ companyId: 1, createdAt: -1 });
ActivityLogSchema.index({ projectId: 1, createdAt: -1 });

ActivityLogSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
