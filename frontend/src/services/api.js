import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE}/api/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const register = (data) => api.post('/api/auth/register/', data);
export const login = (data) => api.post('/api/auth/login/', data);
export const getMe = () => api.get('/api/auth/me/');
export const updateMe = (data) => api.patch('/api/auth/me/', data);

// Dashboard
export const getDashboard = () => api.get('/api/dashboard/');

// Resumes
export const getResumes = () => api.get('/api/resumes/');
export const uploadResume = (formData) => api.post('/api/resumes/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getResume = (id) => api.get(`/api/resumes/${id}/`);
export const deleteResume = (id) => api.delete(`/api/resumes/${id}/`);
export const bulkUploadResumes = (formData) => api.post('/api/resumes/bulk/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const bulkDeleteResumes = () => api.delete('/api/resumes/bulk-delete/');

// JDs
export const getJDs = () => api.get('/api/jds/');
export const createJD = (formData) => api.post('/api/jds/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getJD = (id) => api.get(`/api/jds/${id}/`);
export const deleteJD = (id) => api.delete(`/api/jds/${id}/`);
export const bulkDeleteJDs = () => api.delete('/api/jds/bulk-delete/');

// Analysis
export const analyzeSkillGap = (data) => api.post('/api/analyze/skill-gap/', data);
export const getSkillGapHistory = () => api.get('/api/analyze/skill-gap/');
export const getCourseRecommendations = (data) => api.post('/api/analyze/courses/', data);
export const getBestFitCandidates = (data) => api.post('/api/analyze/best-fit/', data);
export const getInterviewQuestions = (data) => api.post('/api/analyze/interview-questions/', data);

// Chat
export const getChatSessions = () => api.get('/api/chat/sessions/');
export const createChatSession = (data) => api.post('/api/chat/sessions/', data);
export const getChatSession = (id) => api.get(`/api/chat/sessions/${id}/`);
export const deleteChatSession = (id) => api.delete(`/api/chat/sessions/${id}/`);
export const sendChatMessage = (sessionId, data) => api.post(`/api/chat/sessions/${sessionId}/messages/`, data);

export default api;
