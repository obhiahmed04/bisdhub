import axios from "axios";

export const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bisdhub-backend-staging.onrender.com";

export const API_BASE = `${BACKEND_URL}/api`;

export const buildAssetUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

export const resolveWsUrl = (userId) => {
  const base = BACKEND_URL.replace(/^http/, (m) => (m === "https" ? "wss" : "ws"));
  return `${base}/api/ws/${userId}`;
};

export const getPublicHandle = (user) => user?.username || user?.display_name || user?.id_number || "user";
export const getPublicLabel = (user) => `@${getPublicHandle(user)} · ${user?.id_number || ""}`.trim();

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
