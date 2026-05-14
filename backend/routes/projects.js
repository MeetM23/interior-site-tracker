const router = require('express').Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireCompany } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.use(protect, requireCompany);

// Utility to log activity
const logActivity = async (action, details, req) => {
  try {
    await ActivityLog.create({
      companyId: req.user.companyId,
      userId: req.user._id,
      projectId: details.projectId || null,
      action,
      details
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

// GET projects
router.get('/', async (req, res) => {
  try {
    let filter = { companyId: req.user.companyId };
    
    // Scoping for Designer
    if (req.user.role === 'DESIGNER') {
      filter.assignedDesigner = req.user._id;
    }

    const projects = await Project.find(filter)
      .populate('clientId', 'name')
      .populate('assignedDesigner', 'name email')
      .sort('-createdAt')
      .lean();
      
    // Optionally fetch dynamic data per project (like completion percentage from tasks)
    // Here we can keep it simple on the list view or do a lightweight lookup
    for (let p of projects) {
       const tasks = await Task.find({ projectId: p._id, companyId: req.user.companyId, type: 'task' }).select('status');
       const total = tasks.length;
       const completed = tasks.filter(t => t.status === 'completed').length;
       p.completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    }
      
    return res.json({ success: true, data: projects });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// GET single project
router.get('/:id', async (req, res) => {
  try {
    let filter = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === 'DESIGNER') {
      filter.assignedDesigner = req.user._id;
    }
    
    const p = await Project.findOne(filter)
      .populate('clientId')
      .populate('assignedDesigner', 'name email profilePhoto')
      .populate('gallery.uploadedBy', 'name profilePhoto')
      .lean();
      
    if (!p) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    
    // Fetch tasks and milestones dynamically
    const allTasks = await Task.find({ projectId: p._id, companyId: req.user.companyId, type: 'task' })
                               .populate('assignedTo', 'name email');
    p.tasks = allTasks;
    p.milestones = await Task.find({ projectId: p._id, companyId: req.user.companyId, type: 'milestone' })
                             .sort('deadline');

    // Auto-calculate completion percent based on tasks
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    p.completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Budget summary: pull payments and compute remaining
    const payments = await Payment.find({ projectId: p._id, companyId: req.user.companyId })
                                  .populate('recordedBy', 'name')
                                  .sort('-paymentDate')
                                  .lean();
    const totalSpent = payments.reduce((sum, pay) => sum + pay.amount, 0);
    p.budgetSummary = {
      budget: p.budget || 0,
      totalSpent,
      remaining: Math.max(0, (p.budget || 0) - totalSpent)
    };
    p.expenses = payments;

    return res.json({ success: true, data: p });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE project
router.post('/', upload.array('documents', 10), async (req, res) => {
  try {
    let bodyData = req.body;
    if (req.body.data) {
      bodyData = JSON.parse(req.body.data);
    }
    
    const payload = {
      ...bodyData,
      companyId: req.user.companyId,
      createdBy: req.user._id
    };

    if (req.files && req.files.length > 0) {
      payload.documents = req.files.map(f => ({
        url: `${req.protocol}://${req.get('host')}/uploads/${f.filename}`,
        name: f.originalname,
        type: 'Document'
      }));
    }

    const p = await Project.create(payload);
    
    // Auto-generate some default milestones if none provided
    if (bodyData.generateDefaultMilestones) {
      const defaultMilestones = ['Design Finalization', 'Execution Start', 'Mid Completion', 'Final Handover'];
      for (const m of defaultMilestones) {
         await Task.create({
           companyId: req.user.companyId,
           projectId: p._id,
           name: m,
           type: 'milestone'
         });
      }
    }

    await logActivity('PROJECT_CREATED', { projectId: p._id, projectName: p.name }, req);

    return res.status(201).json({ success: true, message: 'Project created', data: p });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// UPDATE project
router.put('/:id', async (req, res) => {
  try {
    let filter = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === 'DESIGNER') {
      filter.assignedDesigner = req.user._id;
    }
    
    const project = await Project.findOneAndUpdate(filter, req.body, { new: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    await logActivity('PROJECT_UPDATED', { projectId: project._id, modifications: Object.keys(req.body) }, req);

    return res.json({ success: true, data: project });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// DELETE project
router.delete('/:id', async (req, res) => {
  try {
    // Only owners can delete projects natively, or maybe designers too based on policy, assuming owner.
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only Owners can delete projects' });
    }
    
    let filter = { _id: req.params.id, companyId: req.user.companyId };
    const project = await Project.findOne(filter);
    
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    project.isDeleted = true;
    await project.save();
    
    await logActivity('PROJECT_DELETED', { projectId: project._id, projectName: project.name }, req);
    
    return res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ADD to site gallery
router.post('/:id/gallery', upload.array('photos', 5), async (req, res) => {
  try {
    let filter = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === 'DESIGNER') {
      filter.assignedDesigner = req.user._id;
    }

    const p = await Project.findOne(filter);
    if (!p) return res.status(404).json({ success: false, message: 'Project not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No photos uploaded' });
    }

    req.files.forEach(f => {
       const url = `${req.protocol}://${req.get('host')}/uploads/${f.filename}`;
       p.gallery.push({
         url,
         uploadedBy: req.user._id,
         caption: req.body.caption || ''
       });
    });

    await p.save();
    await logActivity('GALLERY_UPDATED', { projectId: p._id, photoCount: req.files.length }, req);

    return res.json({ success: true, data: p });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;