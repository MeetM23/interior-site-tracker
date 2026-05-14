const CalendarEvent = require('../models/CalendarEvent');

/**
 * Synchronize project details, tasks, and milestones into the CalendarEvent collection
 * @param {Object} project - The Mongoose document of the updated Project
 */
const syncProjectToCalendar = async (project) => {
  if (!project) return;

  const projectId = project._id;

  // 1. Fetch existing events for this project
  const existingEventsList = await CalendarEvent.find({ projectId });
  const existingEvents = new Map(existingEventsList.map(e => [e.refId?.toString() || e.type, e]));

  const currentRefs = new Set();
  const operations = [];

  // Helper to construct event
  const createOrUpdateEvent = (type, refId, title, date, color, status, assignedTo) => {
    if (!date) return;
    const refKey = refId ? refId.toString() : type;
    currentRefs.add(refKey);

    const match = existingEvents.get(refKey);
    if (!match) {
      operations.push({
        insertOne: {
          document: { projectId, type, refId, title, date, color, status, assignedTo }
        }
      });
    } else {
      // Check if anything changed to avoid unnecessary writes
      if (
        match.title !== title || 
        match.date.getTime() !== new Date(date).getTime() || 
        match.status !== status ||
        match.color !== color ||
        (match.assignedTo || '').toString() !== (assignedTo || '').toString()
      ) {
        operations.push({
          updateOne: {
            filter: { _id: match._id },
            update: { $set: { title, date, color, status, assignedTo } }
          }
        });
      }
    }
  };

  // 2. Sync Project Start/End Dates
  createOrUpdateEvent('project_start', null, `${project.name} - Start`, project.startDate, 'grey', project.status);
  createOrUpdateEvent('project_end', null, `${project.name} - End Target`, project.endDate, 'red', project.status);

  // 3. Sync Tasks
  if (project.tasks && Array.isArray(project.tasks)) {
    project.tasks.forEach(t => {
      createOrUpdateEvent('task', t._id, t.name, t.deadline, t.status === 'completed' ? 'grey' : 'blue', t.status, t.assignedTo);
    });
  }

  // 4. Sync Milestones
  if (project.milestones && Array.isArray(project.milestones)) {
    project.milestones.forEach(m => {
      createOrUpdateEvent('milestone', m._id, m.name, m.completedDate || m.targetDate, m.status === 'completed' ? 'grey' : 'green', m.status);
    });
  }

  // 5. Build deletions for removed tasks/milestones
  for (const [refKey, event] of existingEvents.entries()) {
    if (!currentRefs.has(refKey)) {
      operations.push({
        deleteOne: { filter: { _id: event._id } }
      });
    }
  }

  // 6. Execute bulk operations if any
  if (operations.length > 0) {
    await CalendarEvent.bulkWrite(operations);
  }
};

module.exports = { syncProjectToCalendar };
