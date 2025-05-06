import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState(""); // Only for demo purposes

  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setMessage(result.message);
        setIsSubmitted(true);

        // Only for demo purposes - in a real app, token would be sent via email
        if (result.resetToken) {
          setResetToken(result.resetToken);
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to process your request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {message && <p className="text-green-500 mb-4">{message}</p>}

        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isLoading ? "Processing..." : "Request Password Reset"}
            </button>
          </form>
        ) : (
          // Only for demo purposes - showing the reset token
          resetToken && (
            <div className="mt-4">
              <p className="text-sm text-gray-700 mb-2">
                For demo purposes only, use this token to reset your password:
              </p>
              <div className="bg-gray-100 p-2 rounded overflow-x-auto">
                <code className="text-xs break-all">{resetToken}</code>
              </div>
              <div className="mt-4">
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Continue to reset password
                </Link>
              </div>
            </div>
          )
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-500 hover:text-blue-700">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
