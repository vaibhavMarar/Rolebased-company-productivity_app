import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { showToast } from '../utils/toast';
import WeeklyCalendar from './WeeklyCalendar';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const EmployeeDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Filtering and sorting
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskSort, setTaskSort] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'tasks' || activeTab === 'calendar') {
        const tasksData = await api.getTasks();
        setTasks(tasksData || []);
      }
      if (activeTab === 'analytics') {
        const analyticsData = await api.getPersonalAnalytics();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      showToast(error.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (id, status) => {
    try {
      await api.updateTask(id, { status });
      showToast('Task status updated successfully', 'success');
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to update task', 'error');
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;
    
    // Filter by status
    if (taskFilter !== 'all') {
      filtered = filtered.filter(t => t.status === taskFilter);
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (taskSort) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          return a.status.localeCompare(b.status);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [tasks, taskFilter, taskSort, searchTerm]);

  const isOverdue = (task) => {
    if (!task.deadline || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  };

  if (showCalendar) {
    return <WeeklyCalendar onLogout={onLogout} user={user} onBackToDashboard={() => setShowCalendar(false)} />;
  }

  return (
    <div className="employee-dashboard" style={{ minHeight: '100vh', background: '#121212', color: '#e0e0e0' }}>
      <header style={{ 
        background: '#1E1E1E', 
        padding: '1rem 2rem', 
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          Employee Dashboard - {user?.firstName || user?.username || 'User'}
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setShowCalendar(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Calendar View
          </button>
          <button 
            onClick={onLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        <nav style={{ 
          width: '200px', 
          background: '#1E1E1E', 
          minHeight: 'calc(100vh - 80px)',
          padding: '1rem',
          borderRight: '1px solid #2a2a2a'
        }}>
          {['tasks', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: activeTab === tab ? '#667eea' : 'transparent',
                color: '#e0e0e0',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                textAlign: 'left'
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, padding: '2rem' }}>
          {activeTab === 'tasks' && (
            <div>
              <h2>My Tasks</h2>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  style={{ padding: '0.5rem', background: '#1E1E1E', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px' }}
                >
                  <option value="all">All Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={taskSort}
                  onChange={(e) => setTaskSort(e.target.value)}
                  style={{ padding: '0.5rem', background: '#1E1E1E', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px' }}
                >
                  <option value="date">Sort by Date</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="status">Sort by Status</option>
                  <option value="title">Sort by Title</option>
                </select>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    padding: '0.5rem', 
                    background: '#1E1E1E', 
                    color: '#e0e0e0', 
                    border: '1px solid #2a2a2a', 
                    borderRadius: '6px',
                    flex: 1,
                    minWidth: '200px'
                  }}
                />
              </div>

              {loading ? (
                <div>Loading...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#1E1E1E', borderBottom: '2px solid #2a2a2a' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Title</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Priority</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedTasks.map(task => {
                        const overdue = isOverdue(task);
                        return (
                          <tr key={task.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <strong>{task.title}</strong>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#999' }}>
                              {task.description || '-'}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <select
                                value={task.status}
                                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: task.status === 'completed' ? '#4caf50' : 
                                             task.status === 'in-progress' ? '#ff9800' : '#2196f3',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="assigned">Assigned</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                background: task.priority === 'high' ? '#f44336' :
                                           task.priority === 'medium' ? '#ff9800' : '#4caf50',
                                color: 'white',
                                fontSize: '0.85rem'
                              }}>
                                {task.priority}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>{task.date}</td>
                            <td style={{ padding: '0.75rem' }}>
                              {task.deadline ? (
                                <span style={{ color: overdue ? '#ff6b6b' : '#e0e0e0' }}>
                                  {task.deadline} {overdue && '⚠️'}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredAndSortedTasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                      No tasks found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2>My Productivity Analytics</h2>
              {loading ? (
                <div>Loading analytics...</div>
              ) : analytics ? (
                <div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem',
                    marginBottom: '2rem'
                  }}>
                    <div style={{ background: '#1E1E1E', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                      <div style={{ fontSize: '0.9rem', color: '#999', marginBottom: '0.5rem' }}>Total Tasks</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.summary.totalTasks}</div>
                    </div>
                    <div style={{ background: '#1E1E1E', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                      <div style={{ fontSize: '0.9rem', color: '#999', marginBottom: '0.5rem' }}>Completed</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>{analytics.summary.completedTasks}</div>
                    </div>
                    <div style={{ background: '#1E1E1E', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                      <div style={{ fontSize: '0.9rem', color: '#999', marginBottom: '0.5rem' }}>In Progress</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>{analytics.summary.inProgressTasks}</div>
                    </div>
                    <div style={{ background: '#1E1E1E', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                      <div style={{ fontSize: '0.9rem', color: '#999', marginBottom: '0.5rem' }}>Completion Rate</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>{analytics.summary.completionRate}%</div>
                    </div>
                    <div style={{ background: '#1E1E1E', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                      <div style={{ fontSize: '0.9rem', color: '#999', marginBottom: '0.5rem' }}>Overdue</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b' }}>{analytics.summary.overdueTasks}</div>
                    </div>
                    <div style={{ background: '#1E1E1E', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                      <div style={{ fontSize: '0.9rem', color: '#999', marginBottom: '0.5rem' }}>Avg. Completion</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.summary.avgCompletionTime} days</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h3>Weekly Performance Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis dataKey="week" stroke="#999" />
                        <YAxis stroke="#999" />
                        <Tooltip contentStyle={{ background: '#1E1E1E', border: '1px solid #2a2a2a' }} />
                        <Legend />
                        <Line type="monotone" dataKey="total" stroke="#667eea" name="Total Tasks" />
                        <Line type="monotone" dataKey="completed" stroke="#4caf50" name="Completed" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h3>Monthly Performance Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis dataKey="month" stroke="#999" />
                        <YAxis stroke="#999" />
                        <Tooltip contentStyle={{ background: '#1E1E1E', border: '1px solid #2a2a2a' }} />
                        <Legend />
                        <Bar dataKey="total" fill="#667eea" name="Total Tasks" />
                        <Bar dataKey="completed" fill="#4caf50" name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div>No analytics data available</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

