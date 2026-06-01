import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token into headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally (e.g. unauthorized redirects)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Auto logout if token expires or is invalid (401 Unauthorized)
    // Avoid infinite loop if auth requests fail with 401
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/auth/login')
    ) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login using window object if context is not available
      window.location.href = '/login?expired=true';
    }
    
    // Extract a readable error message
    const message = 
      error.response?.data?.detail || 
      error.response?.data?.message || 
      error.message || 
      'Something went wrong. Please try again.';
      
    // Modify the error object to contain the clean message for components to read
    error.cleanMessage = message;
    
    return Promise.reject(error);
  }
);

export default api;
