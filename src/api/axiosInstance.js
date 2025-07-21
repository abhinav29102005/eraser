// src/api/axiosInstance.js
import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // Make sure VITE_API_URL is set in your frontend .env

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`, // All requests will automatically start with http://localhost:5000/api
  timeout: 10000, // Request will timeout after 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor for Attaching JWT ---
// This ensures the JWT is sent with every request automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken'); // Get token from local storage

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor for Global Error Handling (Optional but Recommended) ---
// This can be used to handle 401 Unauthorized errors globally, for example.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Example: If a 401 Unauthorized response comes, you might redirect to login
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request - redirecting to login or refreshing token');
      localStorage.removeItem('jwtToken');
      // Potentially redirect to login page or trigger token refresh
      // window.location.href = '/login';
    }
    return Promise.reject(error); // Re-throw the error so calling components can catch it
  }
);

export default axiosInstance;