const router = require('express').Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const { protect, ownerOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const recalcProject = (project) => {
  if (!project) return project;
  const totalTasks = project.tasks ? project.tasks.length : 0;
  if (totalTasks > 0) {
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
    project.completionPercent = Math.round((completedTasks / totalTasks) * 100);
  } else {
    project.completionPercent = project.completionPercent || 0;
  }

  const now = new Date();
  if (project.endDate && new Date(project.endDate) < now && project.status !== 'completed') {
    project.status = 'delayed';
  }

  if (project.milestones && Array.isArray(project.milestones)) {
    project.milestones = project.milestones.map(ms => {
      if (ms.completedDate) {
        return { ...ms.toObject ? ms.toObject() : ms, status: 'completed' };
      }
      if (ms.targetDate) {
        if (new Date(ms.targetDate) < now && ms.status !== 'completed') {
          return { ...ms.toObject ? ms.toObject() : ms, status: 'delayed' };
        }
        return { ...ms.toObject ? ms.toObject() : ms, status: ms.status || 'pending' };
      }
      return ms;
    });
  }

  project.lastUpdatedAt = new Date();
  return project;
};

// GET all projects (owner: all, designer: assigned)
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'designer' ? { assignedDesigner: req.user._id } : {};
    const projects = await Project.find(filter)
      .populate('assignedDesigner', 'name email')
      .populate('tasks.assignedTo', 'name')
      .sort('-createdAt');
    return res.json({ success: true, data: projects });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// ALERTS endpoint
router.get('/meta/alerts', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'designer' ? { assignedDesigner: req.user._id } : {};
    const projects = await Project.find(filter);
    const now = new Date();
    const alerts = [];
    const seen = new Set();

    projects.forEach(p => {
      const lastUpdated = new Date(p.lastUpdatedAt || p.updatedAt || p.createdAt);
      const daysSinceUpdate = Math.floor((now - lastUpdated) / 86400000);
      const daysToEnd = p.endDate ? Math.floor((new Date(p.endDate) - now) / 86400000) : null;

      if (daysSinceUpdate > 7) {
        const key = `${p._id}-no_update`;
        if (!seen.has(key)) {
          seen.add(key);
          alerts.push({ project: p.name, type: 'no_update', message: `No updates in ${daysSinceUpdate} days`, id: p._id });
        }
      }

      if (daysToEnd !== null && daysToEnd <= 5 && daysToEnd >= 0 && p.status !== 'completed') {
        const key = `${p._id}-near_deadline`;
        if (!seen.has(key)) {
          seen.add(key);
          alerts.push({ project: p.name, type: 'near_deadline', message: `Deadline in ${daysToEnd} day${daysToEnd !== 1 ? 's' : ''}`, id: p._id });
        }
      }

      if (p.status === 'delayed') {
        const key = `${p._id}-delayed`;
        if (!seen.has(key)) {
          seen.add(key);
          alerts.push({ project: p.name, type: 'delayed', message: 'Project is delayed', id: p._id });
        }
      }
    });

    return res.json({ success: true, data: alerts });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// GET single project
router.get('/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID' });
  }
  try {
    const p = await Project.findById(req.params.id)
      .populate('assignedDesigner', 'name email')
      .populate('tasks.assignedTo', 'name')
      .populate('updates.createdBy', 'name')
      .populate('gallery.uploadedBy', 'name profilePhoto');
    if (!p) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, data: p });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE project (owner only)
router.post('/', protect, ownerOnly, async (req, res) => {
  try {
    const DEFAULT_MILESTONES = [
      'Design Finalization','Material Procurement',
      'Execution Start','Mid Completion','Final Handover'
    ].map(name => ({ name, status: 'pending' }));

    const payload = {
      ...req.body,
      milestones: DEFAULT_MILESTONES,
      completionPercent: 0,
      status: req.body.status || 'on_track',
      createdBy: req.user._id,
      lastUpdatedAt: new Date()
    };

    const p = await Project.create(payload);
    const project = await Project.findById(p._id)
      .populate('assignedDesigner', 'name email')
      .populate('tasks.assignedTo', 'name')
      .populate('updates.createdBy', 'name');

    return res.status(201).json({ success: true, message: 'Project created', data: project });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// UPDATE project
router.put('/:id', protect, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // owner or assigned designer only
    if (req.user.role === 'designer' && project.assignedDesigner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    Object.assign(project, req.body);
    project = recalcProject(project);
    await project.save();

    project = await Project.findById(req.params.id)
      .populate('assignedDesigner', 'name email')
      .populate('tasks.assignedTo', 'name')
      .populate('updates.createdBy', 'name');

    return res.json({ success: true, data: project });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// CREATE task
router.post('/:id/tasks', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID' });
  }
  if (!req.body.name) {
    return res.status(400).json({ success: false, message: 'Task name required' });
  }
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (req.user.role === 'designer' && project.assignedDesigner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    project.tasks.push({
      name: req.body.name,
      assignedTo: req.body.assignedTo,
      deadline: req.body.deadline,
      status: req.body.status || 'pending'
    });

    recalcProject(project);
    await project.save();

    const p = await Project.findById(req.params.id)
      .populate('assignedDesigner', 'name email')
      .populate('tasks.assignedTo', 'name')
      .populate('updates.createdBy', 'name');

    return res.status(201).json({ success: true, data: p });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// UPDATE task
router.put('/:id/tasks/:taskId', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.taskId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (req.user.role === 'designer' && project.assignedDesigner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const task = project.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    ['name', 'assignedTo', 'deadline', 'status'].forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    recalcProject(project);
    await project.save();

    const p = await Project.findById(req.params.id)
      .populate('assignedDesigner', 'name email')
      .populate('tasks.assignedTo', 'name')
      .populate('updates.createdBy', 'name');

    return res.json({ success: true, data: p });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// DELETE project (owner only)
router.delete('/:id', protect, ownerOnly, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ADD update with file upload
router.post('/:id/updates', protect, upload.array('files', 10), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID' });
  }
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Project not found' });

    const files = (req.files || []).map(f => f.filename);
    const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    const videos = files.filter(f => /\.(mp4|mov|avi)$/i.test(f));

    p.updates.push({ notes: req.body.notes, images, videos, createdBy: req.user._id });
    p.lastUpdatedAt = new Date();
    recalcProject(p);
    await p.save();

    const project = await Project.findById(req.params.id)
      .populate('assignedDesigner', 'name email')
      .populate('tasks.assignedTo', 'name')
      .populate('updates.createdBy', 'name');

    return res.json({ success: true, data: project });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ADD to site gallery
router.post('/:id/gallery', protect, upload.array('photos', 5), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID' });
  }
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Project not found' });

    if (req.user.role === 'designer' && p.assignedDesigner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

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

    p.lastUpdatedAt = new Date();
    await p.save();

    const project = await Project.findById(req.params.id)
      .populate('assignedDesigner', 'name email')
      .populate('tasks.assignedTo', 'name')
      .populate('updates.createdBy', 'name')
      .populate('gallery.uploadedBy', 'name profilePhoto');

    return res.json({ success: true, data: project });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;