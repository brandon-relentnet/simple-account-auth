// frontend/src/context/AdminContext.jsx
import { createContext, useState, useContext } from "react";
import axios from "axios";

const AdminContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AdminProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all users
  const getUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      setUsers(res.data);
      return { success: true, data: res.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to fetch users";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Get user by ID
  const getUserById = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/admin/users/${userId}`);
      return { success: true, data: res.data };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch user details";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const updateUser = async (userId, userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.put(`${API_URL}/admin/users/${userId}`, userData);

      // Update users list if we have it loaded
      if (users.length > 0) {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, ...res.data } : user
          )
        );
      }

      return { success: true, data: res.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update user";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Reset user password
  const resetUserPassword = async (userId, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.put(
        `${API_URL}/admin/users/${userId}/reset-password`,
        {
          newPassword,
        }
      );
      return { success: true, message: res.data.message };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to reset password";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.delete(`${API_URL}/admin/users/${userId}`);

      // Update users list if we have it loaded
      if (users.length > 0) {
        setUsers(users.filter((user) => user.id !== userId));
      }

      return { success: true, message: res.data.message };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete user";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Create admin user
  const createAdminUser = async (adminData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/admin/create-admin`, adminData);
      return { success: true, data: res.data };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to create admin user";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    users,
    loading,
    error,
    getUsers,
    getUserById,
    updateUser,
    resetUserPassword,
    deleteUser,
    createAdminUser,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export const useAdmin = () => {
  return useContext(AdminContext);
};
