const router = require('express').Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireCompany } = require('../middleware/auth');

router.use(protect, requireCompany);

router.get('/', async (req, res) => {
  try {
    let projectFilter = { companyId: req.user.companyId };
    
    if (req.user.role === 'DESIGNER') {
      projectFilter.assignedDesigner = req.user._id;
    }

    const projects = await Project.find(projectFilter).lean();
    const projectIds = projects.map(p => p._id);

    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const twoDaysFromNow = new Date(todayEnd.getTime() + 2 * 24 * 60 * 60 * 1000);

    const data = {
      summary: { total: 0, active: 0, completed: 0, delayed: 0 },
      alerts: { deadlines: [], status: [] },
      todayWork: { tasks: [], milestones: [] },
      notifications: []
    };

    projects.forEach(p => {
      data.summary.total++;
      if (p.status === 'completed') data.summary.completed++;
      else if (p.status === 'delayed') data.summary.delayed++;
      else if (p.status !== 'cancelled' && p.status !== 'on_hold') data.summary.active++;

      if (p.status === 'delayed') {
        data.alerts.status.push({ id: p._id, type: 'project_delayed', title: p.name, message: 'Project is delayed' });
      } else if (p.status === 'on_hold') {
        data.alerts.status.push({ id: p._id, type: 'project_on_hold', title: p.name, message: 'Project is on hold' });
      }
    });

    const tasks = await Task.find({ projectId: { $in: projectIds }, companyId: req.user.companyId }).populate('assignedTo', 'name');
    
    tasks.forEach(t => {
       if (t.deadline && t.status !== 'completed' && t.status !== 'cancelled') {
         const dl = new Date(t.deadline);
         const pName = projects.find(p => p._id.toString() === t.projectId.toString())?.name;
         
         if (dl < now) {
            data.alerts.deadlines.push({ id: t._id, title: t.name, project: pName, type: 'overdue', date: dl, status: t.status });
         } else if (dl <= twoDaysFromNow && dl >= now) {
            data.alerts.deadlines.push({ id: t._id, title: t.name, project: pName, type: t.type === 'milestone' ? 'milestone_nearing' : 'task_nearing', date: dl });
            if (dl.toDateString() === now.toDateString()) {
               if (t.type === 'milestone') {
                  data.todayWork.milestones.push({ id: t._id, title: t.name, project: pName, status: t.status });
               } else {
                  data.todayWork.tasks.push({ id: t._id, title: t.name, project: pName, status: t.status });
               }
            }
         }
       }
    });

    data.alerts.deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Fetch recent notifications via ActivityLog
    const recentLogs = await ActivityLog.find({ companyId: req.user.companyId })
      .populate('userId', 'name profilePhoto')
      .populate('projectId', 'name')
      .sort('-createdAt')
      .limit(20)
      .lean();

    data.notifications = recentLogs.map(log => ({
      id: log._id,
      project: log.projectId ? log.projectId.name : 'System',
      projectId: log.projectId ? log.projectId._id : null,
      notes: log.action.replace('_', ' ') + (log.details?.name ? `: ${log.details.name}` : ''),
      createdBy: log.userId,
      createdAt: log.createdAt
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
