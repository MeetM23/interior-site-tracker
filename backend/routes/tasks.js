const router = require('express').Router({ mergeParams: true });
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireCompany } = require('../middleware/auth');

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
  } catch (err) {}
};

// GET all tasks (Can filter by projectId)
router.get('/', async (req, res) => {
  try {
    let filter = { companyId: req.user.companyId };
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.type) filter.type = req.query.type;

    const tasks = await Task.find(filter).populate('assignedTo', 'name').sort('deadline');
    return res.json({ success: true, data: tasks });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE task
router.post('/', async (req, res) => {
  try {
    if (!req.body.projectId) return res.status(400).json({ success: false, message: 'projectId is required' });
    
    const taskData = { ...req.body, companyId: req.user.companyId };
    const task = await Task.create(taskData);
    
    await logActivity('TASK_CREATED', { taskId: task._id, projectId: task.projectId, name: task.name }, req);
    
    return res.status(201).json({ success: true, data: task });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// UPDATE task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    if (req.body.status) {
       await logActivity('TASK_STATUS_UPDATED', { taskId: task._id, projectId: task.projectId, status: task.status }, req);
    }
    
    return res.json({ success: true, data: task });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    task.isDeleted = true;
    await task.save();
    
    await logActivity('TASK_DELETED', { taskId: task._id, projectId: task.projectId }, req);
    
    return res.json({ success: true, message: 'Task deleted' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
