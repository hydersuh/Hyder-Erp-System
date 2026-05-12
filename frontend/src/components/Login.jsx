import React, { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";


const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/login", { username, password });

      onLogin(response.data.token, response.data.user);
      toast.success("Login successful!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">ERP System</h1>
          <p className="text-gray-500 mt-2">Enterprise Resource Planning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="form-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">Demo Credentials:</p>
          <p className="text-xs text-gray-500 text-center mt-1">
            Username: admin / Password: admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
