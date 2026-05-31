import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { showToast } from '../utils/toast';
import WeeklyCalendar from './WeeklyCalendar';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Task management state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '09:00',
    assignedTo: '',
    assignedToAll: false,
    additionalUsers: [],
    priority: 'medium',
    deadline: ''
  });
  
  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'employee',
    permissions: {
      canUpdateTasks: false,
      canDeleteTasks: false
    }
  });
  
  // Filtering and sorting
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskSort, setTaskSort] = useState('date');
  const [userFilter, setUserFilter] = useState('all');
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
        // Also fetch users for the task form dropdown
        if (users.length === 0) {
          try {
            const usersData = await api.getUsers();
            setUsers(usersData || []);
          } catch (error) {
            // Silently fail - users might not be needed if not editing
            console.warn('Failed to load users:', error);
          }
        }
      }
      if (activeTab === 'users') {
        const usersData = await api.getUsers();
        setUsers(usersData || []);
      }
      if (activeTab === 'analytics') {
        const analyticsData = await api.getCompanyAnalytics();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      showToast(error.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      if (!taskForm.title || !taskForm.date) {
        showToast('Title and date are required', 'error');
        return;
      }
      
      if (!taskForm.assignedToAll && !taskForm.assignedTo && (!taskForm.additionalUsers || taskForm.additionalUsers.length === 0)) {
        showToast('Please select at least one user or "All Users"', 'error');
        return;
      }
      
      const taskData = {
        ...taskForm,
        additionalUsers: taskForm.additionalUsers || []
      };
      
      await api.createTask(taskData);
      showToast('Task created successfully', 'success');
      setShowTaskModal(false);
      resetTaskForm();
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      await api.updateTask(id, updates);
      showToast('Task updated successfully', 'success');
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.deleteTask(id);
      showToast('Task deleted successfully', 'success');
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to delete task', 'error');
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!userForm.username || !userForm.email || !userForm.password) {
        showToast('Username, email, and password are required', 'error');
        return;
      }
      
      await api.createUser(userForm);
      showToast('User created successfully', 'success');
      setShowUserModal(false);
      resetUserForm();
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async (id, updates) => {
    try {
      await api.updateUser(id, updates);
      showToast('User updated successfully', 'success');
      setShowUserModal(false);
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.deleteUser(id);
      showToast('User deleted successfully', 'success');
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to delete user', 'error');
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      date: '',
      time: '09:00',
      assignedTo: '',
      assignedToAll: false,
      additionalUsers: [],
      priority: 'medium',
      deadline: ''
    });
    setSelectedTask(null);
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'employee',
      permissions: {
        canUpdateTasks: false,
        canDeleteTasks: false
      }
    });
    setSelectedUser(null);
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

  // Filter users
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (userFilter !== 'all') {
      filtered = filtered.filter(u => u.role === userFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  }, [users, userFilter, searchTerm]);

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
    <div className="admin-dashboard" style={{ minHeight: '100vh', background: '#121212', color: '#e0e0e0' }}>
      <header style={{ 
        background: '#1E1E1E', 
        padding: '1rem 2rem', 
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Admin Dashboard</h1>
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
          {['tasks', 'users', 'analytics'].map(tab => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <h2>Task Management</h2>
                <button
                  onClick={() => {
                    resetTaskForm();
                    setShowTaskModal(true);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  + Create Task
                </button>
              </div>

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
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Assigned To</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Priority</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Deadline</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedTasks.map(task => {
                        const assignedUser = task.assignedTo?.username || task.assignedTo || 'Unknown';
                        const overdue = isOverdue(task);
                        return (
                          <tr key={task.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div>
                                <strong>{task.title}</strong>
                                {task.description && (
                                  <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>
                                    {task.description.substring(0, 50)}...
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>{assignedUser}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <select
                                value={task.status}
                                onChange={(e) => handleUpdateTask(task.id, { status: e.target.value })}
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
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={async () => {
                                    setSelectedTask(task);
                                    
                                    // Ensure users are loaded for the dropdown - always load all users for Update Task
                                    let usersList = users;
                                    if (users.length === 0) {
                                      try {
                                        const usersData = await api.getUsers();
                                        usersList = usersData || [];
                                        setUsers(usersList);
                                      } catch (error) {
                                        console.warn('Failed to load users:', error);
                                        usersList = [];
                                      }
                                    }
                                    
                                    // Detect if this task was originally "assigned to all"
                                    // Find all tasks with the same title, date, time, priority, and deadline
                                    const relatedTasks = tasks.filter(t => 
                                      t.title === task.title &&
                                      t.date === task.date &&
                                      t.time === task.time &&
                                      t.priority === task.priority &&
                                      (t.deadline || '') === (task.deadline || '')
                                    );
                                    
                                    // Extract all assigned user IDs from related tasks
                                    const assignedUserIds = new Set();
                                    relatedTasks.forEach(t => {
                                      if (t.assignedTo) {
                                        let userId = '';
                                        if (typeof t.assignedTo === 'object') {
                                          userId = t.assignedTo.id || t.assignedTo._id || '';
                                          if (userId && typeof userId === 'object') {
                                            userId = userId.toString();
                                          }
                                        } else {
                                          userId = t.assignedTo;
                                        }
                                        if (userId) {
                                          assignedUserIds.add(userId);
                                        }
                                      }
                                    });
                                    
                                    // Get all employee user IDs
                                    const allEmployeeIds = new Set(
                                      usersList
                                        .filter(u => u.role === 'employee')
                                        .map(u => u.id)
                                    );
                                    
                                    // Check if assigned users match all employees (indicating "assigned to all")
                                    const isAssignedToAll = 
                                      allEmployeeIds.size > 0 &&
                                      assignedUserIds.size === allEmployeeIds.size &&
                                      Array.from(allEmployeeIds).every(id => assignedUserIds.has(id));
                                    
                                    // Extract user ID for the current task
                                    let assignedToId = '';
                                    if (task.assignedTo) {
                                      if (typeof task.assignedTo === 'object') {
                                        // Handle populated user object - check both id and _id
                                        assignedToId = task.assignedTo.id || task.assignedTo._id || '';
                                        // If _id is an object, convert to string
                                        if (assignedToId && typeof assignedToId === 'object') {
                                          assignedToId = assignedToId.toString();
                                        }
                                      } else {
                                        // Handle string ID
                                        assignedToId = task.assignedTo;
                                      }
                                    }
                                    
                                    // If assigned to all, get additional users (non-employees or specific selections)
                                    // For now, we'll set additionalUsers to empty and let the user manage it
                                    // The additionalUsers would be any non-employee users or specific overrides
                                    const additionalUsersList = [];
                                    
                                    setTaskForm({
                                      title: task.title || '',
                                      description: task.description || '',
                                      date: task.date || '',
                                      time: task.time || '09:00',
                                      assignedTo: isAssignedToAll ? '' : assignedToId,
                                      assignedToAll: isAssignedToAll,
                                      additionalUsers: additionalUsersList,
                                      priority: task.priority || 'medium',
                                      deadline: task.deadline || ''
                                    });
                                    setShowTaskModal(true);
                                  }}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    background: '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    background: '#ff6b6b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
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

          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <h2>User Management</h2>
                <button
                  onClick={() => {
                    resetUserForm();
                    setShowUserModal(true);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  + Create User
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  style={{ padding: '0.5rem', background: '#1E1E1E', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px' }}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
                <input
                  type="text"
                  placeholder="Search users..."
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
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Username</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Role</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(userItem => (
                        <tr key={userItem.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                          <td style={{ padding: '0.75rem' }}>{userItem.username}</td>
                          <td style={{ padding: '0.75rem' }}>{userItem.email}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {userItem.firstName || userItem.lastName 
                              ? `${userItem.firstName || ''} ${userItem.lastName || ''}`.trim()
                              : '-'}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              background: userItem.role === 'admin' ? '#667eea' : '#4caf50',
                              color: 'white',
                              fontSize: '0.85rem'
                            }}>
                              {userItem.role}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {userItem.createdAt 
                              ? new Date(userItem.createdAt).toLocaleDateString()
                              : '-'}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              onClick={() => {
                                setSelectedUser(userItem);
                                setUserForm({
                                  username: userItem.username,
                                  email: userItem.email,
                                  password: '',
                                  firstName: userItem.firstName || '',
                                  lastName: userItem.lastName || '',
                                  role: userItem.role,
                                  permissions: {
                                    canUpdateTasks: userItem.permissions?.canUpdateTasks || false,
                                    canDeleteTasks: userItem.permissions?.canDeleteTasks || false
                                  }
                                });
                                setShowUserModal(true);
                              }}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                marginRight: '0.5rem'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userItem.id)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#ff6b6b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2>Company Analytics</h2>
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

                  <div>
                    <h3>Employee Performance</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#1E1E1E', borderBottom: '2px solid #2a2a2a' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Employee</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Total Tasks</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Completed</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Overdue</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Completion Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.employeePerformance && analytics.employeePerformance.map(emp => {
                            const userId = emp.userId || emp.id || `user-${Math.random()}`;
                            return (
                            <tr key={userId} style={{ borderBottom: '1px solid #2a2a2a' }}>
                              <td style={{ padding: '0.75rem' }}>
                                {emp.firstName || emp.lastName 
                                  ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
                                  : emp.username || 'Unknown User'}
                              </td>
                              <td style={{ padding: '0.75rem' }}>{emp.totalTasks || 0}</td>
                              <td style={{ padding: '0.75rem', color: '#4caf50' }}>{emp.completedTasks || 0}</td>
                              <td style={{ padding: '0.75rem', color: '#ff6b6b' }}>{emp.overdueTasks || 0}</td>
                              <td style={{ padding: '0.75rem' }}>{emp.completionRate || 0}%</td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div>No analytics data available</div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1E1E1E',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            border: '1px solid #2a2a2a',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{selectedTask ? 'Edit Task' : 'Create Task'}</h3>
            <div style={{ 
              maxHeight: '80vh', 
              overflowY: 'auto', 
              paddingRight: '0.5rem',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem' 
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  placeholder="Enter task description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%', resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={taskForm.date}
                  onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Time
                </label>
                <input
                  type="time"
                  value={taskForm.time}
                  onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                />
              </div>
              {!selectedTask && (
                <>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e0e0e0', fontWeight: '500', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={taskForm.assignedToAll}
                        onChange={(e) => setTaskForm({ ...taskForm, assignedToAll: e.target.checked, assignedTo: e.target.checked ? '' : taskForm.assignedTo })}
                        style={{ cursor: 'pointer' }}
                      />
                      Assign to All Users
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                      {taskForm.assignedToAll ? 'Additional Specific Users (Optional)' : 'Select User *'}
                    </label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                      disabled={taskForm.assignedToAll}
                      size={users.length > 8 ? 8 : 1}
                      style={{ 
                        padding: '0.75rem', 
                        background: taskForm.assignedToAll ? '#2a2a2a' : '#121212', 
                        color: '#e0e0e0', 
                        border: '1px solid #2a2a2a', 
                        borderRadius: '6px', 
                        width: '100%', 
                        cursor: taskForm.assignedToAll ? 'not-allowed' : 'pointer',
                        maxHeight: '250px',
                        overflowY: 'auto'
                      }}
                    >
                      <option value="">{taskForm.assignedToAll ? 'All users selected' : 'Select User'}</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  {taskForm.assignedToAll && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                        Additional Specific Users (Optional)
                      </label>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '0.5rem', background: '#121212' }}>
                        {users.filter(u => u.role === 'employee').map(u => (
                          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: '#e0e0e0', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={taskForm.additionalUsers.includes(u.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTaskForm({ ...taskForm, additionalUsers: [...taskForm.additionalUsers, u.id] });
                                } else {
                                  setTaskForm({ ...taskForm, additionalUsers: taskForm.additionalUsers.filter(id => id !== u.id) });
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            {u.username} ({u.role})
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedTask && (
                <>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e0e0e0', fontWeight: '500', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={taskForm.assignedToAll}
                        onChange={(e) => setTaskForm({ ...taskForm, assignedToAll: e.target.checked, assignedTo: e.target.checked ? '' : taskForm.assignedTo })}
                        style={{ cursor: 'pointer' }}
                      />
                      Assign to All Users
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                      {taskForm.assignedToAll ? 'Additional Specific Users (Optional)' : 'Select User *'}
                    </label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                      disabled={taskForm.assignedToAll}
                      size={users.length > 8 ? 8 : 1}
                      style={{ 
                        padding: '0.75rem', 
                        background: taskForm.assignedToAll ? '#2a2a2a' : '#121212', 
                        color: '#e0e0e0', 
                        border: '1px solid #2a2a2a', 
                        borderRadius: '6px', 
                        width: '100%', 
                        cursor: taskForm.assignedToAll ? 'not-allowed' : 'pointer',
                        maxHeight: '250px',
                        overflowY: 'auto'
                      }}
                    >
                      <option value="">{taskForm.assignedToAll ? 'All users selected' : 'Select User'}</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  {taskForm.assignedToAll && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                        Additional Specific Users (Optional)
                      </label>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '0.5rem', background: '#121212' }}>
                        {users.filter(u => u.role === 'employee').map(u => (
                          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: '#e0e0e0', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={taskForm.additionalUsers.includes(u.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTaskForm({ ...taskForm, additionalUsers: [...taskForm.additionalUsers, u.id] });
                                } else {
                                  setTaskForm({ ...taskForm, additionalUsers: taskForm.additionalUsers.filter(id => id !== u.id) });
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            {u.username} ({u.role})
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Priority
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Deadline
                </label>
                <input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    resetTaskForm();
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#2a2a2a',
                    color: '#e0e0e0',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (selectedTask) {
                      // Update existing task
                      if (!taskForm.title || !taskForm.date) {
                        showToast('Title and date are required', 'error');
                        return;
                      }
                      
                      if (!taskForm.assignedToAll && !taskForm.assignedTo && (!taskForm.additionalUsers || taskForm.additionalUsers.length === 0)) {
                        showToast('Please select at least one user or "All Users"', 'error');
                        return;
                      }
                      
                      try {
                        // If assignedToAll is checked, find and update all related tasks
                        if (taskForm.assignedToAll) {
                          // Find all tasks with the same title, date, time, priority, and deadline
                          const relatedTasks = tasks.filter(t => 
                            t.title === selectedTask.title &&
                            t.date === selectedTask.date &&
                            t.time === selectedTask.time &&
                            t.priority === selectedTask.priority &&
                            (t.deadline || '') === (selectedTask.deadline || '')
                          );
                          
                          // Update all related tasks with the new data
                          const updatePromises = relatedTasks.map(relatedTask => 
                            handleUpdateTask(relatedTask.id, {
                              title: taskForm.title,
                              description: taskForm.description,
                              date: taskForm.date,
                              time: taskForm.time,
                              priority: taskForm.priority,
                              deadline: taskForm.deadline
                              // Keep the existing assignedTo for each task
                            })
                          );
                          
                          await Promise.all(updatePromises);
                          
                          // If additional users are specified, create tasks for them
                          if (taskForm.additionalUsers && taskForm.additionalUsers.length > 0) {
                            const existingUserIds = new Set(
                              relatedTasks.map(t => {
                                if (t.assignedTo) {
                                  if (typeof t.assignedTo === 'object') {
                                    return t.assignedTo.id || t.assignedTo._id || '';
                                  }
                                  return t.assignedTo;
                                }
                                return '';
                              }).filter(id => id)
                            );
                            
                            // Create tasks for additional users that don't already have this task
                            for (const userId of taskForm.additionalUsers) {
                              if (!existingUserIds.has(userId)) {
                                await api.createTask({
                                  title: taskForm.title,
                                  description: taskForm.description,
                                  date: taskForm.date,
                                  time: taskForm.time,
                                  assignedTo: userId,
                                  priority: taskForm.priority,
                                  deadline: taskForm.deadline
                                });
                              }
                            }
                          }
                        } else {
                          // Update single task
                          await handleUpdateTask(selectedTask.id, {
                            title: taskForm.title,
                            description: taskForm.description,
                            date: taskForm.date,
                            time: taskForm.time,
                            assignedTo: taskForm.assignedTo,
                            priority: taskForm.priority,
                            deadline: taskForm.deadline
                          });
                        }
                        
                        setShowTaskModal(false);
                        resetTaskForm();
                        fetchData();
                      } catch (error) {
                        showToast(error.message || 'Failed to update task', 'error');
                      }
                    } else {
                      // Create new task
                      await handleCreateTask();
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {selectedTask ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1E1E1E',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            border: '1px solid #2a2a2a'
          }}>
            <h3 style={{ marginTop: 0 }}>{selectedUser ? 'Edit User' : 'Create User'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Username *
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  disabled={!!selectedUser}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  {selectedUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  placeholder={selectedUser ? "Enter new password" : "Enter password"}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={userForm.firstName}
                  onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={userForm.lastName}
                  onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                  Role
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  style={{ padding: '0.75rem', background: '#121212', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px', width: '100%' }}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {userForm.role === 'employee' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0e0e0', fontWeight: '500' }}>
                    Task Permissions
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e0e0e0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={userForm.permissions?.canUpdateTasks || false}
                        onChange={(e) => setUserForm({
                          ...userForm,
                          permissions: {
                            ...userForm.permissions,
                            canUpdateTasks: e.target.checked
                          }
                        })}
                        style={{ cursor: 'pointer' }}
                      />
                      Can Update Tasks (without changing status)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e0e0e0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={userForm.permissions?.canDeleteTasks || false}
                        onChange={(e) => setUserForm({
                          ...userForm,
                          permissions: {
                            ...userForm.permissions,
                            canDeleteTasks: e.target.checked
                          }
                        })}
                        style={{ cursor: 'pointer' }}
                      />
                      Can Delete Tasks
                    </label>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#2a2a2a',
                    color: '#e0e0e0',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedUser 
                    ? handleUpdateUser(selectedUser.id, userForm)
                    : handleCreateUser()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {selectedUser ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

