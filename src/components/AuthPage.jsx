// src/components/AuthPage.jsx
import React, { useState, useEffect } from "react";
import { register, login, getTestToken } from "../services/authService";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import Header from "./header";

function AuthPage() {
  const [user, setUser] = useState(null); // State to store logged-in user
  // States for Signup/Login form
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [message, setMessage] = useState(""); // For displaying success/error messages

  const [isSignup, setIsSignup] = useState(true);

  const navigate = useNavigate(); // Hook for programmatically navigating

  // Check for existing token and user on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      navigate("/dashboard"); // If user is already logged in, redirect them to the dashboard/boards page
    }
  }, [navigate]);

  const handleTestToken = async () => {
    setMessage("");
    try {
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };

      //Store the test user in local storage
      localStorage.setItem("user", JSON.stringify(mockUser));

      setUser(mockUser);
      setMessage("Test token generated and user logged in!");
      navigate("/dashboard"); // Redirect after successful test login
    } catch (error) {
      setMessage("Failed to get test token.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { user: newUser } = await register(
        authName,
        authEmail,
        authPassword
      );
      setUser(newUser);
      setMessage("Registration successful! Welcome!");
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      navigate("/dashboard"); // Redirect after successful signup
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { user: loggedInUser } = await login(authEmail, authPassword); // Reusing authEmail/Password for login demo
      setUser(loggedInUser);
      setMessage("Login successful! Welcome back!");
      setAuthEmail("");
      setAuthPassword("");
      navigate("/dashboard");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Login failed. Invalid credentials."
      );
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#121417] dark group/design-root overflow-x-hidden font-sans">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header with logo and login button */}
        <Header user={user} />

        {/* Main content area */}
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 flex-1">
            {/* Dynamic title based on mode */}
            <h2 className="text-white tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
              {isSignup ? "Sign up for LUMO" : "Welcome back to LUMO"}
            </h2>

            {/* Error/Success message display */}
            {message && (
              <div
                className={`mx-4 mb-4 p-3 rounded-lg text-center ${
                  message.includes("Failed") ||
                  message.includes("failed") ||
                  message.includes("exists") ||
                  message.includes("Invaild") ||
                  message.includes("invalid")
                    ? "bg-red-900 text-red-300"
                    : "bg-green-900 text-green-300"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={isSignup ? handleSignup : handleLogin}>
              {/* Name field - only shown for signup */}
              {isSignup && (
                <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                  <label className="flex flex-col min-w-40 flex-1">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#2b2f36] focus:border-none h-14 placeholder:text-[#a1a8b5] p-4 text-base font-normal leading-normal"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </label>
                </div>
              )}

              {/* Email field */}
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <input
                    type="email"
                    placeholder="Email"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#2b2f36] focus:border-none h-14 placeholder:text-[#a1a8b5] p-4 text-base font-normal leading-normal"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </label>
              </div>

              {/* Password field */}
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <input
                    type="password"
                    placeholder="Password"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#2b2f36] focus:border-none h-14 placeholder:text-[#a1a8b5] p-4 text-base font-normal leading-normal"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="flex px-4 py-3">
                <button
                  type="submit"
                  onClick={isSignup ? handleSignup : handleLogin}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 flex-1 bg-[#316dcd] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#2557a7] transition-colors"
                >
                  <span className="truncate">
                    {isSignup ? "Sign up" : "Log in"}
                  </span>
                </button>
              </div>
            </form>

            {/* Alternative auth options */}
            <p className="text-[#a1a8b5] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
              Or continue with
            </p>

            <div className="flex justify-center">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 max-w-[480px] justify-center">
                <button
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#2b2f36] text-white text-sm font-bold leading-normal tracking-[0.015em] grow hover:bg-[#3a3f46] transition-colors"
                  onClick={handleTestToken}
                >
                  <span className="truncate">Test Login (Dev)</span>
                </button>
              </div>
            </div>

            {/* Toggle between signup/login */}
            <p
              className="text-[#a1a8b5] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center underline cursor-pointer hover:text-white transition-colors"
              onClick={() => {
                setIsSignup(!isSignup);
                setMessage(""); // Clear any existing messages
              }}
            >
              {isSignup
                ? "Already have an account?"
                : "Don't have an account? Sign up"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
