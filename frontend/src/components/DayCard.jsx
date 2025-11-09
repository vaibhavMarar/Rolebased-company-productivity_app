import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DayCard = ({ day, date, tasks, meetings, onToggleTask, onToggleMeeting }) => {
  const [expanded, setExpanded] = useState(false);

  const dateStr = date ? date.toISOString().split('T')[0] : null;
  const dayTasks = useMemo(() => {
    if (dateStr) {
      return tasks.filter(t => t.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }
    return tasks.filter(t => t.day === day).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [tasks, dateStr, day]);

  const dayMeetings = useMemo(() => {
    if (dateStr) {
      return meetings.filter(m => m.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }
    return meetings.filter(m => m.day === day).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [meetings, dateStr, day]);

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isToday = date ? date.toDateString() === new Date().toDateString() : false;
  
  const completedTasks = dayTasks.filter(t => t.completed).length;
  const completedMeetings = dayMeetings.filter(m => m.completed).length;

  return (
    <motion.div 
      className={`day-card ${isToday ? 'today' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="day-header" onClick={() => setExpanded(!expanded)}>
        <div className="day-title-section">
          <h3>{day.substring(0, 3)}</h3>
          {date && <span className="day-date">{formatDate(date)}</span>}
        </div>
        <div className="day-stats">
          <span className="stat">
            <span className="stat-label">Tasks:</span>
            <span className="stat-value">{completedTasks}/{dayTasks.length}</span>
          </span>
          <span className="stat">
            <span className="stat-label">Meetings:</span>
            <span className="stat-value">{completedMeetings}/{dayMeetings.length}</span>
          </span>
        </div>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="day-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="section">
              <h4>Tasks ({completedTasks}/{dayTasks.length})</h4>
              {dayTasks.length === 0 ? (
                <p className="empty-message">No tasks</p>
              ) : (
                <ul className="item-list">
                  {dayTasks.map((task, idx) => (
                    <motion.li
                      key={task.id}
                      className="item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => onToggleTask(task.id)}
                        />
                        <div className="item-content">
                          {task.time && <span className="item-time">{formatTime(task.time)}</span>}
                          <span className={task.completed ? 'completed' : ''}>
                            {task.title}
                          </span>
                        </div>
                      </label>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="section">
              <h4>Meetings ({completedMeetings}/{dayMeetings.length})</h4>
              {dayMeetings.length === 0 ? (
                <p className="empty-message">No meetings</p>
              ) : (
                <ul className="item-list">
                  {dayMeetings.map((meeting, idx) => (
                    <motion.li
                      key={meeting.id}
                      className="item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={meeting.completed}
                          onChange={() => onToggleMeeting(meeting.id)}
                        />
                        <div className="item-content">
                          <span className="meeting-time">{formatTime(meeting.time)}</span>
                          <span className={`meeting-title ${meeting.completed ? 'completed' : ''}`}>
                            {meeting.title}
                          </span>
                        </div>
                      </label>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DayCard;

