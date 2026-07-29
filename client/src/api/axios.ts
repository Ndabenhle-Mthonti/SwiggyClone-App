import axios from 'axios';

/**
 * One shared Axios instance beats sprinkling `headers: { Authorization }` on
 * every call: when the token refresh/storage strategy changes, we update this
 * interceptor once instead of hunting through every page/service file.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  // AuthContext persists the JWT here; read it on each request so late logins
  // still attach without recreating the Axios instance.
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
