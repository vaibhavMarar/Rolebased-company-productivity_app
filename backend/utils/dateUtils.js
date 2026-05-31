/**
 * Date utility functions for backend date handling
 * All dates are stored and compared as YYYY-MM-DD strings without timezone conversion
 */

/**
 * Parse a YYYY-MM-DD date string to a Date object in local timezone
 * This avoids timezone conversion issues when using new Date('YYYY-MM-DD')
 * which interprets the date as UTC midnight
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in local timezone
 */
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString !== 'string') return dateString; // Already a Date object
  
  // Parse YYYY-MM-DD format directly without timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

/**
 * Get today's date as YYYY-MM-DD in local timezone
 * @returns {string} Today's date in YYYY-MM-DD format
 */
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Compare two date strings (YYYY-MM-DD) to check if date1 is before date2
 * @param {string} date1 - First date string (YYYY-MM-DD)
 * @param {string} date2 - Second date string (YYYY-MM-DD)
 * @returns {boolean} True if date1 is before date2
 */
const isDateBefore = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1 < date2;
};

/**
 * Check if a date string is today or in the future
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date is today or in the future
 */
const isDateValid = (dateString) => {
  if (!dateString) return false;
  const today = getTodayDate();
  return dateString >= today;
};

/**
 * Validate that a date string is not in the past
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date is valid (today or future)
 */
const isDateNotInPast = (dateString) => {
  return isDateValid(dateString);
};

/**
 * Convert a Date object to YYYY-MM-DD format in local timezone
 * This avoids timezone shifts that occur with toISOString()
 * @param {Date} date - Date object to convert
 * @returns {string} Date string in YYYY-MM-DD format
 */
const formatDateToLocal = (date) => {
  if (!date) return '';
  if (typeof date === 'string') return date; // Already a string, return as-is
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = {
  parseLocalDate,
  getTodayDate,
  isDateBefore,
  isDateValid,
  isDateNotInPast,
  formatDateToLocal
};

