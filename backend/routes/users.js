const router = require('express').Router();
const User = require('../models/User');
const { protect, authorizeRoles, requireCompany } = require('../middleware/auth');

// GET users
// SUPER_ADMIN gets all users.
// OWNER / DESIGNER gets users in their company.
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'SUPER_ADMIN') {
      filter.companyId = req.user.companyId;
    }
    
    // Optional query filters
    if (req.query.role) filter.role = req.query.role;
    if (req.query.companyId && req.user.role === 'SUPER_ADMIN') {
      filter.companyId = req.query.companyId;
    }

    const users = await User.find(filter).select('-password').populate('companyId', 'name').sort('createdAt');
    return res.json({ success: true, data: users });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// GET self profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('companyId', 'name');
    return res.json({ success: true, data: user });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// GET user by ID
router.get('/:id', protect, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    // Check scoping unless SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      filter.companyId = req.user.companyId;
    }
    
    const userRecord = await User.findOne(filter).select('-password').populate('companyId', 'name');
    if (!userRecord) return res.status(404).json({ success: false, message: 'User not found or access denied' });
    
    return res.json({ success: true, data: userRecord });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE user
// SUPER_ADMIN creates OWNERs.
// OWNERs create DESIGNERs.
router.post('/', protect, authorizeRoles('SUPER_ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { name, email, password, role, companyId, phone } = req.body;
    
    if (req.user.role === 'OWNER') {
      if (role !== 'DESIGNER') {
         return res.status(403).json({ success: false, message: 'Owners can only create Designers' });
      }
      req.body.companyId = req.user.companyId;
    } else if (req.user.role === 'SUPER_ADMIN') {
      if (!companyId) {
         return res.status(400).json({ success: false, message: 'companyId is required when creating a user as super admin' });
      }
    }
    
    const userExists = await User.findOne({ email });
    if (userExists) {
       return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create(req.body);
    const result = user.toObject();
    delete result.password;

    return res.status(201).json({ success: true, data: result });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// DELETE user
router.delete('/:id', protect, authorizeRoles('SUPER_ADMIN', 'OWNER'), async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (req.user.role === 'OWNER') {
      if (userToDelete.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ success: false, message: 'User belongs to another company' });
      }
      if (userToDelete.role !== 'DESIGNER') {
        return res.status(403).json({ success: false, message: 'Owners can only delete Designers' });
      }
    }
    
    userToDelete.isDeleted = true;
    await userToDelete.save();
    
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// UPDATE user
router.put('/:id', protect, async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Check access
    if (req.user.role !== 'SUPER_ADMIN' && req.user._id.toString() !== userToUpdate._id.toString()) {
       if (req.user.role === 'OWNER') {
          if (userToUpdate.companyId?.toString() !== req.user.companyId?.toString()) {
             return res.status(403).json({ success: false, message: 'Access denied' });
          }
       } else {
          return res.status(403).json({ success: false, message: 'Access denied' });
       }
    }

    const { name, phone, password, profilePhoto, settings } = req.body;
    
    if (name !== undefined) userToUpdate.name = name;
    if (phone !== undefined) userToUpdate.phone = phone;
    if (profilePhoto !== undefined) userToUpdate.profilePhoto = profilePhoto;
    if (settings !== undefined) userToUpdate.settings = settings;
    
    if (password) {
      userToUpdate.password = password; // Will be hashed by pre-save hooks
    }

    await userToUpdate.save();
    
    const result = userToUpdate.toObject();
    delete result.password;

    return res.json({ success: true, data: result });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
