import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EventModal = ({ isOpen, onClose, event, type, onSave, onDelete, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title || '');
        setDate(event.date || '');
        setTime(event.time || '09:00');
      } else {
        const dateToUse = defaultDate 
          ? (typeof defaultDate === 'string' ? defaultDate : defaultDate.toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0];
        setTitle('');
        setDate(dateToUse);
        setTime('09:00');
      }
      setErrors({});
    }
  }, [event, isOpen, defaultDate]);

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if date is in the past
  const isDateInPast = (dateString) => {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    } else if (isDateInPast(date)) {
      newErrors.date = 'Cannot assign a ' + type.toLowerCase() + ' before today';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...(event && { id: event.id }),
      title: title.trim(),
      date,
      time,
    });
  };

  // Check if save button should be disabled
  const isSaveDisabled = !title.trim() || !date || isDateInPast(date);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      onDelete(event.id);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{event ? `Edit ${type}` : `New ${type}`}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Enter ${type.toLowerCase()} title`}
                className={errors.title ? 'error' : ''}
                autoFocus
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  min={getTodayDate()}
                  onChange={(e) => {
                    setDate(e.target.value);
                    // Clear date error when user changes date
                    if (errors.date) {
                      setErrors({ ...errors, date: '' });
                    }
                  }}
                  className={errors.date ? 'error' : ''}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="time">Time</label>
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              {event && (
                <button
                  type="button"
                  className="btn-delete"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
              <div className="modal-actions-right">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={isSaveDisabled}
                >
                  {event ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventModal;

