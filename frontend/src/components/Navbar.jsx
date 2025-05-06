// frontend/src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if the current user is an admin
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        return;
      }

      try {
        // Try to access an admin-only endpoint
        await axios.get("/admin/users");
        setIsAdmin(true);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          MyApp
        </Link>

        <div className="flex space-x-4">
          {currentUser ? (
            <>
              <Link to="/dashboard" className="hover:text-gray-300">
                Dashboard
              </Link>
              {isAdmin && (
                <Link to="/admin" className="hover:text-gray-300">
                  Admin
                </Link>
              )}
              <button onClick={logout} className="hover:text-gray-300">
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">
                Log In
              </Link>
              <Link to="/register" className="hover:text-gray-300">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
