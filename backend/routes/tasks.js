const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Task = require('../models/Task');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ date: 1, time: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new task
router.post('/', async (req, res) => {
  try {
    const { title, date, time } = req.body;
    
    // Validation
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Validate date is not in the past
    const taskDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate < today) {
      return res.status(400).json({ error: 'Cannot assign a task before today' });
    }

    const task = new Task({ title, date, time: time || '09:00' });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST toggle task completion
router.post('/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.completed = !task.completed;
    await task.save();
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
    const { date } = req.body;

    // Validate date is not in the past if date is being updated
    if (date) {
      const taskDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      taskDate.setHours(0, 0, 0, 0);
      
      if (taskDate < today) {
        return res.status(400).json({ error: 'Cannot assign a task before today' });
      }
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
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
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully', task });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

