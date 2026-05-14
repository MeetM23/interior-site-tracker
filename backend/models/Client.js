const mongoose = require('mongoose');
const { generateId } = require('../utils/idGenerator');

const ClientSchema = new mongoose.Schema({
  clientId: { type: String, unique: true }, // Auto-generated e.g., CLT-0001
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  notes: { type: String, trim: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

ClientSchema.index({ companyId: 1 });

ClientSchema.pre('save', async function(next) {
  if (this.isNew && !this.clientId) {
    this.clientId = await generateId('CLT');
  }
  next();
});

ClientSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Client', ClientSchema);
