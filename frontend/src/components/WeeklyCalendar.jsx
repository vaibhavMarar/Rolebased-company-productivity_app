import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { showToast } from '../utils/toast';
import DayCard from './DayCard';
import ProductivityChart from './ProductivityChart';
import CalendarView from './CalendarView';
import EventModal from './EventModal';
import { formatDateToLocal, parseLocalDate } from '../utils/dateUtils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper to get day name from date string (YYYY-MM-DD)
const getDayName = (dateString) => {
  const date = parseLocalDate(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const WeeklyCalendar = ({ onLogout, user, onBackToDashboard }) => {
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventType, setEventType] = useState('task'); // 'task' or 'meeting'

  // Fetch tasks and meetings from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksData, meetingsData] = await Promise.all([
        api.getTasks(),
        api.getMeetings()
      ]);
      setTasks(tasksData || []);
      setMeetings(meetingsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
      showToast(err.message || 'Failed to load data', 'error');
      // If it's an auth error, the API service will handle logout
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle task completion
  const handleToggleTask = useCallback(async (id) => {
    try {
      const updatedTask = await api.toggleTask(id);
      setTasks(tasks.map(t => String(t.id) === String(id) ? updatedTask : t));
      showToast('Task updated successfully!', 'success');
    } catch (err) {
      console.error('Error toggling task:', err);
      showToast(err.message || 'Failed to update task', 'error');
      // Refresh data on error
      fetchData();
    }
  }, [tasks, fetchData]);

  // Toggle meeting completion
  const handleToggleMeeting = useCallback(async (id) => {
    try {
      const updatedMeeting = await api.toggleMeeting(id);
      setMeetings(meetings.map(m => String(m.id) === String(id) ? updatedMeeting : m));
      showToast('Meeting updated successfully!', 'success');
    } catch (err) {
      console.error('Error toggling meeting:', err);
      showToast(err.message || 'Failed to update meeting', 'error');
      // Refresh data on error
      fetchData();
    }
  }, [meetings, fetchData]);

  // Create task
  const handleCreateTask = useCallback(async (taskData) => {
    try {
      const newTask = await api.createTask(taskData);
      setTasks([...tasks, newTask]);
      showToast('Task added successfully!', 'success');
    } catch (err) {
      console.error('Error creating task:', err);
      showToast(err.message || 'Failed to create task', 'error');
    }
  }, [tasks]);

  // Create meeting
  const handleCreateMeeting = useCallback(async (meetingData) => {
    try {
      const newMeeting = await api.createMeeting(meetingData);
      setMeetings([...meetings, newMeeting]);
      showToast('Meeting added successfully!', 'success');
    } catch (err) {
      console.error('Error creating meeting:', err);
      showToast(err.message || 'Failed to create meeting', 'error');
    }
  }, [meetings]);

  // Update task
  const handleUpdateTask = useCallback(async (id, taskData) => {
    try {
      const updatedTask = await api.updateTask(id, taskData);
      setTasks(tasks.map(t => String(t.id) === String(id) ? updatedTask : t));
      showToast('Task updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating task:', err);
      showToast(err.message || 'Failed to update task', 'error');
      // Refresh data on error
      fetchData();
    }
  }, [tasks, fetchData]);

  // Update meeting
  const handleUpdateMeeting = useCallback(async (id, meetingData) => {
    try {
      const updatedMeeting = await api.updateMeeting(id, meetingData);
      setMeetings(meetings.map(m => String(m.id) === String(id) ? updatedMeeting : m));
      showToast('Meeting updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating meeting:', err);
      showToast(err.message || 'Failed to update meeting', 'error');
      // Refresh data on error
      fetchData();
    }
  }, [meetings, fetchData]);

  // Delete task
  const handleDeleteTask = useCallback(async (id) => {
    try {
      await api.deleteTask(id);
      setTasks(tasks.filter(t => String(t.id) !== String(id)));
      showToast('Task deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast(err.message || 'Failed to delete task', 'error');
      // Refresh data on error
      fetchData();
    }
  }, [tasks, fetchData]);

  // Delete meeting
  const handleDeleteMeeting = useCallback(async (id) => {
    try {
      await api.deleteMeeting(id);
      setMeetings(meetings.filter(m => String(m.id) !== String(id)));
      showToast('Meeting deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting meeting:', err);
      showToast(err.message || 'Failed to delete meeting', 'error');
      // Refresh data on error
      fetchData();
    }
  }, [meetings, fetchData]);

  // Handle edit task from DayCard
  const handleEditTask = useCallback((task) => {
    setSelectedEvent(task);
    setEventType('task');
    setIsModalOpen(true);
  }, []);

  // Handle edit meeting from DayCard
  const handleEditMeeting = useCallback((meeting) => {
    setSelectedEvent(meeting);
    setEventType('meeting');
    setIsModalOpen(true);
  }, []);

  // Handle save from EventModal (for weekly view)
  const handleSaveEvent = useCallback((eventData) => {
    if (selectedEvent) {
      // Update existing event
      if (eventType === 'task') {
        handleUpdateTask(selectedEvent.id, eventData);
      } else {
        handleUpdateMeeting(selectedEvent.id, eventData);
      }
    } else {
      // Create new event (shouldn't happen from DayCard, but handle it)
      if (eventType === 'task') {
        handleCreateTask(eventData);
      } else {
        handleCreateMeeting(eventData);
      }
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, [selectedEvent, eventType, handleUpdateTask, handleUpdateMeeting, handleCreateTask, handleCreateMeeting]);

  // Handle delete from EventModal (for weekly view)
  const handleDeleteEvent = useCallback((id) => {
    if (eventType === 'task') {
      handleDeleteTask(id);
    } else {
      handleDeleteMeeting(id);
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, [eventType, handleDeleteTask, handleDeleteMeeting]);

  // Refresh data
  const handleDataChange = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Get week dates
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push({
        day: DAYS[i],
        date: formatDateToLocal(date),
        dateObj: date
      });
    }
    return dates;
  }, [currentWeekStart]);

  // Filter tasks and meetings for current week
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

  // Format week range
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

  // Show loading state
  if (loading && tasks.length === 0 && meetings.length === 0) {
    return (
      <div className="calendar-container">
        <header className="calendar-header">
          <h1>Weekly</h1>
          <div className="header-actions">
            <button onClick={onLogout} className="logout-button">Logout</button>
          </div>
        </header>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          color: '#e0e0e0'
        }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && tasks.length === 0 && meetings.length === 0) {
    return (
      <div className="calendar-container">
        <header className="calendar-header">
          <h1>Weekly</h1>
          <div className="header-actions">
            <button onClick={onLogout} className="logout-button">Logout</button>
          </div>
        </header>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          color: '#e0e0e0',
          gap: '1rem'
        }}>
          <div style={{ color: '#ff6b6b' }}>Error: {error}</div>
          <button 
            onClick={fetchData} 
            style={{
              padding: '0.5rem 1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <h1>Weekly{user?.username ? ` - ${user.username}` : ''}</h1>
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
          {onBackToDashboard && (
            <button 
              onClick={onBackToDashboard} 
              style={{
                padding: '0.5rem 1rem',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              Back to Dashboard
            </button>
          )}
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </header>
      
      {error && (
        <div className="error-banner" style={{ marginBottom: '1rem' }}>
          {error} - <button onClick={fetchData} style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#ff6b6b', 
            textDecoration: 'underline', 
            cursor: 'pointer' 
          }}>Retry</button>
        </div>
      )}
      
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
                  onEditTask={handleEditTask}
                  onEditMeeting={handleEditMeeting}
                  onDeleteTask={handleDeleteTask}
                  onDeleteMeeting={handleDeleteMeeting}
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

      {/* EventModal for editing from DayCard */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent ? { ...selectedEvent, date: selectedEvent.date || formatDateToLocal(new Date()) } : null}
        type={eventType === 'task' ? 'Task' : 'Meeting'}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        defaultDate={selectedEvent?.date ? parseLocalDate(selectedEvent.date) : null}
      />
    </div>
  );
};

export default WeeklyCalendar;
