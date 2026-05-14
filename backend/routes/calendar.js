const router = require('express').Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect, requireCompany } = require('../middleware/auth');

router.use(protect, requireCompany);

// GET /calendar?start=...&end=...
// Dynamically builds calendar events from Tasks and Projects
router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    let projectFilter = { companyId: req.user.companyId };
    if (req.user.role === 'DESIGNER') {
       projectFilter.assignedDesigner = req.user._id;
    }
    
    const projects = await Project.find(projectFilter).lean();
    const projectIds = projects.map(p => p._id);
    
    let taskFilter = { projectId: { $in: projectIds }, companyId: req.user.companyId };
    
    // Optional date range filtering for tasks
    if (start && end) {
      taskFilter.deadline = { $gte: new Date(start), $lte: new Date(end) };
    }
    
    const tasks = await Task.find(taskFilter).populate('assignedTo', 'name').lean();
    
    const events = [];
    
    // 1. Task/Milestone events
    tasks.forEach(t => {
      if (t.deadline) {
        events.push({
          _id: t._id,
          projectId: t.projectId,
          projectName: projects.find(p => p._id.toString() === t.projectId.toString())?.name,
          type: t.type, // 'task' or 'milestone'
          title: t.name,
          date: t.deadline,
          status: t.status,
          assignedTo: t.assignedTo,
          color: t.type === 'milestone' ? 'green' : (t.status === 'completed' ? 'grey' : 'blue')
        });
      }
    });
    
    // 2. Project boundaries (start / end dates)
    projects.forEach(p => {
       if (p.startDate && (!start || new Date(p.startDate) >= new Date(start)) && (!end || new Date(p.startDate) <= new Date(end))) {
         events.push({
           _id: `start-${p._id}`,
           projectId: p._id,
           projectName: p.name,
           type: 'project_start',
           title: `${p.name} Start`,
           date: p.startDate,
           color: 'purple'
         });
       }
       if (p.endDate && (!start || new Date(p.endDate) >= new Date(start)) && (!end || new Date(p.endDate) <= new Date(end))) {
         events.push({
           _id: `end-${p._id}`,
           projectId: p._id,
           projectName: p.name,
           type: 'project_end',
           title: `${p.name} Deadline`,
           date: p.endDate,
           color: 'red'
         });
       }
    });

    return res.json({ success: true, data: events });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
