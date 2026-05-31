const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Meeting = require('../models/Meeting');
const { isDateNotInPast } = require('../utils/dateUtils');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET all meetings
router.get('/', async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ date: 1, time: 1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new meeting
router.post('/', async (req, res) => {
  try {
    const { title, date, time } = req.body;
    
    // Validation
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    // Validate date is not in the past (compare as strings to avoid timezone issues)
    if (!isDateNotInPast(date)) {
      return res.status(400).json({ error: 'Cannot assign a meeting before today' });
    }

    const meeting = new Meeting({ title, date, time: time || '10:00' });
    await meeting.save();
    res.status(201).json(meeting);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST toggle meeting completion
router.post('/:id/toggle', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    meeting.completed = !meeting.completed;
    await meeting.save();
    res.json(meeting);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT update meeting
router.put('/:id', async (req, res) => {
  try {
    const { date } = req.body;

    // Validate date is not in the past if date is being updated
    if (date) {
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
      }

      // Validate date is not in the past (compare as strings to avoid timezone issues)
      if (!isDateNotInPast(date)) {
        return res.status(400).json({ error: 'Cannot assign a meeting before today' });
      }
    }

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    res.json(meeting);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE meeting
router.delete('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json({ message: 'Meeting deleted successfully', meeting });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

