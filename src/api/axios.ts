import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// ADD THIS INTERCEPTOR BELOW YOUR AXIOS CREATION:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stk_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;