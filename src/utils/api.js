import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sl_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sl_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const searchAPI = {
  search: (query, platform) => api.post('/search', { query, platform }),
  platforms: () => api.get('/search/platforms'),
  suggestions: (q) => api.get(`/search/suggestions?q=${q}`),
};

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const historyAPI = {
  get: (page = 1) => api.get(`/history?page=${page}`),
  delete: (id) => api.delete(`/history/${id}`),
  clear: () => api.delete('/history'),
};

export const bookmarksAPI = {
  get: (collection, page = 1) => api.get(`/bookmarks?page=${page}${collection ? `&collection=${collection}` : ''}`),
  create: (data) => api.post('/bookmarks', data),
  update: (id, data) => api.put(`/bookmarks/${id}`, data),
  delete: (id) => api.delete(`/bookmarks/${id}`),
};

export const trendingAPI = {
  get: (limit = 20) => api.get(`/trending?limit=${limit}`),
};

export const usersAPI = {
  stats: () => api.get('/users/stats'),
  saveSearch: (query, platform) => api.post('/users/saved-searches', { query, platform }),
  deleteSavedSearch: (index) => api.delete(`/users/saved-searches/${index}`),
};

export default api;
