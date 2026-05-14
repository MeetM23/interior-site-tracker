const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secure_secret_for_jwt_signing';
const sign = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email, isDeleted: { $ne: true } });
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    return res.json({ 
      success: true, 
      message: 'Logged in successfully', 
      data: { 
        token: sign(user._id), 
        user: { 
          _id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          profilePhoto: user.profilePhoto
        } 
      } 
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// Remove generic registration endpoint since users should be strictly managed by SUPER_ADMIN or OWNER

module.exports = router;