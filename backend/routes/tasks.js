const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const { isDateNotInPast } = require('../utils/dateUtils');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET all tasks (role-based: admin sees all, employees see only their tasks)
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Employees can only see their own tasks
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user.userId;
    }
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'username firstName lastName email')
      .populate('assignedBy', 'username firstName lastName')
      .sort({ date: 1, time: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new task (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, description, date, time, assignedTo, assignedToAll, additionalUsers, priority, deadline } = req.body;
    
    // Validation
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    if (!assignedToAll && !assignedTo && (!additionalUsers || additionalUsers.length === 0)) {
      return res.status(400).json({ error: 'Must assign to at least one user or select "All Users"' });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    // Validate deadline format if provided
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      return res.status(400).json({ error: 'Deadline must be in YYYY-MM-DD format' });
    }

    // Get list of users to assign to
    let userIdsToAssign = [];
    
    if (assignedToAll) {
      // Get all employee users
      const allEmployees = await User.find({ role: 'employee' }).select('_id');
      userIdsToAssign = allEmployees.map(u => u._id.toString());
    }
    
    // Add specific user if selected
    if (assignedTo) {
      if (!userIdsToAssign.includes(assignedTo)) {
        userIdsToAssign.push(assignedTo);
      }
    }
    
    // Add additional users if provided
    if (additionalUsers && Array.isArray(additionalUsers)) {
      additionalUsers.forEach(userId => {
        if (userId && !userIdsToAssign.includes(userId)) {
          userIdsToAssign.push(userId);
        }
      });
    }

    if (userIdsToAssign.length === 0) {
      return res.status(400).json({ error: 'No valid users to assign task to' });
    }

    // Create tasks for each user
    const createdTasks = [];
    for (const userId of userIdsToAssign) {
      const task = new Task({ 
        title, 
        description: description || '',
        date, 
        time: time || '09:00',
        assignedTo: userId,
        assignedBy: req.user.userId,
        priority: priority || 'medium',
        deadline: deadline || null,
        status: 'assigned'
      });
      
      await task.save();
      await task.populate('assignedTo', 'username firstName lastName email');
      await task.populate('assignedBy', 'username firstName lastName');
      createdTasks.push(task);
    }
    
    // Return the first task if single, or all tasks if multiple
    if (createdTasks.length === 1) {
      res.status(201).json(createdTasks[0]);
    } else {
      res.status(201).json({ 
        message: `Task created for ${createdTasks.length} users`,
        tasks: createdTasks 
      });
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID for assignedTo' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST toggle task completion (deprecated - use PUT for status updates)
router.post('/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Employees can only toggle their own tasks
    if (req.user.role !== 'admin' && String(task.assignedTo) !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own tasks' });
    }
    
    task.completed = !task.completed;
    if (task.completed) {
      task.status = 'completed';
      task.completedAt = new Date();
    } else {
      task.status = task.status === 'completed' ? 'in-progress' : task.status;
      task.completedAt = null;
    }
    await task.save();
    
    await task.populate('assignedTo', 'username firstName lastName email');
    await task.populate('assignedBy', 'username firstName lastName');
    
    res.json(task);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Employees can only update their own tasks
    if (req.user.role !== 'admin') {
      if (String(task.assignedTo) !== req.user.userId) {
        return res.status(403).json({ error: 'You can only update your own tasks' });
      }
      
      // Check if user has permission to update tasks (beyond just status)
      const user = await User.findById(req.user.userId);
      const hasUpdatePermission = user && user.permissions && user.permissions.canUpdateTasks;
      
      // Employees without update permission can only update status
      if (!hasUpdatePermission) {
        const allowedFields = ['status'];
        const updateFields = Object.keys(req.body);
        const disallowedFields = updateFields.filter(field => !allowedFields.includes(field));
        
        if (disallowedFields.length > 0) {
          return res.status(403).json({ 
            error: `You can only update status. Cannot update: ${disallowedFields.join(', ')}` 
          });
        }
      }
    }
    
    // Admin can update all fields
    const updateData = { ...req.body };
    
    // Validate date format if provided
    if (updateData.date && !/^\d{4}-\d{2}-\d{2}$/.test(updateData.date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }
    
    // Validate deadline format if provided
    if (updateData.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(updateData.deadline)) {
      return res.status(400).json({ error: 'Deadline must be in YYYY-MM-DD format' });
    }
    
    // Handle status updates
    if (updateData.status === 'completed') {
      updateData.completed = true;
      if (!updateData.completedAt) {
        updateData.completedAt = new Date();
      }
    } else if (updateData.status && updateData.status !== 'completed') {
      updateData.completed = false;
      updateData.completedAt = null;
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    await updatedTask.populate('assignedTo', 'username firstName lastName email');
    await updatedTask.populate('assignedBy', 'username firstName lastName');
    
    res.json(updatedTask);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Admin can delete any task
    if (req.user.role === 'admin') {
      await Task.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Task deleted successfully', task });
    }
    
    // Employees can only delete their own tasks if they have permission
    if (String(task.assignedTo) !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own tasks' });
    }
    
    // Check if user has delete permission
    const user = await User.findById(req.user.userId);
    const hasDeletePermission = user && user.permissions && user.permissions.canDeleteTasks;
    
    if (!hasDeletePermission) {
      return res.status(403).json({ error: 'You do not have permission to delete tasks' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully', task });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

