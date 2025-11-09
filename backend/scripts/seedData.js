const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calendar_app';

// Helper function to get dates for current week
const getCurrentWeekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(today.setDate(diff));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Task.deleteMany({});
    await Meeting.deleteMany({});
    console.log('Cleared existing data');

    const weekDates = getCurrentWeekDates();

    // Seed tasks
    const tasks = [
      { date: weekDates[0], title: 'Complete project proposal', completed: false, time: '09:00' },
      { date: weekDates[0], title: 'Review code changes', completed: true, time: '14:00' },
      { date: weekDates[1], title: 'Team standup preparation', completed: false, time: '10:00' },
      { date: weekDates[2], title: 'Update documentation', completed: false, time: '11:00' },
      { date: weekDates[3], title: 'Fix bug in login flow', completed: true, time: '15:00' },
      { date: weekDates[4], title: 'Deploy to staging', completed: false, time: '16:00' },
      { date: weekDates[5], title: 'Weekend reading', completed: false, time: '10:00' },
      { date: weekDates[6], title: 'Plan next week', completed: false, time: '14:00' },
    ];

    // Seed meetings
    const meetings = [
      { date: weekDates[0], title: 'Team meeting', time: '10:00', completed: true },
      { date: weekDates[0], title: 'Client call', time: '14:00', completed: false },
      { date: weekDates[1], title: 'Sprint planning', time: '11:00', completed: false },
      { date: weekDates[2], title: 'Design review', time: '15:00', completed: true },
      { date: weekDates[3], title: 'One-on-one', time: '13:00', completed: false },
      { date: weekDates[4], title: 'Retrospective', time: '16:00', completed: false },
      { date: weekDates[5], title: 'Personal catch-up', time: '10:00', completed: false },
      { date: weekDates[6], title: 'Family meeting', time: '14:00', completed: false },
    ];

    // Insert tasks
    const insertedTasks = await Task.insertMany(tasks);
    console.log(`Inserted ${insertedTasks.length} tasks`);

    // Insert meetings
    const insertedMeetings = await Meeting.insertMany(meetings);
    console.log(`Inserted ${insertedMeetings.length} meetings`);

    console.log('Data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

