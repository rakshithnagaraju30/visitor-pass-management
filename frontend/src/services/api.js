import axios from 'axios';

// An empty REACT_APP_API_URL (the Docker/Nginx build) means "same origin": requests go to /api
const API_URL =
  process.env.REACT_APP_API_URL ?? 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from login/OTP endpoints is a form error, not an expired session
    const isAuthRequest = String(error.config?.url || '').startsWith('/auth/');

    if (error.response?.status === 401 && !isAuthRequest) {
      let role = null;
      try {
        role = JSON.parse(localStorage.getItem('user') || 'null')?.role;
      } catch {
        role = null;
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');

      const loginPath = role === 'visitor' ? '/visitor/login' : '/login';
      if (window.location.pathname !== loginPath) {
        window.location.assign(loginPath);
      }
    }

    return Promise.reject(error);
  }
);

// Drop empty filter values so they are not sent as ?status=
export const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );

// Download a PDF from an authenticated endpoint
export const downloadPdf = async (path, filename) => {
  const response = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const getPendingVisitorAppointments = async () => {
  const response = await api.get(
    '/appointments/pending-visitors'
  );

  return response.data;
};

export const getMyAppointments = async () => {
  const response = await api.get(
    '/appointments/my-appointments'
  );

  return response.data;
};

export default api;
