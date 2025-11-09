const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const data = require('../data');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', (req, res) => {
  res.json(data.getTasks());
});

router.post('/', (req, res) => {
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

  const task = data.createTask({ title, date, time });
  res.status(201).json(task);
});

router.post('/:id/toggle', (req, res) => {
  const { id } = req.params;
  const task = data.toggleTask(id);
  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
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

  const task = data.updateTask(id, req.body);
  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const task = data.deleteTask(id);
  if (task) {
    res.json({ message: 'Task deleted successfully', task });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

module.exports = router;

