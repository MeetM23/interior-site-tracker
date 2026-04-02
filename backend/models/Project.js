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
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'delayed'], default: 'pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { _id: true });

const UpdateSchema = new mongoose.Schema({
  notes: { type: String, required: true },
  images: [{ type: String }],
  videos: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const ProjectSchema = new mongoose.Schema({
  // 1. Project Information
  projectId: { type: String, unique: true }, // Auto-generated e.g., PRJ-1024
  name: { type: String, required: true },
  projectType: { type: String, enum: ['Residential', 'Commercial', 'Office', 'Showroom'], default: 'Residential' },
  projectCategory: { type: String, enum: ['Interior', 'Renovation', 'Furniture', 'Turnkey'], default: 'Interior' },
  description: { type: String },

  // 2. Client Details
  clientName: { type: String, required: true },
  clientPhone: { type: String },
  clientEmail: { type: String },
  clientAddress: { type: String },
  alternateContact: { type: String },
  clientNotes: { type: String },

  // 3. Location Details
  location: { type: String, required: true }, // General location title
  city: { type: String },
  state: { type: String },
  mapsLink: { type: String },
  siteSize: { type: Number }, // sq ft

  // 4. Budget Management
  budget: { type: Number, default: 0 }, // Estimated
  spentBudget: { type: Number, default: 0 },
  // remaining budget is computed on client or via virtual

  // 5. Timeline & Milestones
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  milestones: [MilestoneSchema],

  // 6. Team Assignment
  assignedDesigner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Primary old field
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  siteSupervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workersVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // 7. Project Status & Progress
  status: { type: String, enum: ['not_started', 'on_track', 'at_risk', 'delayed', 'completed', 'on_hold', 'cancelled'], default: 'not_started' },
  completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  autoProgress: { type: Boolean, default: true },

  // 9. Task Management
  tasks: [TaskSchema],

  // 10. Documents & Files
  documents: [{
    url: { type: String, required: true },
    type: { type: String }, // Design / Site Image / Floor Plan / Bill
    name: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Legacy mappings
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

// Pre-save to auto-generate projectId
ProjectSchema.pre('save', async function (next) {
  if (this.isNew && !this.projectId) {
    const count = await mongoose.model('Project').countDocuments({});
    this.projectId = `PRJ-${1000 + count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
