// frontend/src/components/admin/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    // Check if the current user is an admin
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setCheckingAdmin(false);
        return;
      }

      try {
        // Try to access an admin-only endpoint
        await axios.get("/admin/users");
        setIsAdmin(true);
      } catch (error) {
        // If we get a 403 or 401, the user is not an admin
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  if (loading || checkingAdmin) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default AdminRoute;
