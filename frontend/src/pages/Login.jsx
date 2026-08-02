import { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { setAuth } from "../utils/auth";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { API_BASE_URL } from "../config";

function decodeToken(token) {
  try { return JSON.parse(atob(token.split(".")[1])); }
  catch { return null; }
}

function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const infoMsg   = location.state?.infoMessage || "";

  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  function finalizeLogin(token) {
    const decoded   = decodeToken(token);
    const role      = (decoded?.role || "USER").trim().toUpperCase();
    const email     = decoded?.sub  || "";
    const userName  = email.split("@")[0];

    // Fix 2: store in both localStorage AND cookie
    setAuth(token, role, userName, email);

    if      (role === "ADMIN")     navigate("/admin/users");
    else if (role === "ORGANIZER") navigate("/events/manage");
    else                           navigate("/user/dashboard");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("All fields are required"); return; }
    try {
      setLoading(true); setError("");
      const res = await axios.post(`${API_BASE_URL}/auth/login`,
        { email: form.email, password: form.password });
      finalizeLogin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || "Server Error");
      setLoading(false);
    }
  };

  // Called by GoogleLoginButton with the Google ID token (JWT credential).
  // The backend verifies it with Google, fetches the name/email it needs,
  // and auto-registers/logs the person in as a USER.
  const handleGoogleCredential = async (idToken) => {
    try {
      setGoogleError(""); setError("");
      const res = await axios.post(`${API_BASE_URL}/auth/google-login`, { idToken });
      finalizeLogin(res.data.token);
    } catch (err) {
      setGoogleError(err.response?.data?.error || "Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-5">
      <div className="card border shadow-sm rounded-4 p-4 p-md-5 w-100" style={{ maxWidth: 420 }}>
        <h2 className="fw-bold text-center mb-4">Welcome Back</h2>

        {infoMsg && (
          <div className="alert alert-success">{infoMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <input type="email" placeholder="Email Address"
            className="form-control"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Password"
            className="form-control"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-danger small mb-0">{error}</p>}
          <div className="text-end">
            <Link to="/forgot-password" className="small text-decoration-none">
              Forgot Password?
            </Link>
          </div>
          <button disabled={loading} className="btn btn-dark py-2 fw-semibold">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="d-flex align-items-center gap-3 my-4">
          <div className="flex-grow-1 border-top" />
          <span className="small text-secondary text-uppercase">or</span>
          <div className="flex-grow-1 border-top" />
        </div>

        <GoogleLoginButton onCredential={handleGoogleCredential} onError={setGoogleError} />
        {googleError && <p className="text-danger small text-center mt-2 mb-0">{googleError}</p>}
        <p className="text-center text-secondary small mt-2 mb-0">
          Google Sign-In always logs you in as a regular user.
        </p>

        <p className="text-center small mt-3 mb-0 text-secondary">
          New user?{" "}
          <Link to="/register" className="fw-semibold text-decoration-none">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
