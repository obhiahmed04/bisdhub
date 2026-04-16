import axios from 'axios';

const rawBackendUrl =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://bisdhub-backend-staging.onrender.com';

export const BACKEND_URL = rawBackendUrl.replace(/\/$/, '');
export const API_BASE = `${BACKEND_URL}/api`;
export const WS_BASE =
  (process.env.REACT_APP_WS_URL || `${BACKEND_URL.replace(/^http/, 'ws')}/api/ws`).replace(/\/$/, '');

export const buildAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
