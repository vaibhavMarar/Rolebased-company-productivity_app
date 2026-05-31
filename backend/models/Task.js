const mongoose = require('mongoose');

// Helper to get day name from date
// Fix: Parse date string directly to avoid timezone issues
// When using new Date('YYYY-MM-DD'), it's interpreted as UTC midnight,
// which can shift to the previous day in local timezones
const getDayName = (dateString) => {
  // Parse YYYY-MM-DD format directly without timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    validate: {
      validator: function(value) {
        // Validate date format YYYY-MM-DD
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      },
      message: 'Date must be in YYYY-MM-DD format'
    }
  },
  day: {
    type: String,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  time: {
    type: String,
    default: '09:00',
    validate: {
      validator: function(value) {
        // Validate time format HH:MM
        return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'Time must be in HH:MM format'
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed'],
    default: 'assigned'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  deadline: {
    type: String,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      },
      message: 'Deadline must be in YYYY-MM-DD format'
    }
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-calculate day from date before saving
taskSchema.pre('save', function(next) {
  if (this.isModified('date') || this.isNew) {
    this.day = getDayName(this.date);
  }
  
  // Auto-update completed status and completedAt
  if (this.status === 'completed' && !this.completed) {
    this.completed = true;
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.status !== 'completed' && this.completed) {
    this.completed = false;
    this.completedAt = null;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Auto-calculate day before updating
taskSchema.pre('findOneAndUpdate', function(next) {
  if (this._update.date) {
    this._update.day = getDayName(this._update.date);
  }
  
  // Auto-update completed status and completedAt
  if (this._update.status === 'completed') {
    this._update.completed = true;
    if (!this._update.completedAt) {
      this._update.completedAt = new Date();
    }
  } else if (this._update.status && this._update.status !== 'completed') {
    this._update.completed = false;
    if (!this._update.$set || !this._update.$set.completedAt) {
      this._update.completedAt = null;
    }
  }
  
  this._update.updatedAt = Date.now();
  next();
});

// Convert _id to id and remove _id and __v from JSON output
taskSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Task', taskSchema);

