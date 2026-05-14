const router = require('express').Router();
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireCompany } = require('../middleware/auth');

router.use(protect, requireCompany);

const logActivity = async (action, details, req) => {
  try {
    await ActivityLog.create({
      companyId: req.user.companyId,
      userId: req.user._id,
      projectId: details.projectId || null,
      action,
      details
    });
  } catch (err) {}
};

// GET payments for a project
router.get('/', async (req, res) => {
  try {
    let filter = { companyId: req.user.companyId };
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }
    
    const payments = await Payment.find(filter)
      .populate('recordedBy', 'name')
      .populate('projectId', 'name')
      .sort('-paymentDate');
      
    return res.json({ success: true, data: payments });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE payment
router.post('/', async (req, res) => {
  try {
    if (!req.body.projectId) return res.status(400).json({ success: false, message: 'projectId is required' });
    if (!req.body.amount || req.body.amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount is required' });

    const paymentData = {
      ...req.body,
      companyId: req.user.companyId,
      recordedBy: req.user._id
    };

    const payment = await Payment.create(paymentData);
    
    await logActivity('PAYMENT_RECORDED', { paymentId: payment._id, projectId: payment.projectId, amount: payment.amount }, req);
    
    return res.status(201).json({ success: true, data: payment });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// GET derived payment summary for a project
router.get('/summary/:projectId', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    // 1) Find the project to get the estimated budget
    const project = await Project.findOne({ _id: req.params.projectId, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    // 2) Aggregate total payments
    const payments = await Payment.find({ projectId: req.params.projectId, companyId: req.user.companyId });
    const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const remainingBudget = project.budget - totalPaid;
    
    return res.json({
      success: true,
      data: {
        budget: project.budget,
        totalPaid,
        remainingBudget: remainingBudget > 0 ? remainingBudget : 0
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
