import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('placar_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: clear storage and dispatch event — let React Router redirect (no full page reload)
let handlingUnauthorized = false;
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !handlingUnauthorized) {
      handlingUnauthorized = true;
      localStorage.removeItem('placar_token');
      localStorage.removeItem('placar_user');
      // Dispatch event so AuthContext can clear state and React Router handles redirect
      window.dispatchEvent(new Event('placar:unauthorized'));
      setTimeout(() => { handlingUnauthorized = false; }, 3000);
    }
    return Promise.reject(err);
  }
);

export default api;
