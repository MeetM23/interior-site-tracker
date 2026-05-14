const router = require('express').Router();
const User = require('../models/User');
const Company = require('../models/Company');
const Project = require('../models/Project');
const { protect, authorizeRoles } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Strict Super Admin Boundaries
router.use(protect, authorizeRoles('SUPER_ADMIN'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments({ isDeleted: false });
    const totalUsers = await User.countDocuments({ isDeleted: false, role: { $ne: 'SUPER_ADMIN' } });
    const totalProjects = await Project.countDocuments({ isDeleted: false });

    return res.json({
      success: true,
      data: {
        totalCompanies,
        totalUsers,
        totalProjects
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/companies (Master List)
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find({ isDeleted: false }).sort('-createdAt');
    return res.json({ success: true, data: companies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/owners (Master List)
router.get('/owners', async (req, res) => {
  try {
    const owners = await User.find({ isDeleted: false, role: 'OWNER' })
      .populate('companyId', 'name status')
      .select('-password')
      .sort('-createdAt');
    return res.json({ success: true, data: owners });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/onboard (Atomic Provisioning)
router.post('/onboard', async (req, res) => {
  const { companyName, ownerName, ownerEmail, ownerPassword, ownerPhone } = req.body;

  try {
    if (!companyName || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ success: false, message: 'Missing required onboarding data' });
    }

    const emailExists = await User.findOne({ email: ownerEmail });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // 1. Create Company
    const company = await Company.create({
      name: companyName,
      status: 'Active'
    });

    // 2. Create Owner
    const owner = await User.create({
      companyId: company._id,
      name: ownerName,
      email: ownerEmail,
      phone: ownerPhone || '',
      password: ownerPassword,
      role: 'OWNER',
      isActive: true
    });

    const result = owner.toObject();
    delete result.password;

    return res.status(201).json({
      success: true,
      message: 'Provisioned successfully',
      data: {
        company,
        owner: result
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/owners/:id (Deactivate or Edit)
router.put('/owners/:id', async (req, res) => {
  try {
    const owner = await User.findOne({ _id: req.params.id, role: 'OWNER' });
    if (!owner) return res.status(404).json({ success: false, message: 'Owner not found' });

    if (req.body.name !== undefined) owner.name = req.body.name;
    if (req.body.email !== undefined) owner.email = req.body.email;
    if (req.body.isActive !== undefined) owner.isActive = req.body.isActive;
    
    if (req.body.password) {
      owner.password = await bcrypt.hash(req.body.password, 10);
    }

    await owner.save();

    const result = owner.toObject();
    delete result.password;

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/companies/:id (Status Toggle)
router.put('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    if (req.body.status) company.status = req.body.status;
    if (req.body.name) company.name = req.body.name;

    await company.save();
    return res.json({ success: true, data: company });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/companies/:id (Soft Delete)
router.delete('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    if (company.status !== 'Suspended') {
       return res.status(400).json({ success: false, message: 'Only suspended companies can be deleted' });
    }

    company.isDeleted = true;
    await company.save();

    // Optionally also soft-delete or deactivate its owners
    await User.updateMany({ companyId: company._id }, { isDeleted: true, isActive: false });

    return res.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
