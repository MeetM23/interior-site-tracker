const mongoose = require('mongoose');
const { generateId } = require('../utils/idGenerator');

const TaskSchema = new mongoose.Schema({
  taskId: { type: String, unique: true }, // Auto-generated e.g., TSK-0001
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  name: { type: String, required: true },
  type: { type: String, enum: ['task', 'milestone'], default: 'task' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  deadline: { type: Date },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'delayed'], default: 'pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

TaskSchema.index({ companyId: 1, projectId: 1 });
TaskSchema.index({ assignedTo: 1 });

TaskSchema.pre('save', async function(next) {
  if (this.isNew && !this.taskId) {
    this.taskId = await generateId('TSK');
  }
  next();
});

TaskSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
