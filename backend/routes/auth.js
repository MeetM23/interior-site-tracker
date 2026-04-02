const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secure_secret_for_jwt_signing';
const sign = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    return res.status(201).json({ success: true, message: 'Registered', data: { token: sign(user._id), user: { ...user.toObject(), password: undefined } } });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await user.comparePassword(req.body.password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    return res.json({ success: true, message: 'Logged in', data: { token: sign(user._id), user: { ...user.toObject(), password: undefined } } });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;