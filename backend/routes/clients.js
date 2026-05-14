const router = require('express').Router();
const Client = require('../models/Client');
const { protect, requireCompany } = require('../middleware/auth');

router.use(protect, requireCompany);

// GET all clients for the company
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find({ companyId: req.user.companyId }).sort('-createdAt');
    return res.json({ success: true, data: clients });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE client
router.post('/', async (req, res) => {
  try {
    const clientData = { ...req.body, companyId: req.user.companyId };
    const client = await Client.create(clientData);
    return res.status(201).json({ success: true, data: client });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// GET single client
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    return res.json({ success: true, data: client });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// UPDATE client
router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body,
      { new: true }
    );
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    return res.json({ success: true, data: client });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// DELETE client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    
    client.isDeleted = true;
    await client.save();
    
    return res.json({ success: true, message: 'Client deleted' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
