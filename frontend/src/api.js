import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const complaints = {
  create: (data) => api.post('/complaints/', data),
  createEmergency: (data) => api.post('/complaints/emergency', data),
  getAll: () => api.get('/complaints/'),
  getOne: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status }),
  getByLocation: (data) => api.post('/complaints/by-location', data),
  upvote: (id) => api.post(`/complaints/${id}/upvote`),
  removeUpvote: (id) => api.post(`/complaints/${id}/remove-upvote`),
  rateWorker: (id, rating, feedback) => api.post(`/complaints/${id}/rate`, { rating, feedback }),
};

export const admin = {
  getAllComplaints: (params) => api.get('/admin/complaints', { params }),
  getEmergencyComplaints: (params) => api.get('/admin/complaints/emergency', { params }),
  resolveEmergency: (id, data) => api.post(`/admin/complaints/${id}/resolve-emergency`, data),
  validate: (id, data) => api.post(`/admin/complaints/${id}/validate`, data),
  assign: (id, data) => api.post(`/admin/complaints/${id}/assign`, data),
  verify: (id, data) => api.post(`/admin/complaints/${id}/verify`, data),
  getWorkers: () => api.get('/admin/workers'),
  getStats: () => api.get('/admin/stats'),
  getDashboard: () => api.get('/admin/dashboard'),
  getWorkerPerformance: () => api.get('/admin/workers/performance'),
  getWorkerDetails: (id) => api.get(`/admin/workers/${id}/details`),
  checkUnassignedEscalations: () => api.post('/admin/complaints/check-unassigned'),
};

export const worker = {
  getTasks: () => api.get('/worker/tasks'),
  updateTask: (id, data) => api.patch(`/worker/tasks/${id}/update`, data),
  completeTask: (id, data) => api.post(`/worker/tasks/${id}/complete`, data),
  uploadProgressPhoto: (id, photo) => api.post(`/worker/tasks/${id}/upload-progress-photo`, { photo }),
  uploadCompletionPhoto: (id, photo) => api.post(`/worker/tasks/${id}/upload-completion-photo`, { photo }),
  getProfile: () => api.get('/worker/profile'),
};

export default api;
