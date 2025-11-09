// In-memory data storage
// Helper function to get dates for current week
const getCurrentWeekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(today.setDate(diff));
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push({
      day: days[i],
      date: date.toISOString().split('T')[0],
      dateObj: date
    });
  }
  
  return dates;
};

const weekDates = getCurrentWeekDates();

let tasks = [
  { id: 1, date: weekDates[0].date, day: 'Monday', title: 'Complete project proposal', completed: false, time: '09:00' },
  { id: 2, date: weekDates[0].date, day: 'Monday', title: 'Review code changes', completed: true, time: '14:00' },
  { id: 3, date: weekDates[1].date, day: 'Tuesday', title: 'Team standup preparation', completed: false, time: '10:00' },
  { id: 4, date: weekDates[2].date, day: 'Wednesday', title: 'Update documentation', completed: false, time: '11:00' },
  { id: 5, date: weekDates[3].date, day: 'Thursday', title: 'Fix bug in login flow', completed: true, time: '15:00' },
  { id: 6, date: weekDates[4].date, day: 'Friday', title: 'Deploy to staging', completed: false, time: '16:00' },
  { id: 7, date: weekDates[5].date, day: 'Saturday', title: 'Weekend reading', completed: false, time: '10:00' },
  { id: 8, date: weekDates[6].date, day: 'Sunday', title: 'Plan next week', completed: false, time: '14:00' },
];

let meetings = [
  { id: 1, date: weekDates[0].date, day: 'Monday', title: 'Team meeting', time: '10:00', completed: true },
  { id: 2, date: weekDates[0].date, day: 'Monday', title: 'Client call', time: '14:00', completed: false },
  { id: 3, date: weekDates[1].date, day: 'Tuesday', title: 'Sprint planning', time: '11:00', completed: false },
  { id: 4, date: weekDates[2].date, day: 'Wednesday', title: 'Design review', time: '15:00', completed: true },
  { id: 5, date: weekDates[3].date, day: 'Thursday', title: 'One-on-one', time: '13:00', completed: false },
  { id: 6, date: weekDates[4].date, day: 'Friday', title: 'Retrospective', time: '16:00', completed: false },
  { id: 7, date: weekDates[5].date, day: 'Saturday', title: 'Personal catch-up', time: '10:00', completed: false },
  { id: 8, date: weekDates[6].date, day: 'Sunday', title: 'Family meeting', time: '14:00', completed: false },
];

let nextTaskId = 9;
let nextMeetingId = 9;

// Helper to get day name from date
const getDayName = (dateString) => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

module.exports = {
  tasks,
  meetings,
  getTasks: () => tasks,
  getMeetings: () => meetings,
  toggleTask: (id) => {
    const task = tasks.find(t => t.id === parseInt(id));
    if (task) {
      task.completed = !task.completed;
      return task;
    }
    return null;
  },
  toggleMeeting: (id) => {
    const meeting = meetings.find(m => m.id === parseInt(id));
    if (meeting) {
      meeting.completed = !meeting.completed;
      return meeting;
    }
    return null;
  },
  createTask: (taskData) => {
    const newTask = {
      id: nextTaskId++,
      date: taskData.date,
      day: getDayName(taskData.date),
      title: taskData.title,
      completed: false,
      time: taskData.time || '09:00'
    };
    tasks.push(newTask);
    return newTask;
  },
  createMeeting: (meetingData) => {
    const newMeeting = {
      id: nextMeetingId++,
      date: meetingData.date,
      day: getDayName(meetingData.date),
      title: meetingData.title,
      time: meetingData.time || '10:00',
      completed: false
    };
    meetings.push(newMeeting);
    return newMeeting;
  },
  updateTask: (id, taskData) => {
    const task = tasks.find(t => t.id === parseInt(id));
    if (task) {
      if (taskData.title !== undefined) task.title = taskData.title;
      if (taskData.date !== undefined) {
        task.date = taskData.date;
        task.day = getDayName(taskData.date);
      }
      if (taskData.time !== undefined) task.time = taskData.time;
      if (taskData.completed !== undefined) task.completed = taskData.completed;
      return task;
    }
    return null;
  },
  updateMeeting: (id, meetingData) => {
    const meeting = meetings.find(m => m.id === parseInt(id));
    if (meeting) {
      if (meetingData.title !== undefined) meeting.title = meetingData.title;
      if (meetingData.date !== undefined) {
        meeting.date = meetingData.date;
        meeting.day = getDayName(meetingData.date);
      }
      if (meetingData.time !== undefined) meeting.time = meetingData.time;
      if (meetingData.completed !== undefined) meeting.completed = meetingData.completed;
      return meeting;
    }
    return null;
  },
  deleteTask: (id) => {
    const index = tasks.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
      return tasks.splice(index, 1)[0];
    }
    return null;
  },
  deleteMeeting: (id) => {
    const index = meetings.findIndex(m => m.id === parseInt(id));
    if (index !== -1) {
      return meetings.splice(index, 1)[0];
    }
    return null;
  }
};

