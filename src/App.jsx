// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  getTestToken,
  logout,
  isLoggedIn,
  getMyUserDetails,
} from "./services/authService";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import AuthPage from "./components/AuthPage";
import BoardCanvas from "./components/BoardCanvas";
import HomePage from "./components/HomePage";

import "./App.css";

const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("jwtToken"); // Check if token exists

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/"); // Redirect to login/auth page if not authenticated
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null; // Render children if authenticated, otherwise null (will redirect)
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route for authentication (login/signup) */}
        <Route path="/" element={<AuthPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/board/:boardId" // Route for individual boards
          element={
            <PrivateRoute>
              <BoardCanvas />
            </PrivateRoute>
          }
        />

        {/* Fallback for any unmatched routes */}
        <Route path="*" element={<h1>404: Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
