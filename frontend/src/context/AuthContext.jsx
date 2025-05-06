import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Set axios auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get(`${API_URL}/auth/me`);
          setCurrentUser(res.data);
        } catch (err) {
          console.error("Error loading user:", err);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (login, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        login,
        password,
      });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (name, email, password, username, phone_number) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        username,
        phone_number,
      });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed",
      };
    }
  };

  const updateProfile = async (userData) => {
    try {
      const res = await axios.put(`${API_URL}/auth/profile`, userData);
      setCurrentUser(res.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Profile update failed",
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword,
        newPassword,
      });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Password change failed",
      };
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, {
        email,
      });
      return {
        success: true,
        message: res.data.message,
        resetToken: res.data.resetToken, // Note: In a real app, this would be sent by email, not returned directly
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Password reset request failed",
      };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Password reset failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
