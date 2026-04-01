const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  targetDate: { type: Date },
  completedDate: { type: Date },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'delayed'], default: 'pending' }
}, { _id: true });

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deadline: { type: Date },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'delayed'], default: 'pending' }
}, { _id: true });

const UpdateSchema = new mongoose.Schema({
  notes: { type: String, required: true },
  images: [{ type: String }],
  videos: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  clientName: { type: String, required: true },
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  assignedDesigner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  budget: { type: Number, default: 0 },
  status: { type: String, enum: ['on_track', 'at_risk', 'delayed', 'completed'], default: 'on_track' },
  completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  milestones: [MilestoneSchema],
  tasks: [TaskSchema],
  updates: [UpdateSchema],
  gallery: [{
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    caption: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],
  lastUpdatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
