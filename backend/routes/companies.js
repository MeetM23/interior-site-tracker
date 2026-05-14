const router = require('express').Router();
const Company = require('../models/Company');
const { protect, authorizeRoles } = require('../middleware/auth');

// Only SUPER_ADMIN can manage companies
router.use(protect, authorizeRoles('SUPER_ADMIN'));

router.get('/', async (req, res) => {
  try {
    const companies = await Company.find().sort('-createdAt');
    return res.json({ success: true, data: companies });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const company = await Company.create(req.body);
    return res.status(201).json({ success: true, data: company });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    return res.json({ success: true, data: company });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    
    company.isDeleted = true;
    await company.save();
    
    // Potentially, we should also soft delete all users, projects, etc. linked to this company.
    // That can be handled asynchronously or via webhook/events.
    
    return res.json({ success: true, message: 'Company deleted' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
