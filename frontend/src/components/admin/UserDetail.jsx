// frontend/src/components/admin/UserDetail.jsx
import { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

const UserDetail = ({ userId, onBack }) => {
  const { getUserById, updateUser, resetUserPassword } = useAdmin();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add local loading state

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("");

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setIsLoading(true); // Set loading to true when userId changes
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const result = await getUserById(userId);
      if (result.success) {
        setUser(result.data);
        // Initialize form data
        setName(result.data.name || "");
        setEmail(result.data.email || "");
        setUsername(result.data.username || "");
        setPhoneNumber(result.data.phone_number || "");
        setRole(result.data.role || "user");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to load user data");
    } finally {
      setIsLoading(false); // Set loading to false after data is fetched
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true); // Show loading while updating

    try {
      const roleId = role === "admin" ? 1 : 2; // Map role name to ID

      const result = await updateUser(userId, {
        name,
        email,
        username,
        phone_number: phoneNumber || null,
        role_id: roleId,
      });

      if (result.success) {
        setSuccess("User updated successfully");
        setIsEditing(false);
        // Refresh user data
        loadUserData();
      } else {
        setError(result.message);
        setIsLoading(false); // If error, stop loading immediately
      }
    } catch (err) {
      setError("Failed to update user");
      setIsLoading(false); // If error, stop loading immediately
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true); // Show loading while resetting password

    try {
      const result = await resetUserPassword(userId, newPassword);

      if (result.success) {
        setSuccess("Password reset successfully");
        setShowPasswordReset(false);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to reset password");
    } finally {
      setIsLoading(false); // Always hide loading when done
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    setName(user.name || "");
    setEmail(user.email || "");
    setUsername(user.username || "");
    setPhoneNumber(user.phone_number || "");
    setRole(user.role || "user");
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const cancelPasswordReset = () => {
    setShowPasswordReset(false);
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left Column - Profile Information */}
          <div>
            <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>

            {/* ID row */}
            <div className="mb-3 flex items-center">
              <div className="h-5 w-8 bg-gray-300 rounded animate-pulse mr-2"></div>
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Username row */}
            <div className="mb-3 flex items-center">
              <div className="h-5 w-24 bg-gray-300 rounded animate-pulse mr-2"></div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Name row */}
            <div className="mb-3 flex items-center">
              <div className="h-5 w-14 bg-gray-300 rounded animate-pulse mr-2"></div>
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Email row */}
            <div className="mb-3 flex items-center">
              <div className="h-5 w-14 bg-gray-300 rounded animate-pulse mr-2"></div>
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Phone row */}
            <div className="mb-3 flex items-center">
              <div className="h-5 w-32 bg-gray-300 rounded animate-pulse mr-2"></div>
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Role row */}
            <div className="mb-3 flex items-center">
              <div className="h-5 w-12 bg-gray-300 rounded animate-pulse mr-2"></div>
              <div className="h-6 w-16 bg-green-100 rounded-full animate-pulse"></div>
            </div>

            {/* Created At row */}
            <div className="mb-3 flex items-center">
              <div className="h-5 w-24 bg-gray-300 rounded animate-pulse mr-2"></div>
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Right Column - Linked Accounts */}
          <div>
            <div className="h-7 w-36 bg-gray-200 rounded animate-pulse mb-4"></div>

            {/* Linked account cards */}
            <div className="space-y-3">
              <div className="border p-3 rounded">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse"></div>
              </div>

              <div className="border p-3 rounded">
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-36 bg-gray-100 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          <div className="h-10 w-24 bg-blue-300 rounded animate-pulse"></div>
          <div className="h-10 w-36 bg-yellow-300 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">User Not Found</h2>
          <button
            onClick={onBack}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Back to Users
          </button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">User Details</h2>
        <button
          onClick={onBack}
          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Back to Users
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      {!isEditing ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Profile Information
              </h3>
              <div className="mb-3">
                <span className="font-semibold">ID:</span> {user.id}
              </div>
              <div className="mb-3">
                <span className="font-semibold">Username:</span> {user.username}
              </div>
              <div className="mb-3">
                <span className="font-semibold">Name:</span> {user.name}
              </div>
              <div className="mb-3">
                <span className="font-semibold">Email:</span> {user.email}
              </div>
              <div className="mb-3">
                <span className="font-semibold">Phone Number:</span>{" "}
                {user.phone_number || "Not provided"}
              </div>
              <div className="mb-3">
                <span className="font-semibold">Role:</span>{" "}
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div className="mb-3">
                <span className="font-semibold">Created At:</span>{" "}
                {new Date(user.created_at).toLocaleString()}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Linked Accounts</h3>
              {user.linked_accounts?.length > 0 ? (
                <div className="space-y-3">
                  {user.linked_accounts.map((account) => (
                    <div key={account.id} className="border p-3 rounded">
                      <div className="font-medium">
                        {account.provider.charAt(0).toUpperCase() +
                          account.provider.slice(1)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {account.provider_user_id}
                      </div>
                      {account.account_data && (
                        <div className="text-sm text-gray-500">
                          Username: {account.account_data.username || "N/A"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No linked accounts</p>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Edit User
            </button>
            <button
              onClick={() => setShowPasswordReset(true)}
              className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
            >
              Reset Password
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdateUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 mb-2"
                  htmlFor="phoneNumber"
                >
                  Phone Number (optional)
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="123-456-7890"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Password Reset Form */}
      {showPasswordReset && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Reset User Password</h3>
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="newPassword">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                minLength={6}
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 mb-2"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
              >
                Reset Password
              </button>
              <button
                type="button"
                onClick={cancelPasswordReset}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
