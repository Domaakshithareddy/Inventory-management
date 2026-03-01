import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-bold text-white uppercase tracking-widest">
            <span className="text-primary">INV</span>ENTORY
          </h1>
          <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest">Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-dark mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-primary text-sm px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                Username
              </label>
              <input
                type="text"
                className="input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                Password
              </label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}