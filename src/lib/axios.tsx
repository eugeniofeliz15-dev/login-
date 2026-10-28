import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "https://backend-solandre.onrender.com";
const TOKEN_KEY = "delinut_access_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosInstance;
