/**
 * Client API — base URL + interceptor Bearer
 * Sur 401 : vide le localStorage et le token, appelle le callback onUnauthorized (enregistré depuis main.js).
 */
import axios from 'axios';
import { TOKEN_KEY } from '../constants/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = window.__tm_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let router;
let onUnauthorized = null;

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      window.__tm_token = null;
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (_) {
        /* ignore */
      }
      if (onUnauthorized) onUnauthorized();
      if (router) router.push('/login');
    }
    return Promise.reject(err);
  }
);

export function setApiRouter(r) {
  router = r;
}

export function setOnUnauthorized(cb) {
  onUnauthorized = cb;
}

export default client;
