import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import EventModal from './EventModal';

const CalendarView = ({ 
  tasks, 
  meetings, 
  onDataChange,
  onCreateTask,
  onCreateMeeting,
  onUpdateTask,
  onUpdateMeeting,
  onDeleteTask,
  onDeleteMeeting
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventType, setEventType] = useState('task'); // 'task' or 'meeting'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthStart = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return date;
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return date;
  }, [currentDate]);

  const calendarDays = useMemo(() => {
    const days = [];
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  }, [monthStart]);

  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const days = [];
    const startDate = new Date(currentDate);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(startDate.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }

    return days;
  }, [currentDate, viewMode]);

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.date === dateStr);
    const dayMeetings = meetings.filter(m => m.date === dateStr);
    return { tasks: dayTasks, meetings: dayMeetings };
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleDateClick = (date, event = null) => {
    if (event) {
      setSelectedEvent(event);
      setEventType(event.type || 'task');
      setSelectedDate(new Date(event.date));
      setIsModalOpen(true);
    } else {
      setSelectedDate(date);
      setSelectedEvent(null);
      setIsModalOpen(true);
    }
  };

  const handleSave = (eventData) => {
    // Validate date before saving
    const finalData = {
      ...eventData,
      date: eventData.date || formatDate(selectedDate || new Date())
    };
    
    const eventDate = new Date(finalData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      alert('Cannot assign a ' + eventType + ' before today');
      return;
    }

    if (selectedEvent) {
      // Update existing event
      if (selectedEvent.type === 'task' || eventType === 'task') {
        onUpdateTask(selectedEvent.id, finalData);
      } else {
        onUpdateMeeting(selectedEvent.id, finalData);
      }
    } else {
      // Create new event
      if (eventType === 'task') {
        onCreateTask(finalData);
      } else {
        onCreateMeeting(finalData);
      }
    }
    
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleDelete = (id) => {
    const typeToUse = selectedEvent?.type || eventType;
    if (typeToUse === 'task') {
      onDeleteTask(id);
    } else {
      onDeleteMeeting(id);
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonthView = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="calendar-month-view">
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-grid-month">
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const { tasks: dayTasks, meetings: dayMeetings } = getEventsForDate(date);
            const allEvents = [
              ...dayTasks.map(t => ({ ...t, type: 'task' })),
              ...dayMeetings.map(m => ({ ...m, type: 'meeting' }))
            ].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            return (
              <motion.div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => handleDateClick(date)}
              >
                <div className="calendar-day-number">{date.getDate()}</div>
                <div className="calendar-day-events">
                  {allEvents.slice(0, 3).map((event, idx) => (
                    <motion.div
                      key={event.id}
                      className={`calendar-event ${event.type} ${event.completed ? 'completed' : ''}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateClick(date, event);
                      }}
                    >
                      <span className="event-time">{formatTime(event.time)}</span>
                      <span className="event-title">{event.title}</span>
                    </motion.div>
                  ))}
                  {allEvents.length > 3 && (
                    <div className="calendar-event-more">+{allEvents.length - 3} more</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="calendar-week-view">
        <div className="calendar-week-header">
          <div className="calendar-time-column"></div>
          {weekDays.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const { tasks: dayTasks, meetings: dayMeetings } = getEventsForDate(date);
            
            return (
              <div key={index} className={`calendar-week-day-header ${isToday ? 'today' : ''}`}>
                <div className="week-day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="week-day-number">{date.getDate()}</div>
                <div className="week-day-counts">
                  <span className="count-tasks">{dayTasks.length}</span>
                  <span className="count-meetings">{dayMeetings.length}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="calendar-week-body">
          <div className="calendar-time-column">
            {hours.map(hour => (
              <div key={hour} className="calendar-hour">{hour.toString().padStart(2, '0')}:00</div>
            ))}
          </div>
          {weekDays.map((date, dayIndex) => {
            const { tasks: dayTasks, meetings: dayMeetings } = getEventsForDate(date);
            const allEvents = [
              ...dayTasks.map(t => ({ ...t, type: 'task' })),
              ...dayMeetings.map(m => ({ ...m, type: 'meeting' }))
            ];

            return (
              <div key={dayIndex} className="calendar-week-day-column">
                {hours.map((hour, hourIndex) => {
                  const hourEvents = allEvents.filter(event => {
                    if (!event.time) return false;
                    const eventHour = parseInt(event.time.split(':')[0]);
                    return eventHour === hour;
                  });

                  return (
                    <div
                      key={hourIndex}
                      className="calendar-hour-slot"
                      onClick={() => {
                        const clickedDate = new Date(date);
                        clickedDate.setHours(hour, 0, 0, 0);
                        handleDateClick(clickedDate);
                      }}
                    >
                      {hourEvents.map((event, idx) => (
                        <motion.div
                          key={event.id}
                          className={`calendar-week-event ${event.type} ${event.completed ? 'completed' : ''}`}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateClick(date, event);
                          }}
                        >
                          <div className="week-event-time">{formatTime(event.time)}</div>
                          <div className="week-event-title">{event.title}</div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-view-container">
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button onClick={() => navigateMonth(-1)} className="nav-btn">‹</button>
          <button onClick={goToToday} className="today-btn">Today</button>
          <button onClick={() => navigateMonth(1)} className="nav-btn">›</button>
          <h2 className="calendar-title">
            {viewMode === 'month'
              ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : `Week of ${weekDays[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </h2>
        </div>
        <div className="calendar-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
          <div className="event-type-toggle">
            <button
              className={`btn-new-event ${eventType === 'task' ? 'active' : ''}`}
              onClick={() => {
                setEventType('task');
                setSelectedDate(new Date());
                setSelectedEvent(null);
                setIsModalOpen(true);
              }}
            >
              + Task
            </button>
            <button
              className={`btn-new-event ${eventType === 'meeting' ? 'active' : ''}`}
              onClick={() => {
                setEventType('meeting');
                setSelectedDate(new Date());
                setSelectedEvent(null);
                setIsModalOpen(true);
              }}
            >
              + Meeting
            </button>
          </div>
        </div>
      </div>

      <motion.div
        className="calendar-content"
        key={viewMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
      </motion.div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        event={selectedEvent ? { ...selectedEvent, date: selectedEvent.date || formatDate(selectedDate || new Date()) } : null}
        type={eventType === 'task' ? 'Task' : 'Meeting'}
        onSave={handleSave}
        onDelete={handleDelete}
        defaultDate={selectedDate}
      />
    </div>
  );
};

export default CalendarView;

