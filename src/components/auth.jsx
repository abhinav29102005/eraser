// src/components/Auth.jsx (Example)
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosi'; // Import your configured axios instance

function AuthComponent() {
  const [token, setToken] = useState(localStorage.getItem('jwtToken')); // Initialize from localStorage
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Function to fetch user details if token exists on load
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await axiosInstance.get('/users/me'); // This request will automatically include the token
          setUser(res.data);
        } catch (err) {
          console.error("Failed to fetch user on load:", err);
          setError(err.response?.data?.message || err.message);
          localStorage.removeItem('jwtToken'); // Clear invalid token
          setToken(null);
        }
      }
    };
    fetchUser();
  }, [token]);

  const handleGetTestToken = async () => {
    try {
      // Use axiosInstance.get, no need to set headers here as interceptor handles it for future calls
      // However, for the very first token request, you might not have a token yet.
      // So, let's use a temporary axios instance without the interceptor, or explicitly make it a POST if your backend expects that for login
      // Given your /auth/test-token is GET, it won't have a token beforehand anyway.
      const res = await axiosInstance.get('/auth/test-token');
      
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('jwtToken', res.data.token); // Store the token
      setError(null);
      console.log("Logged in as:", res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || err.message); // Access error details from response
      console.error("Login failed:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken'); // Clear token
    setToken(null);
    setUser(null);
    console.log("Logged out.");
  };

  return (
    <div>
      {!token ? (
        <button onClick={handleGetTestToken}>Get Test Token (Login)</button>
      ) : (
        <div>
          <p>Logged in as: {user?.name || user?.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}

export default AuthComponent;