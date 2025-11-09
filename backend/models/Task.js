const mongoose = require('mongoose');

// Helper to get day name from date
const getDayName = (dateString) => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
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
  completed: {
    type: Boolean,
    default: false
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
  this.updatedAt = Date.now();
  next();
});

// Auto-calculate day before updating
taskSchema.pre('findOneAndUpdate', function(next) {
  if (this._update.date) {
    this._update.day = getDayName(this._update.date);
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

