// src/utils/api.js
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Inject JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token helpers
export const apiSetToken = (t) => localStorage.setItem("token", t);
export const apiClearToken = () => localStorage.removeItem("token");

// Generic helpers
export const apiGet = (p) => api.get(p).then((res) => res.data);
export const apiPost = (p, b) => api.post(p, b).then((res) => res.data);
export const apiPut = (p, b) => api.put(p, b).then((res) => res.data);
export const apiDelete = (p) => api.delete(p).then((res) => res.data);

// Communiqués
export const apiPreviewCommunique = (id) =>
  apiGet(`/communiques/${id}/preview`);

export default api;

