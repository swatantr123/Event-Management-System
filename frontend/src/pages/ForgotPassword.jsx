import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const API = `${API_BASE_URL}/auth`;

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Step 1 — send OTP to email
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email"); return; }
    setLoading(true); setError("");
    try {
      await axios.post(`${API}/forgot-password`, { email });
      setSuccess(`OTP sent to ${email}. Check your inbox (and spam folder).`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Email not found");
    } finally { setLoading(false); }
  }

  // Step 2 — verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter a valid 6-digit OTP"); return; }
    setLoading(true); setError("");
    try {
      await axios.post(`${API}/verify-otp`, { email, otp });
      setSuccess("OTP verified! Set your new password.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP");
    } finally { setLoading(false); }
  }

  // Step 3 — reset password
  async function handleResetPassword(e) {
    e.preventDefault();
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(passwords.new)) {
      setError("Password must be 8+ chars, 1 uppercase, 1 number"); return;
    }
    if (passwords.new !== passwords.confirm) {
      setError("Passwords do not match"); return;
    }
    setLoading(true); setError("");
    try {
      await axios.post(`${API}/reset-password`, {
        email, otp, newPassword: passwords.new
      });
      navigate("/login", {
        state: { infoMessage: "Password reset successful! You can now login with your new password." }
      });
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-5">
      <div className="card border shadow-sm rounded-4 p-4 p-md-5 w-100" style={{ maxWidth: 420 }}>

        {/* Step indicator */}
        <div className="d-flex justify-content-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s}
              className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                step >= s ? "bg-dark text-white" : "bg-light border text-secondary"}`}
              style={{ width: 32, height: 32 }}>
              {s}
            </div>
          ))}
        </div>

        {success && (
          <div className="alert alert-success">{success}</div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <>
            <h2 className="fw-bold text-center mb-1">Forgot Password</h2>
            <p className="text-center small text-secondary mb-4">Enter your email to receive an OTP</p>
            <form onSubmit={handleSendOtp} className="d-flex flex-column gap-3">
              <input type="email" placeholder="Email Address"
                className="form-control"
                value={email} onChange={e => setEmail(e.target.value)} />
              {error && <p className="text-danger small mb-0">{error}</p>}
              <button disabled={loading} className="btn btn-dark py-2 fw-semibold">
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <h2 className="fw-bold text-center mb-1">Enter OTP</h2>
            <p className="text-center small text-secondary mb-4">
              OTP sent to <span className="fw-semibold">{email}</span>
            </p>
            <form onSubmit={handleVerifyOtp} className="d-flex flex-column gap-3">
              <input type="text" placeholder="6-digit OTP" maxLength={6}
                className="form-control text-center fs-5"
                style={{ letterSpacing: "0.3em" }}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} />
              {error && <p className="text-danger small mb-0">{error}</p>}
              <button disabled={loading} className="btn btn-dark py-2 fw-semibold">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button type="button" onClick={() => { setStep(1); setError(""); setSuccess(""); }}
                className="btn btn-link btn-sm text-secondary text-decoration-none">
                Change Email
              </button>
              <button type="button" disabled={loading} onClick={handleSendOtp}
                className="btn btn-link btn-sm text-decoration-none">
                Resend OTP
              </button>
            </form>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <h2 className="fw-bold text-center mb-1">New Password</h2>
            <p className="text-center small text-secondary mb-4">Set your new password</p>
            <form onSubmit={handleResetPassword} className="d-flex flex-column gap-3">
              <input type="password" placeholder="New Password"
                className="form-control"
                value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} />
              <input type="password" placeholder="Confirm Password"
                className="form-control"
                value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
              {error && <p className="text-danger small mb-0">{error}</p>}
              <button disabled={loading} className="btn btn-dark py-2 fw-semibold">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        <p className="text-center small mt-3 mb-0 text-secondary">
          Remember password?{" "}
          <Link to="/login" className="fw-semibold text-decoration-none">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
