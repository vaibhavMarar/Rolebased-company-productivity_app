const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const data = require('../data');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', (req, res) => {
  res.json(data.getMeetings());
});

router.post('/', (req, res) => {
  const { title, date, time } = req.body;
  
  // Validation
  if (!title || !date) {
    return res.status(400).json({ error: 'Title and date are required' });
  }

  // Validate date is not in the past
  const meetingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  meetingDate.setHours(0, 0, 0, 0);
  
  if (meetingDate < today) {
    return res.status(400).json({ error: 'Cannot assign a meeting before today' });
  }

  const meeting = data.createMeeting({ title, date, time });
  res.status(201).json(meeting);
});

router.post('/:id/toggle', (req, res) => {
  const { id } = req.params;
  const meeting = data.toggleMeeting(id);
  if (meeting) {
    res.json(meeting);
  } else {
    res.status(404).json({ error: 'Meeting not found' });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { date } = req.body;

  // Validate date is not in the past if date is being updated
  if (date) {
    const meetingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    meetingDate.setHours(0, 0, 0, 0);
    
    if (meetingDate < today) {
      return res.status(400).json({ error: 'Cannot assign a meeting before today' });
    }
  }

  const meeting = data.updateMeeting(id, req.body);
  if (meeting) {
    res.json(meeting);
  } else {
    res.status(404).json({ error: 'Meeting not found' });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const meeting = data.deleteMeeting(id);
  if (meeting) {
    res.json({ message: 'Meeting deleted successfully', meeting });
  } else {
    res.status(404).json({ error: 'Meeting not found' });
  }
});

module.exports = router;

