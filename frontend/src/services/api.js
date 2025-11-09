const API_BASE_URL = 'http://localhost:3000';

const getToken = () => {
  return localStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (response) => {
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
  
  if (!response.ok) {
    console.error('API error:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      error: data.error
    });
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

export const api = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    return handleResponse(response);
  },

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
};

