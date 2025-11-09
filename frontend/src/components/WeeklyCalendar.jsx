import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { showToast } from '../utils/toast';
import DayCard from './DayCard';
import ProductivityChart from './ProductivityChart';
import CalendarView from './CalendarView';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper to get day name from date
const getDayName = (dateString) => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Initialize with sample data if localStorage is empty
const getInitialTasks = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }

  return [
    { id: 1, date: weekDates[0], day: getDayName(weekDates[0]), title: 'Complete project proposal', completed: false, time: '09:00' },
    { id: 2, date: weekDates[0], day: getDayName(weekDates[0]), title: 'Review code changes', completed: true, time: '14:00' },
    { id: 3, date: weekDates[1], day: getDayName(weekDates[1]), title: 'Team standup preparation', completed: false, time: '10:00' },
    { id: 4, date: weekDates[2], day: getDayName(weekDates[2]), title: 'Update documentation', completed: false, time: '11:00' },
    { id: 5, date: weekDates[3], day: getDayName(weekDates[3]), title: 'Fix bug in login flow', completed: true, time: '15:00' },
  ];
};

const getInitialMeetings = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }

  return [
    { id: 1, date: weekDates[0], day: getDayName(weekDates[0]), title: 'Team meeting', time: '10:00', completed: true },
    { id: 2, date: weekDates[0], day: getDayName(weekDates[0]), title: 'Client call', time: '14:00', completed: false },
    { id: 3, date: weekDates[1], day: getDayName(weekDates[1]), title: 'Sprint planning', time: '11:00', completed: false },
    { id: 4, date: weekDates[2], day: getDayName(weekDates[2]), title: 'Design review', time: '15:00', completed: true },
  ];
};

