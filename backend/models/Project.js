const mongoose = require('mongoose');
const { generateId } = require('../utils/idGenerator');

const ProjectSchema = new mongoose.Schema({
  projectId: { type: String, unique: true }, // Auto-generated e.g., PRJ-0001
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  
  name: { type: String, required: true },
  projectType: { type: String, enum: ['Residential', 'Commercial', 'Office', 'Showroom'], default: 'Residential' },
  projectCategory: { type: String, enum: ['Interior', 'Renovation', 'Furniture', 'Turnkey'], default: 'Interior' },
  description: { type: String },

  location: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  mapsLink: { type: String },
  siteSize: { type: Number }, // sq ft

  budget: { type: Number, default: 0 }, // Estimated total budget

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  assignedDesigner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  status: { type: String, enum: ['not_started', 'in_progress', 'delayed', 'completed', 'on_hold', 'cancelled'], default: 'not_started' },

  documents: [{
    url: { type: String, required: true },
    type: { type: String }, // Design / Site Image / Floor Plan / Bill
    name: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  gallery: [{
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    caption: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

ProjectSchema.index({ companyId: 1 });
ProjectSchema.index({ clientId: 1 });
ProjectSchema.index({ assignedDesigner: 1 });

ProjectSchema.pre('save', async function(next) {
  if (this.isNew && !this.projectId) {
    this.projectId = await generateId('PRJ');
  }
  next();
});

ProjectSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
