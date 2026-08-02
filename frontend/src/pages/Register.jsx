import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

// Validates a single field and returns an error string, or "" if valid.
function validateField(field, value) {
  switch (field) {
    case "name":
      if (!value.trim()) return "Full name is required";
      return "";
    case "email":
      if (!value.trim()) return "Email is required";
      if (!/\S+@\S+\.\S+/.test(value)) return "Enter a valid email";
      return "";
    case "password":
      if (!value) return "Password is required";
      if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value))
        return "Password must be 8+ chars, 1 uppercase, 1 number";
      return "";
    case "mobile":
      if (!value.trim()) return "Mobile number is required";
      if (!/^\d{10}$/.test(value)) return "Enter a valid 10-digit mobile number";
      return "";
    default:
      return "";
  }
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", mobile: "", role: "USER" });
  const [fieldErrors, setFieldErrors] = useState({ name: "", email: "", password: "", mobile: "" });
  const [touched, setTouched] = useState({ name: false, email: false, password: false, mobile: false });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Feature 6: organizer/admin must attach a PDF verification document.
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState("");
  const requiresDocument = form.role === "ORGANIZER" || form.role === "ADMIN";

  const handleDocumentChange = (file) => {
    if (!file) {
      setDocumentFile(null);
      setDocumentError(requiresDocument ? "Please upload your verification document (PDF)" : "");
      return;
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setDocumentFile(null);
      setDocumentError("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDocumentFile(null);
      setDocumentError("File must be smaller than 5MB");
      return;
    }
    setDocumentFile(file);
    setDocumentError("");
  };

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    setServerError("");

    // Live validation: once a field has been touched, re-validate on every keystroke.
    if (touched[field] || value.length > 0) {
      setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(prev => ({ ...prev, [field]: validateField(field, form[field]) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate every field before submitting.
    const nextErrors = {
      name: validateField("name", form.name),
      email: validateField("email", form.email),
      password: validateField("password", form.password),
      mobile: validateField("mobile", form.mobile),
    };
    setFieldErrors(nextErrors);
    setTouched({ name: true, email: true, password: true, mobile: true });

    // Feature 6: organizer/admin registrations require a PDF document.
    let docError = "";
    if (requiresDocument && !documentFile) docError = "Please upload your verification document (PDF)";
    setDocumentError(docError);

    if (Object.values(nextErrors).some(Boolean) || docError) return;

    try {
      setLoading(true); setServerError("");

      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("password", form.password);
      data.append("phone", form.mobile);
      data.append("role", form.role);
      if (requiresDocument && documentFile) data.append("document", documentFile);

      const res = await axios.post(`${API_BASE_URL}/auth/register`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const status = res.data.status;

      if (status === "PENDING_APPROVAL") {
        // Feature 3: organizer/admin pending
        navigate("/login", {
          state: {
            infoMessage: "Registration submitted! Your account is pending admin approval. You'll receive an email once approved."
          }
        });
      } else {
        // Feature 4: USER registered redirect to login
        navigate("/login", {
          state: { infoMessage: "Registration successful! You can now login." }
        });
      }
    } catch (err) {
      const data = err.response?.data;
      // Backend tells us which field a conflict/validation error belongs to
      // (e.g. duplicate email/mobile) — show it live under that row too.
      if (data?.field === "document") {
        setDocumentError(data.error);
      } else if (data?.field && Object.prototype.hasOwnProperty.call(form, data.field)) {
        setFieldErrors(prev => ({ ...prev, [data.field]: data.error }));
      } else {
        setServerError(data?.error || "Server Error");
      }
      setLoading(false);
    }
  };

  const inputClass = (field) => `form-control ${fieldErrors[field] ? "is-invalid" : ""}`;

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-5">
      <div className="card border shadow-sm rounded-4 p-4 p-md-5 w-100" style={{ maxWidth: 460 }}>
        <h2 className="fw-bold text-center mb-1">Let's get you set up</h2>
        <p className="text-center small text-secondary mb-4">
          Just a few details and you're in.
        </p>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3" noValidate>
          <div>
            <input type="text" placeholder="Full Name"
              className={inputClass("name")}
              value={form.name}
              onChange={e => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")} />
            {fieldErrors.name && <div className="invalid-feedback d-block">{fieldErrors.name}</div>}
          </div>

          <div>
            <input type="email" placeholder="Email Address"
              className={inputClass("email")}
              value={form.email}
              onChange={e => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")} />
            {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
          </div>

          <div>
            <input type="password" placeholder="Password (8+ chars, 1 uppercase, 1 number)"
              className={inputClass("password")}
              value={form.password}
              onChange={e => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")} />
            {fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
          </div>

          <div>
            <input type="tel" placeholder="Mobile Number (10 digits)"
              className={inputClass("mobile")}
              value={form.mobile}
              onChange={e => handleChange("mobile", e.target.value)}
              onBlur={() => handleBlur("mobile")} />
            {fieldErrors.mobile && <div className="invalid-feedback d-block">{fieldErrors.mobile}</div>}
          </div>

          <select
            className="form-select"
            value={form.role}
            onChange={e => {
              const role = e.target.value;
              setForm({ ...form, role });
              // Reset document state when switching away from organizer/admin
              if (role !== "ORGANIZER" && role !== "ADMIN") {
                setDocumentFile(null);
                setDocumentError("");
              }
            }}>
            <option value="USER">User</option>
            <option value="ORGANIZER">Organizer</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Feature 3: show note for organizer/admin */}
          {requiresDocument && (
            <div className="alert alert-warning mb-0 small">
              <strong>{form.role}</strong> accounts require admin approval before you can login.
            </div>
          )}

          {/* Feature 6: organizer/admin verification document upload —
              only shown when that role is selected. */}
          {requiresDocument && (
            <div>
              <label className="form-label small fw-semibold">
                Verification Document (PDF) <span className="text-danger">*</span>
              </label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={e => handleDocumentChange(e.target.files?.[0] || null)}
                className={`form-control form-control-sm ${documentError ? "is-invalid" : ""}`}
              />
              <p className="small text-secondary mt-1 mb-0">
                Upload an ID/certification document as proof to help admin validate your {form.role.toLowerCase()} account.
              </p>
              {documentFile && !documentError && (
                <p className="small text-success mb-0">{documentFile.name}</p>
              )}
              {documentError && <div className="invalid-feedback d-block">{documentError}</div>}
            </div>
          )}

          {serverError && <p className="text-danger small mb-0">{serverError}</p>}
          <button disabled={loading} className="btn btn-dark py-2 fw-semibold">
            {loading ? "Setting up your account..." : "Create my account"}
          </button>
        </form>
        <p className="text-center small mt-3 mb-0 text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="fw-semibold text-decoration-none">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
