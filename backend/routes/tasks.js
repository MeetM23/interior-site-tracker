const router = require('express').Router();
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// an alternate helper entrypoint to update single task status
router.put('/:projectId/:taskId', protect, async (req, res) => {
  try {
    const p = await Project.findById(req.params.projectId);
    if (!p) return res.status(404).json({ message: 'Project not found' });
    const task = p.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    ['name', 'assignedTo', 'deadline', 'status'].forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });
    await p.save();
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
