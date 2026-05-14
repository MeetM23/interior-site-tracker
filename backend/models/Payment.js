const mongoose = require('mongoose');
const { generateId } = require('../utils/idGenerator');

const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true }, // Auto-generated e.g., PAY-0001
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  amount: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, required: true, default: Date.now },
  method: { type: String, enum: ['Cash', 'Bank Transfer', 'Credit Card', 'UPI', 'Cheque', 'Other'], default: 'Bank Transfer' },
  notes: { type: String, trim: true },
  
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

PaymentSchema.index({ companyId: 1, projectId: 1 });

PaymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.paymentId) {
    this.paymentId = await generateId('PAY');
  }
  next();
});

PaymentSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
