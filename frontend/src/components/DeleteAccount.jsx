// frontend/src/components/DeleteAccount.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DeleteAccount = () => {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { deleteAccount } = useAuth();
  const navigate = useNavigate();

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (confirmation !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setShowConfirmation(true);
  };

  const handleFinalDelete = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await deleteAccount(password);
      if (result.success) {
        // Account deleted, user will be logged out and redirected to login page
        navigate("/login");
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to delete account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setConfirmation("");
    setError("");
    setShowConfirmation(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Delete Account</h2>
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          <p className="font-bold">Warning:</p>
          <p>
            Deleting your account is permanent and cannot be undone. All your
            data, including profile information and linked accounts, will be
            permanently removed.
          </p>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!showConfirmation ? (
          <form onSubmit={handleInitialSubmit}>
            <div className="mb-6">
              <p className="mb-4">
                To confirm deletion, please type "DELETE" in the field below:
              </p>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              >
                Continue
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleFinalDelete}>
            <div className="mb-6">
              <p className="mb-4">
                To finalize the deletion of your account, please enter your
                password:
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-red-300"
              >
                {isLoading ? "Deleting Account..." : "Delete My Account"}
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
      </div>
    </div>
  );
};

export default DeleteAccount;
