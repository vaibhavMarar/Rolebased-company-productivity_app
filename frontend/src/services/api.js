const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// Token storage keys
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get user from localStorage
const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Set token and user in localStorage
const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

// Clear auth data from localStorage
const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Also clear old localStorage data if it exists
  localStorage.removeItem('weekly_tasks');
  localStorage.removeItem('weekly_meetings');
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!getToken();
};

// Handle authentication errors
const handleAuthError = (errorCode) => {
  if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN' || errorCode === 'NO_TOKEN') {
    clearAuth();
    // Trigger logout event
    window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: errorCode } }));
    return true;
  }
  return false;
};

// Get auth headers
const getAuthHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Handle API response
const handleResponse = async (response) => {
  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      text: text.substring(0, 200)
    });
    throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
  }

  const data = await response.json();
  
  // Handle authentication errors (401, 403)
  if (response.status === 401 || response.status === 403) {
    const errorCode = data.code || 'AUTH_ERROR';
    if (handleAuthError(errorCode)) {
      throw new Error(data.error || 'Authentication failed. Please login again.');
    }
  }
  
  // Handle other errors
  if (!response.ok) {
    console.error('API error:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      error: data.error,
      code: data.code
    });
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

export const api = {
  // Authentication methods
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await handleResponse(response);
    
    // Store token and user info
    if (data.token) {
      setAuth(data.token, data.user);
    }
    
    return data;
  },

  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await handleResponse(response);
    
    // Store token and user info
    if (data.token) {
      setAuth(data.token, data.user);
    }
    
    return data;
  },

  logout: async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  },

  verifyToken: async () => {
    const token = getToken();
    if (!token) {
      return { valid: false, error: 'No token found' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      // Handle 404 specifically (route not found - server might need restart)
      if (response.status === 404) {
        console.warn('Verify token endpoint not found (404). Server may need to be restarted.');
        // For 404, assume token might be valid but endpoint unavailable
        // Return valid: true to prevent unnecessary logout
        // User will need to restart server for full functionality
        return { valid: true, warning: 'Verification endpoint not available' };
      }

      // Handle other non-OK responses
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          // If it's an auth error (401), token is invalid
          if (response.status === 401 || response.status === 403) {
            clearAuth();
            return { valid: false, error: data.error || 'Token is invalid' };
          }
          return { valid: false, error: data.error || 'Verification failed' };
        }
        return { valid: false, error: `HTTP error! status: ${response.status}` };
      }

      // Response is OK, parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { valid: false, error: 'Invalid response format' };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Network error or other exception
      console.error('Token verification error:', error);
      // Don't clear auth on network errors - might be temporary
      return { valid: false, error: error.message || 'Network error' };
    }
  },

  // Utility methods
  getToken,
  getUser,
  isAuthenticated,
  clearAuth,

  getTasks: async () => {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  getMeetings: async () => {
    const response = await fetch(`${API_BASE_URL}/api/meetings`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  toggleTask: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  toggleMeeting: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  createTask: async (taskData) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });

    return handleResponse(response);
  },

  createMeeting: async (meetingData) => {
    const response = await fetch(`${API_BASE_URL}/api/meetings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(meetingData),
    });

    return handleResponse(response);
  },

  updateTask: async (id, taskData) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });

    return handleResponse(response);
  },

  updateMeeting: async (id, meetingData) => {
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(meetingData),
    });

    return handleResponse(response);
  },

  deleteTask: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  deleteMeeting: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // User management (admin only)
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  getUser: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    return handleResponse(response);
  },

  updateUser: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    return handleResponse(response);
  },

  deleteUser: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Analytics
  getPersonalAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/api/analytics/personal`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  getCompanyAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/api/analytics/company`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  getUserAnalytics: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/api/analytics/user/${userId}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },
};