const WeeklyCalendar = ({ onLogout }) => {
  const [tasks, setTasks] = useLocalStorage('weekly_tasks', getInitialTasks());
  const [meetings, setMeetings] = useLocalStorage('weekly_meetings', getInitialMeetings());
  const [view, setView] = useState('weekly'); // 'weekly' or 'calendar'
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Get Monday of current week
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Get next ID for new items
  const getNextTaskId = useCallback(() => {
    return tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
  }, [tasks]);

  const getNextMeetingId = useCallback(() => {
    return meetings.length > 0 ? Math.max(...meetings.map(m => m.id)) + 1 : 1;
  }, [meetings]);

  // Local state handlers - no backend calls
  const handleToggleTask = useCallback((id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  }, [tasks, setTasks]);

  const handleToggleMeeting = useCallback((id) => {
    setMeetings(meetings.map(m => {
      if (m.id === id) {
        return { ...m, completed: !m.completed };
      }
      return m;
    }));
  }, [meetings, setMeetings]);

  // Create task locally
  const handleCreateTask = useCallback((taskData) => {
    const newTask = {
      id: getNextTaskId(),
      date: taskData.date,
      day: getDayName(taskData.date),
      title: taskData.title,
      completed: false,
      time: taskData.time || '09:00'
    };
    setTasks([...tasks, newTask]);
    showToast('Task added successfully!', 'success');
  }, [tasks, setTasks, getNextTaskId]);

  // Create meeting locally
  const handleCreateMeeting = useCallback((meetingData) => {
    const newMeeting = {
      id: getNextMeetingId(),
      date: meetingData.date,
      day: getDayName(meetingData.date),
      title: meetingData.title,
      time: meetingData.time || '10:00',
      completed: false
    };
    setMeetings([...meetings, newMeeting]);
    showToast('Meeting added successfully!', 'success');
  }, [meetings, setMeetings, getNextMeetingId]);

  // Update task locally
  const handleUpdateTask = useCallback((id, taskData) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          title: taskData.title || t.title,
          date: taskData.date || t.date,
          day: taskData.date ? getDayName(taskData.date) : t.day,
          time: taskData.time || t.time,
          completed: taskData.completed !== undefined ? taskData.completed : t.completed
        };
      }
      return t;
    }));
    showToast('Task updated successfully!', 'success');
  }, [tasks, setTasks]);

  // Update meeting locally
  const handleUpdateMeeting = useCallback((id, meetingData) => {
    setMeetings(meetings.map(m => {
      if (m.id === id) {
        return {
          ...m,
          title: meetingData.title || m.title,
          date: meetingData.date || m.date,
          day: meetingData.date ? getDayName(meetingData.date) : m.day,
          time: meetingData.time || m.time,
          completed: meetingData.completed !== undefined ? meetingData.completed : m.completed
        };
      }
      return m;
    }));
    showToast('Meeting updated successfully!', 'success');
  }, [meetings, setMeetings]);

  // Delete task locally
  const handleDeleteTask = useCallback((id) => {
    setTasks(tasks.filter(t => t.id !== id));
    showToast('Task deleted successfully!', 'success');
  }, [tasks, setTasks]);

  // Delete meeting locally
  const handleDeleteMeeting = useCallback((id) => {
    setMeetings(meetings.filter(m => m.id !== id));
    showToast('Meeting deleted successfully!', 'success');
  }, [meetings, setMeetings]);

  // Stable callback for data refresh (no-op now, but kept for compatibility)
  const handleDataChange = useCallback(() => {
    // No backend call needed - state is already updated
  }, []);

  // Get week dates - MUST be called before any conditional returns
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push({
        day: DAYS[i],
        date: date.toISOString().split('T')[0],
        dateObj: date
      });
    }
    return dates;
  }, [currentWeekStart]);

  // Filter tasks and meetings for current week - MUST be called before any conditional returns
  const weekTasks = useMemo(() => {
    if (!weekDates.length) return [];
    const weekDateStrings = weekDates.map(d => d.date);
    return tasks.filter(t => weekDateStrings.includes(t.date));
  }, [tasks, weekDates]);

  const weekMeetings = useMemo(() => {
    if (!weekDates.length) return [];
    const weekDateStrings = weekDates.map(d => d.date);
    return meetings.filter(m => weekDateStrings.includes(m.date));
  }, [meetings, weekDates]);

  // Format week range - MUST be called before any conditional returns
  const weekRange = useMemo(() => {
    if (!weekDates.length) return '';
    const start = weekDates[0].dateObj;
    const end = weekDates[6].dateObj;
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    return `${formatDate(start)} – ${formatDate(end)}`;
  }, [weekDates]);

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <h1>Weekly</h1>
        <div className="header-actions">
          <div className="view-switcher">
            <button
              className={view === 'weekly' ? 'active' : ''}
              onClick={() => setView('weekly')}
            >
              Weekly View
            </button>
            <button
              className={view === 'calendar' ? 'active' : ''}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
          </div>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </header>
      
      {view === 'weekly' ? (
        <>
          <div className="weekly-header">
            <div className="week-navigation">
              <button onClick={() => navigateWeek(-1)} className="nav-week-btn">‹</button>
              <button onClick={goToCurrentWeek} className="today-week-btn">Today</button>
              <button onClick={() => navigateWeek(1)} className="nav-week-btn">›</button>
              <h2 className="week-range">Week of {weekRange}</h2>
            </div>
          </div>
          <ProductivityChart tasks={weekTasks} meetings={weekMeetings} />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWeekStart.toISOString()}
              className="calendar-grid"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {weekDates.map((weekDate, index) => (
                <DayCard
                  key={`${weekDate.date}-${index}`}
                  day={weekDate.day}
                  date={weekDate.dateObj}
                  tasks={weekTasks}
                  meetings={weekMeetings}
                  onToggleTask={handleToggleTask}
                  onToggleMeeting={handleToggleMeeting}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        <CalendarView
          tasks={tasks}
          meetings={meetings}
          onDataChange={handleDataChange}
          onCreateTask={handleCreateTask}
          onCreateMeeting={handleCreateMeeting}
          onUpdateTask={handleUpdateTask}
          onUpdateMeeting={handleUpdateMeeting}
          onDeleteTask={handleDeleteTask}
          onDeleteMeeting={handleDeleteMeeting}
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;

