// frontend/src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";
import UsersList from "./UsersList";
import UserDetail from "./UserDetail";

const AdminDashboard = () => {
  const { getUsers, loading, error } = useAdmin();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    await getUsers();
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    setActiveTab("userDetail");
  };

  const handleBackToList = () => {
    setSelectedUserId(null);
    setActiveTab("users");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 mb-4">
            Manage users, roles, and system settings
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b">
            <button
              className={`py-2 px-4 mr-2 ${
                activeTab === "users"
                  ? "bg-white border-t border-l border-r rounded-t text-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
              onClick={() => {
                setActiveTab("users");
                setSelectedUserId(null);
              }}
            >
              Users
            </button>
            {selectedUserId && (
              <button
                className={`py-2 px-4 mr-2 ${
                  activeTab === "userDetail"
                    ? "bg-white border-t border-l border-r rounded-t text-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
                onClick={() => setActiveTab("userDetail")}
              >
                User Details
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && activeTab === "users" && (
          <div className="text-center py-4">Loading...</div>
        )}

        {/* Remove the conditional skeleton loader for user details */}

        {!loading && activeTab === "users" && (
          <UsersList onUserSelect={handleUserSelect} />
        )}

        {activeTab === "userDetail" && selectedUserId && (
          <UserDetail userId={selectedUserId} onBack={handleBackToList} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
