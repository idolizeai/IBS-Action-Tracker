import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send cookies automatically on every request
});

// Unwrap { success: true, data: ... } envelope
api.interceptors.response.use(
  (r) => {
    if (r.data && r.data.success === true && 'data' in r.data) {
      r.data = r.data.data;
    }
    return r;
  },
  async (err) => {
    const original = err.config;

    // If 401 and not already a retry, and not an auth endpoint
    // We exclude /auth/me because AuthContext handles its 401s gracefully
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url.includes('/auth/refresh') &&
      !original.url.includes('/auth/login') &&
      !original.url.includes('/auth/me')
    ) {
      original._retry = true;
      try {
        // Try to get a new access token silently using the refresh cookie
        await api.post('/auth/refresh');
        // Retry the original failed request — new access_token cookie is now set
        return api(original);
      } catch {
        // Refresh failed — session is fully expired, send to login
        // Only redirect if we are not already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(err);
  }
);

export default api;
