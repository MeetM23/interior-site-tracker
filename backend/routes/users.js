const router = require('express').Router();
const User = require('../models/User');
const { protect, ownerOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/', protect, ownerOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('createdAt');
    return res.json({ success: true, data: users });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// Profile photo upload route
router.post('/photo', protect, upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  try {
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const user = await User.findById(req.user._id);
    user.profilePhoto = photoUrl;
    await user.save();
    return res.json({ success: true, photoUrl });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/me', protect, async (req, res) => {
  return res.json({ success: true, data: req.user });
});

router.get('/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
  try {
    const reqUser = await User.findById(req.params.id).select('-password');
    if (!reqUser) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Only owner can view other profiles OR user viewing themselves
    if (req.user.role !== 'owner' && req.user._id.toString() !== req.params.id) {
       return res.status(403).json({ success: false, message: 'Forbidden access to profile' });
    }
    return res.json({ success: true, data: reqUser });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

const mongoose = require('mongoose');

router.put('/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Allow owner to update anyone, or user to update themselves
    if (req.user.role !== 'owner' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Forbidden update access' });
    }

    const updatable = ['name', 'email', 'phone', 'profilePhoto'];
    updatable.forEach(key => {
      if (req.body[key] !== undefined) user[key] = req.body[key];
    });

    // Only owners can change roles
    if (req.user.role === 'owner' && req.body.role) {
       user.role = req.body.role;
    }

    if (req.body.businessInfo) {
      user.businessInfo = { ...user.businessInfo, ...req.body.businessInfo };
    }
    if (req.body.designerInfo) {
      user.designerInfo = { ...user.designerInfo, ...req.body.designerInfo };
    }
    if (req.body.settings) {
      user.settings = { ...user.settings, ...req.body.settings };
    }

    if (req.body.password) user.password = req.body.password;
    await user.save();
    const result = user.toObject();
    delete result.password;
    return res.json({ success: true, data: result });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

router.delete('/:id', protect, ownerOnly, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'User deleted' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
