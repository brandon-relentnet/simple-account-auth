import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Profile from "./Profile";
import ChangePassword from "./ChangePassword";

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="mb-4">
            <span className="font-semibold">
              Welcome, {currentUser.username}!
            </span>
          </p>
          <button
            onClick={logout}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Log Out
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b">
            <button
              className={`py-2 px-4 mr-2 ${
                activeTab === "profile"
                  ? "bg-white border-t border-l border-r rounded-t text-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button
              className={`py-2 px-4 mr-2 ${
                activeTab === "security"
                  ? "bg-white border-t border-l border-r rounded-t text-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab("security")}
            >
              Security
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "profile" && <Profile />}
        {activeTab === "security" && <ChangePassword />}
      </div>
    </div>
  );
};

export default Dashboard;
