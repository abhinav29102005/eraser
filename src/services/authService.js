import { use } from "react";
import axiosInstance from "../api/axiosInstance";

export const getTestToken = async () => {
  try {
    const response = await axiosInstance.get("/auth/test-token");
    console.log("Response from test-token:", response.data);
    localStorage.setItem("jwtToken", response.data.token);
    return response.data.user;
  } catch (error) {
    console.error("Error", error);
  }
};

//register function
export const register = async (name, email, password) => {
  try {
    const res = await axiosInstance.post("/auth/register", {
      name,
      email,
      password,
    });
    const { token, user } = res.data;

    //Store token and user data in local storage
    localStorage.setItem("jwtToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    return { user };
  } catch (err) {
    console.error("error:", err);
    throw err;
  }
};

//login fucntion
export const login = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    const { token, user } = response.data;
    // Store token and user data in local storage
    localStorage.setItem("jwtToken", token);
    localStorage.setItem("user", JSON.stringify(user));
    return { token, user };
  } catch (error) {
    console.error("Error during login:", error);
  }
};

export const getMyUserDetails = async () => {
  try {
    const response = await axiosInstance.get("/users/me");
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch user details:",
      error.response?.data?.message || error.message
    );
    throw error.response?.data || error;
  }
};
export const logout = () => {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("user");
  console.log("Logged out successfully.");
};
export const isLoggedIn = () => {
  return !!localStorage.getItem("jwtToken");
};
