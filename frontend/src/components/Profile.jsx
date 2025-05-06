import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setUsername(currentUser.username || "");
      setPhoneNumber(currentUser.phone_number || "");
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validate username
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username must contain only letters, numbers, and underscores");
      setIsLoading(false);
      return;
    }

    // Validate phone number (if provided)
    if (
      phoneNumber &&
      !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(
        phoneNumber
      )
    ) {
      setError("Invalid phone number format");
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateProfile({
        name,
        email,
        username,
        phone_number: phoneNumber || null,
      });

      if (result.success) {
        setSuccess("Profile updated successfully");
        setIsEditing(false);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form fields to current user data
    setName(currentUser.name || "");
    setEmail(currentUser.email || "");
    setUsername(currentUser.username || "");
    setPhoneNumber(currentUser.phone_number || "");
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Profile Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      {isEditing ? (
        <form onSubmit={handleSubmit}>
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

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="phoneNumber">
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

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-green-300"
            >
              {isLoading ? "Saving..." : "Save Changes"}
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
      ) : (
        <div>
          <div className="mb-4">
            <span className="font-semibold">Name:</span> {currentUser?.name}
          </div>
          <div className="mb-4">
            <span className="font-semibold">Email:</span> {currentUser?.email}
          </div>
          <div className="mb-4">
            <span className="font-semibold">Username:</span>{" "}
            {currentUser?.username}
          </div>
          <div className="mb-4">
            <span className="font-semibold">Phone Number:</span>{" "}
            {currentUser?.phone_number || "Not provided"}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
