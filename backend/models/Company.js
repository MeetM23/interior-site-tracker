const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  gst: { type: String, trim: true },
  website: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent finding deleted companies by default if we want, but usually it's handled in the query:
CompanySchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Company', CompanySchema);
