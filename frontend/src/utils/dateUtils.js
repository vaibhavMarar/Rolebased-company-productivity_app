/**
 * Date utility functions for handling dates without timezone issues
 * All dates are stored and compared as YYYY-MM-DD strings in local timezone
 */

/**
 * Convert a Date object to YYYY-MM-DD format in local timezone
 * This avoids timezone shifts that occur with toISOString()
 * @param {Date} date - Date object to convert
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateToLocal = (date) => {
  if (!date) return '';
  if (typeof date === 'string') return date; // Already a string, return as-is
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date as YYYY-MM-DD in local timezone
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayDate = () => {
  return formatDateToLocal(new Date());
};

/**
 * Parse a YYYY-MM-DD date string to a Date object in local timezone
 * This avoids timezone conversion issues when using new Date('YYYY-MM-DD')
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in local timezone
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString !== 'string') return dateString; // Already a Date object
  
  // Parse YYYY-MM-DD format directly without timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

/**
 * Compare two date strings (YYYY-MM-DD) to check if date1 is before date2
 * @param {string} date1 - First date string (YYYY-MM-DD)
 * @param {string} date2 - Second date string (YYYY-MM-DD)
 * @returns {boolean} True if date1 is before date2
 */
export const isDateBefore = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1 < date2;
};

/**
 * Check if a date string is today or in the future
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date is today or in the future
 */
export const isDateValid = (dateString) => {
  if (!dateString) return false;
  const today = getTodayDate();
  return dateString >= today;
};

