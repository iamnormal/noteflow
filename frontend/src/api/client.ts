// src/api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('noteflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('noteflow_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data: any) => api.patch('/auth/me', data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
};

// Notes
export const notesApi = {
  list: (params?: any) => api.get('/notes', { params }),
  get: (id: string) => api.get(`/notes/${id}`),
  create: (data: any) => api.post('/notes', data),
  update: (id: string, data: any) => api.patch(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
  restore: (id: string) => api.post(`/notes/${id}/restore`),
  permanentDelete: (id: string) => api.delete(`/notes/${id}/permanent`),
  versions: (id: string) => api.get(`/notes/${id}/versions`),
  getVersion: (id: string, vid: string) => api.get(`/notes/${id}/versions/${vid}`),
};

// Notebooks
export const notebooksApi = {
  list: () => api.get('/notebooks'),
  create: (data: any) => api.post('/notebooks', data),
  update: (id: string, data: any) => api.patch(`/notebooks/${id}`, data),
  delete: (id: string) => api.delete(`/notebooks/${id}`),
};

// Tags
export const tagsApi = {
  list: () => api.get('/tags'),
  create: (data: any) => api.post('/tags', data),
  update: (id: string, data: any) => api.patch(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

// Tasks
export const tasksApi = {
  list: (params?: any) => api.get('/tasks', { params }),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  bulkUpdate: (data: any) => api.patch('/tasks/bulk', data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// AI
export const aiApi = {
  edit: (data: any) => api.post('/ai/edit', data),
  summarize: (note_id: string) => api.post('/ai/summarize', { note_id }),
  chat: (data: any) => api.post('/ai/chat', data),
  suggestTags: (note_id: string) => api.post('/ai/suggest-tags', { note_id }),
};

// Templates
export const templatesApi = {
  list: (params?: any) => api.get('/templates', { params }),
  create: (data: any) => api.post('/templates', data),
  update: (id: string, data: any) => api.patch(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
};

// Attachments
export const attachmentsApi = {
  upload: (formData: FormData) => api.post('/attachments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => api.delete(`/attachments/${id}`),
};

// Search
export const searchApi = {
  search: (q: string) => api.get('/search', { params: { q } }),
};
