const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Helper function to check if task is overdue
const isOverdue = (task) => {
  if (!task.deadline || task.status === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(task.deadline);
  deadline.setHours(0, 0, 0, 0);
  return deadline < today;
};

// GET personal analytics (for employees)
router.get('/personal', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all tasks assigned to this user
    const tasks = await Task.find({ assignedTo: userId });
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const assignedTasks = tasks.filter(t => t.status === 'assigned').length;
    const overdueTasks = tasks.filter(isOverdue).length;
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 
      ? (completedTasks / totalTasks * 100).toFixed(2) 
      : 0;
    
    // Calculate average completion time (in days)
    const completedTasksWithTime = tasks.filter(t => 
      t.status === 'completed' && t.completedAt && t.createdAt
    );
    
    let avgCompletionTime = 0;
    if (completedTasksWithTime.length > 0) {
      const totalDays = completedTasksWithTime.reduce((sum, task) => {
        const assignedAt = new Date(task.createdAt);
        const completedAt = new Date(task.completedAt);
        const diffTime = completedAt - assignedAt;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      avgCompletionTime = (totalDays / completedTasksWithTime.length).toFixed(2);
    }
    
    // Weekly performance (last 4 weeks)
    const weeklyData = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
      
      weeklyData.push({
        week: `Week ${4 - i}`,
        startDate: weekStart.toISOString().split('T')[0],
        total: weekTasks.length,
        completed: weekCompleted,
        completionRate: weekTasks.length > 0 
          ? ((weekCompleted / weekTasks.length) * 100).toFixed(2) 
          : 0
      });
    }
    
    // Monthly performance (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= monthStart && taskDate <= monthEnd;
      });
      
      const monthCompleted = monthTasks.filter(t => t.status === 'completed').length;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDate: monthStart.toISOString().split('T')[0],
        total: monthTasks.length,
        completed: monthCompleted,
        completionRate: monthTasks.length > 0 
          ? ((monthCompleted / monthTasks.length) * 100).toFixed(2) 
          : 0
      });
    }
    
    res.json({
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        assignedTasks,
        overdueTasks,
        completionRate: parseFloat(completionRate),
        avgCompletionTime: parseFloat(avgCompletionTime)
      },
      weeklyTrend: weeklyData,
      monthlyTrend: monthlyData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET company-wide analytics (admin only)
router.get('/company', requireAdmin, async (req, res) => {
  try {
    // Get all tasks
    const tasks = await Task.find()
      .populate('assignedTo', 'username firstName lastName email');
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const assignedTasks = tasks.filter(t => t.status === 'assigned').length;
    const overdueTasks = tasks.filter(isOverdue).length;
    
    // Calculate overall completion rate
    const completionRate = totalTasks > 0 
      ? (completedTasks / totalTasks * 100).toFixed(2) 
      : 0;
    
    // Calculate average completion time
    const completedTasksWithTime = tasks.filter(t => 
      t.status === 'completed' && t.completedAt && t.createdAt
    );
    
    let avgCompletionTime = 0;
    if (completedTasksWithTime.length > 0) {
      const totalDays = completedTasksWithTime.reduce((sum, task) => {
        const assignedAt = new Date(task.createdAt);
        const completedAt = new Date(task.completedAt);
        const diffTime = completedAt - assignedAt;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      avgCompletionTime = (totalDays / completedTasksWithTime.length).toFixed(2);
    }
    
    // Employee performance
    const users = await User.find({ role: 'employee' });
    const employeePerformance = users.map(user => {
      if (!user || !user._id) {
        return null; // Skip invalid users
      }
      
      const userIdStr = user._id.toString();
      const userTasks = tasks.filter(t => {
        if (!t || !t.assignedTo) return false;
        const assignedToId = t.assignedTo._id ? t.assignedTo._id.toString() : t.assignedTo.toString();
        return assignedToId === userIdStr;
      });
      const userCompleted = userTasks.filter(t => t.status === 'completed').length;
      const userOverdue = userTasks.filter(isOverdue).length;
      
      return {
        userId: userIdStr,
        username: user.username || 'Unknown',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        totalTasks: userTasks.length,
        completedTasks: userCompleted,
        overdueTasks: userOverdue,
        completionRate: userTasks.length > 0 
          ? ((userCompleted / userTasks.length) * 100).toFixed(2) 
          : 0
      };
    }).filter(emp => emp !== null); // Remove any null entries
    
    // Weekly performance (last 4 weeks)
    const weeklyData = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
      
      weeklyData.push({
        week: `Week ${4 - i}`,
        startDate: weekStart.toISOString().split('T')[0],
        total: weekTasks.length,
        completed: weekCompleted,
        completionRate: weekTasks.length > 0 
          ? ((weekCompleted / weekTasks.length) * 100).toFixed(2) 
          : 0
      });
    }
    
    // Monthly performance (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= monthStart && taskDate <= monthEnd;
      });
      
      const monthCompleted = monthTasks.filter(t => t.status === 'completed').length;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDate: monthStart.toISOString().split('T')[0],
        total: monthTasks.length,
        completed: monthCompleted,
        completionRate: monthTasks.length > 0 
          ? ((monthCompleted / monthTasks.length) * 100).toFixed(2) 
          : 0
      });
    }
    
    res.json({
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        assignedTasks,
        overdueTasks,
        completionRate: parseFloat(completionRate),
        avgCompletionTime: parseFloat(avgCompletionTime),
        totalEmployees: users.length
      },
      employeePerformance,
      weeklyTrend: weeklyData,
      monthlyTrend: monthlyData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET analytics for specific user (admin only)
router.get('/user/:userId', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get all tasks assigned to this user
    const tasks = await Task.find({ assignedTo: userId });
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const assignedTasks = tasks.filter(t => t.status === 'assigned').length;
    const overdueTasks = tasks.filter(isOverdue).length;
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 
      ? (completedTasks / totalTasks * 100).toFixed(2) 
      : 0;
    
    // Calculate average completion time
    const completedTasksWithTime = tasks.filter(t => 
      t.status === 'completed' && t.completedAt && t.createdAt
    );
    
    let avgCompletionTime = 0;
    if (completedTasksWithTime.length > 0) {
      const totalDays = completedTasksWithTime.reduce((sum, task) => {
        const assignedAt = new Date(task.createdAt);
        const completedAt = new Date(task.completedAt);
        const diffTime = completedAt - assignedAt;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      avgCompletionTime = (totalDays / completedTasksWithTime.length).toFixed(2);
    }
    
    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      },
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        assignedTasks,
        overdueTasks,
        completionRate: parseFloat(completionRate),
        avgCompletionTime: parseFloat(avgCompletionTime)
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

