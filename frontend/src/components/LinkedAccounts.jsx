// frontend/src/components/LinkedAccounts.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const LinkedAccounts = () => {
  const { currentUser } = useAuth();
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [mockUserData, setMockUserData] = useState({
    id: "",
    username: "",
    email: "",
  });
  const [accountData, setAccountData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  const providers = [
    { id: "yahoo", name: "Yahoo" },
    { id: "google", name: "Google" },
    { id: "twitter", name: "Twitter" },
    { id: "facebook", name: "Facebook" },
  ];

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/linked-accounts");
      setLinkedAccounts(res.data);
    } catch (err) {
      console.error("Error fetching linked accounts:", err);
      setError("Failed to load linked accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (e) => {
    setSelectedProvider(e.target.value);
    setAccountData(null);
  };

  const handleMockDataChange = (e) => {
    const { name, value } = e.target;
    setMockUserData({
      ...mockUserData,
      [name]: value,
    });
  };

  const connectAccount = async (e) => {
    e.preventDefault();
    if (!selectedProvider) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Step 1: Initiate connection (in a real OAuth flow, this would redirect to provider)
      await axios.post(`/api/linked-accounts/connect/${selectedProvider}`);

      // Step 2: Simulate the callback (in real OAuth, this would happen after redirect)
      const mockData = {
        id: mockUserData.id || `${selectedProvider}-${Date.now()}`,
        username:
          mockUserData.username ||
          `${selectedProvider}User${Math.floor(Math.random() * 1000)}`,
        email:
          mockUserData.email ||
          `user-${Date.now()}@${selectedProvider}.example.com`,
      };

      const callbackRes = await axios.post(
        `/api/linked-accounts/callback/${selectedProvider}`,
        {
          code: "mock-auth-code",
          mockUserData: mockData,
        }
      );

      setSuccess(`Successfully linked ${selectedProvider} account`);
      fetchLinkedAccounts();

      // Reset form
      setSelectedProvider("");
      setMockUserData({ id: "", username: "", email: "" });
    } catch (err) {
      console.error("Error connecting account:", err);
      setError(err.response?.data?.message || "Failed to connect account");
    } finally {
      setLoading(false);
    }
  };

  const disconnectAccount = async (id, provider) => {
    setError("");
    setSuccess("");

    try {
      await axios.delete(`/api/linked-accounts/${id}`);
      setSuccess(`Successfully disconnected ${provider} account`);
      fetchLinkedAccounts();
      setAccountData(null);
    } catch (err) {
      console.error("Error disconnecting account:", err);
      setError(err.response?.data?.message || "Failed to disconnect account");
    }
  };

  const fetchAccountData = async (provider) => {
    setDataLoading(true);
    setAccountData(null);
    setError("");

    try {
      const res = await axios.get(`/api/linked-accounts/data/${provider}`);
      setAccountData(res.data);
    } catch (err) {
      console.error("Error fetching account data:", err);
      setError(err.response?.data?.message || "Failed to fetch account data");
    } finally {
      setDataLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Linked Accounts</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      {/* List of existing linked accounts */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Your Linked Accounts</h3>
        {loading ? (
          <p>Loading accounts...</p>
        ) : linkedAccounts.length === 0 ? (
          <p className="text-gray-500">No accounts linked yet</p>
        ) : (
          <div className="space-y-4">
            {linkedAccounts.map((account) => (
              <div
                key={account.id}
                className="border p-4 rounded flex justify-between items-center"
              >
                <div>
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
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchAccountData(account.provider)}
                    className="bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600"
                  >
                    View Data
                  </button>
                  <button
                    onClick={() =>
                      disconnectAccount(account.id, account.provider)
                    }
                    className="bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display account data if available */}
      {accountData && (
        <div className="mb-8 p-4 border rounded bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">
            Data from{" "}
            {accountData.provider.charAt(0).toUpperCase() +
              accountData.provider.slice(1)}
          </h3>
          <div className="text-sm">
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
              {JSON.stringify(accountData.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Form to connect a new account */}
      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Connect a New Account</h3>
        <form onSubmit={connectAccount}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="provider">
              Select Provider
            </label>
            <select
              id="provider"
              value={selectedProvider}
              onChange={handleProviderChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">-- Select a provider --</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProvider && (
            <div className="mb-6 p-4 border rounded bg-gray-50">
              <h4 className="font-medium mb-2">Mock User Data (Optional)</h4>
              <p className="text-sm text-gray-500 mb-3">
                In a real implementation, this data would come from the
                provider's OAuth flow. For this example, you can provide mock
                values.
              </p>

              <div className="mb-3">
                <label
                  className="block text-gray-700 mb-1 text-sm"
                  htmlFor="mockId"
                >
                  User ID
                </label>
                <input
                  id="mockId"
                  type="text"
                  name="id"
                  value={mockUserData.id}
                  onChange={handleMockDataChange}
                  placeholder="provider-user-123"
                  className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div className="mb-3">
                <label
                  className="block text-gray-700 mb-1 text-sm"
                  htmlFor="mockUsername"
                >
                  Username
                </label>
                <input
                  id="mockUsername"
                  type="text"
                  name="username"
                  value={mockUserData.username}
                  onChange={handleMockDataChange}
                  placeholder="johndoe123"
                  className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 mb-1 text-sm"
                  htmlFor="mockEmail"
                >
                  Email
                </label>
                <input
                  id="mockEmail"
                  type="email"
                  name="email"
                  value={mockUserData.email}
                  onChange={handleMockDataChange}
                  placeholder="user@example.com"
                  className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedProvider}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-green-300"
          >
            {loading ? "Connecting..." : "Connect Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LinkedAccounts;
