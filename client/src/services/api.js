import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          if (res.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Refresh token expired or invalid');
        }
      }
      
      // If we couldn't refresh, clear local storage and redirect to login
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error.response?.data || { message: 'Network connection issue' });
  }
);

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('refreshToken', res.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
    }
    return res.data.data.user;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore failure to inform backend
    }
    localStorage.clear();
    window.location.href = '/login';
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data.data.user;
  }
};

export const userService = {
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await api.get(`/users?${params.toString()}`);
    return res.data;
  },
  getUser: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },
  createUser: async (data) => {
    const res = await api.post('/users', data);
    return res.data.data;
  },
  updateUser: async (id, data) => {
    const res = await api.patch(`/users/${id}`, data);
    return res.data.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
  getRoles: async () => {
    const res = await api.get('/users/roles');
    return res.data.data;
  }
};

export const buildingService = {
  getBuildings: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await api.get(`/buildings?${params.toString()}`);
    return res.data;
  },
  getBuilding: async (id) => {
    const res = await api.get(`/buildings/${id}`);
    return res.data.data;
  },
  createBuilding: async (data) => {
    const res = await api.post('/buildings', data);
    return res.data.data;
  },
  updateBuilding: async (id, data) => {
    const res = await api.patch(`/buildings/${id}`, data);
    return res.data.data;
  },
  deleteBuilding: async (id) => {
    const res = await api.delete(`/buildings/${id}`);
    return res.data;
  }
};

export const roomService = {
  getRooms: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await api.get(`/rooms?${params.toString()}`);
    return res.data;
  },
  getRoom: async (id) => {
    const res = await api.get(`/rooms/${id}`);
    return res.data.data;
  },
  createRoom: async (data) => {
    const res = await api.post('/rooms', data);
    return res.data.data;
  },
  updateRoom: async (id, data) => {
    const res = await api.patch(`/rooms/${id}`, data);
    return res.data.data;
  },
  deleteRoom: async (id) => {
    const res = await api.delete(`/rooms/${id}`);
    return res.data;
  }
};

export const checklistService = {
  getChecklists: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await api.get(`/checklists?${params.toString()}`);
    return res.data;
  },
  getChecklist: async (id) => {
    const res = await api.get(`/checklists/${id}`);
    return res.data.data;
  },
  createChecklist: async (data) => {
    const res = await api.post('/checklists', data);
    return res.data.data;
  },
  updateChecklist: async (id, data) => {
    const res = await api.patch(`/checklists/${id}`, data);
    return res.data.data;
  },
  deleteChecklist: async (id) => {
    const res = await api.delete(`/checklists/${id}`);
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get('/checklists/categories');
    return res.data.data;
  }
};

export const auditService = {
  getAssignments: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await api.get(`/audits/assignments?${params.toString()}`);
    return res.data;
  },
  getAssignment: async (id) => {
    const res = await api.get(`/audits/assignments/${id}`);
    return res.data.data;
  },
  createAssignment: async (data) => {
    const res = await api.post('/audits/assignments', data);
    return res.data.data;
  },
  startAudit: async (assignmentId) => {
    const res = await api.post('/audits/start', { assignmentId });
    return res.data.data;
  },
  getAudit: async (id) => {
    const res = await api.get(`/audits/${id}`);
    return res.data.data;
  },
  getAudits: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await api.get(`/audits?${params.toString()}`);
    return res.data;
  },
  verifyQR: async (auditId, qrToken) => {
    const res = await api.post('/qr/verify', { auditId, qrToken });
    return res.data.data;
  },
  verifyGPS: async (auditId, latitude, longitude, accuracy) => {
    const res = await api.post('/gps/verify', { auditId, latitude, longitude, accuracy });
    return res.data.data;
  },
  uploadImage: async (auditId, file, imageType) => {
    const formData = new FormData();
    formData.append('auditId', auditId);
    formData.append('imageType', imageType);
    formData.append('image', file);
    
    const res = await api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data.data;
  },
  deleteImage: async (auditId, imageUrl) => {
    const res = await api.post('/audits/images/delete', { auditId, imageUrl });
    return res.data.data;
  },
  runAIAnalysis: async (auditId) => {
    const res = await api.post('/ai/analyze', { auditId });
    return res.data.data;
  },
  submitAudit: async (auditId, checklistAnswers, verificationAnswers) => {
    const res = await api.post(`/audits/${auditId}/submit`, { checklistAnswers, verificationAnswers });
    return res.data.data;
  },
  updateAuditStatus: async (id, status, notes) => {
    const res = await api.patch(`/audits/${id}/status`, { status, notes });
    return res.data.data;
  }
};

export const analyticsService = {
  getDashboardStats: async () => {
    const res = await api.get('/analytics/dashboard');
    return res.data.data;
  },
  getTrends: async () => {
    const res = await api.get('/analytics/trends');
    return res.data.data;
  },
  getAuditorStats: async () => {
    const res = await api.get('/analytics/auditors');
    return res.data.data;
  }
};

export const reportService = {
  getReports: async () => {
    const res = await api.get('/reports');
    return res.data.data;
  },
  getReport: async (id) => {
    const res = await api.get(`/reports/${id}`);
    return res.data.data;
  }
};
export default api;
