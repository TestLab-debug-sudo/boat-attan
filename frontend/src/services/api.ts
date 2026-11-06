import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests and add Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('peachwave_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('peachwave_token');
      localStorage.removeItem('peachwave_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authService = {
  login: (data: { identifier: string; password: string }) => api.post('/auth/login', data),
  demoLogin: (role: string) => api.post(`/auth/demo-login?role=${role}`),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: any) => api.post('/auth/change-password', data)
};

export const employeeService = {
  getAll: (params?: any) => api.get('/employees', { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  approve: (id: string, status: 'APPROVED' | 'REJECTED', remarks?: string) =>
    api.patch(`/employees/${id}/approve`, { status, remarks }),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  toggleStatus: (id: string, status: string) => api.patch(`/employees/${id}/status`, { status })
};

export const attendanceService = {
  getTodayLive: (params?: any) => api.get('/attendance/today', { params }),
  checkIn: (data: any) => api.post('/attendance/check-in', data),
  checkOut: (data: any) => api.post('/attendance/check-out', data),
  approvePunch: (id: string, status: 'APPROVED' | 'REJECTED', managerRemarks?: string) =>
    api.patch(`/attendance/${id}/approve`, { status, managerRemarks }),
  bulkApprove: (date?: string) => api.post('/attendance/approve-all-pending', { date }),
  manualCorrect: (data: any) => api.post('/attendance/manual-correct', data),
  getMonthlyCalendar: (params: any) => api.get('/attendance/monthly-calendar', { params })
};

export const leaveService = {
  getAll: (params?: any) => api.get('/leaves', { params }),
  apply: (data: any) => api.post('/leaves/apply', data),
  updateStatus: (id: string, status: string, remarks?: string) =>
    api.patch(`/leaves/${id}/status`, { status, remarks })
};

export const historicalService = {
  query: (params: any) => api.get('/historical', { params })
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats')
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`)
};

export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data: any) => api.put('/settings', data),
  getAuditLogs: (params?: any) => api.get('/settings/audit-logs', { params })
};

