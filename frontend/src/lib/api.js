import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL;

if (!rawUrl) {
  throw new Error('VITE_API_URL is not defined. Check your frontend .env or Vercel environment variables.');
}

const API_URL = rawUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

api.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data && typeof data.success === 'boolean' && data.success) {
      return { ...response, data: data.data };
    }
    if (data && typeof data.success === 'boolean' && !data.success) {
      return Promise.reject(Object.assign(new Error(data.message || 'Request failed'), {
        response: { ...response, data }
      }));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    console.error('[API Response Error]', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
