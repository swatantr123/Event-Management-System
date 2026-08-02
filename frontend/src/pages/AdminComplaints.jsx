import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import eventService from "../services/eventService";

const STATUS_COLORS = {
  OPEN: "bg-warning-subtle text-warning-emphasis",
  IN_PROGRESS: "bg-primary-subtle text-primary-emphasis",
  RESOLVED: "bg-success-subtle text-success-emphasis",
};

const ROLE_COLORS = { USER: "bg-secondary-subtle text-secondary-emphasis", ORGANIZER: "bg-primary-subtle text-primary-emphasis" };

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("ALL"); // ALL | USER | ORGANIZER | OPEN
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [savingId, setSavingId] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const data = await eventService.getAllComplaints();
      setComplaints(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function toggleExpand(c) {
    if (expandedId === c.id) {
      setExpandedId(null);
    } else {
      setExpandedId(c.id);
      setReplyDraft(c.adminReply || "");
    }
  }

  async function handleStatusChange(id, status) {
    setSavingId(id);
    try {
      await eventService.updateComplaintStatus(id, status, null);
      showToast(`Status updated to ${status.replace("_", " ")}.`);
      await loadData();
    } catch (e) { showToast(e.message, "error"); }
    finally { setSavingId(null); }
  }

  async function handleSendReply(id) {
    if (!replyDraft.trim()) return;
    setSavingId(id);
    try {
      await eventService.updateComplaintStatus(id, null, replyDraft.trim());
      showToast("Reply sent — the raiser has been notified by email.");
      setExpandedId(null);
      await loadData();
    } catch (e) { showToast(e.message, "error"); }
    finally { setSavingId(null); }
  }

  const filtered = complaints.filter(c => {
    if (tab === "ALL") return true;
    if (tab === "OPEN") return c.status !== "RESOLVED";
    return c.raisedByRole === tab;
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === "OPEN").length,
    inProgress: complaints.filter(c => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter(c => c.status === "RESOLVED").length,
  };

  return (
    <div className="min-vh-100 bg-light">
      {toast && (
        <div className={`position-fixed top-0 end-0 m-3 px-4 py-3 rounded-3 shadow text-white fw-semibold small ${
          toast.type === "error" ? "bg-danger" : "bg-success"}`} style={{ zIndex: 1080, maxWidth: 360 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-dark text-white px-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h1 className="fs-3 fw-bold mb-0">Complaints</h1>
          <p className="text-white-50 small mt-1 mb-0">{stats.total} total · {stats.open} open</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/admin/users" className="btn btn-light btn-sm fw-semibold">Users</Link>
          <Link to="/admin/reports" className="btn btn-light btn-sm fw-semibold">Reports</Link>
          <Link to="/admin/venues" className="btn btn-light btn-sm fw-semibold">Venues</Link>
        </div>
      </div>

      <div className="container py-5">
        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total", value: stats.total, color: "" },
            { label: "Open", value: stats.open, color: "text-warning" },
            { label: "In Progress", value: stats.inProgress, color: "text-primary" },
            { label: "Resolved", value: stats.resolved, color: "text-success" },
          ].map(s => (
            <div className="col-6 col-md-3" key={s.label}>
              <div className="card border shadow-sm text-center p-3 h-100">
                <p className={`fs-3 fw-bold mb-0 ${s.color}`}>{s.value}</p>
                <p className="text-secondary small text-uppercase fw-semibold mb-0 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {[
            { key: "ALL", label: "All" },
            { key: "OPEN", label: "Unresolved" },
            { key: "USER", label: "From Users" },
            { key: "ORGANIZER", label: "From Organizers" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`btn btn-sm rounded-pill ${tab === t.key ? "btn-dark" : "btn-outline-secondary"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card border shadow-sm rounded-4 overflow-hidden">
          {loading ? (
            <div className="text-center py-5 text-secondary">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <p className="fw-semibold mb-0">No complaints here</p>
            </div>
          ) : (
            <div>
              {filtered.map((c, i) => (
                <div key={c.id} className={`p-4 ${i > 0 ? "border-top" : ""}`}>
                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                    <div className="flex-grow-1" style={{ minWidth: 240 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <h6 className="fw-bold mb-0">{c.subject}</h6>
                        <span className={`badge rounded-pill small fw-bold ${STATUS_COLORS[c.status]}`}>
                          {c.status.replace("_", " ")}
                        </span>
                        <span className={`badge rounded-pill small fw-bold ${ROLE_COLORS[c.raisedByRole]}`}>
                          {c.raisedByRole}
                        </span>
                      </div>
                      <p className="small text-secondary mb-0">
                        {c.raisedByName} · {c.raisedByEmail}
                      </p>
                      {c.eventName && (
                        <p className="small text-secondary mt-1 mb-0">
                          Event: {c.eventName}{c.organizerName ? ` (organizer: ${c.organizerName})` : ""}
                        </p>
                      )}
                      <p className="small mt-2 mb-0" style={{ whiteSpace: "pre-wrap" }}>{c.message}</p>
                      {c.adminReply && (
                        <div className="mt-2 bg-light border rounded-3 p-2">
                          <p className="small fw-semibold text-uppercase text-secondary mb-1" style={{ fontSize: "0.7rem" }}>Your reply</p>
                          <p className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>{c.adminReply}</p>
                        </div>
                      )}
                      <p className="text-secondary mt-2 mb-0" style={{ fontSize: "0.7rem" }}>{formatDateTime(c.createdAt)}</p>
                    </div>

                    <div className="d-flex flex-column gap-2 align-items-end">
                      <select
                        value={c.status}
                        disabled={savingId === c.id}
                        onChange={e => handleStatusChange(c.id, e.target.value)}
                        className="form-select form-select-sm"
                        style={{ width: "auto" }}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                      <button
                        onClick={() => toggleExpand(c)}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        {expandedId === c.id ? "Cancel" : c.adminReply ? "Edit Reply" : "Reply"}
                      </button>
                    </div>
                  </div>

                  {expandedId === c.id && (
                    <div className="mt-3 d-flex gap-2 align-items-start">
                      <textarea
                        value={replyDraft}
                        onChange={e => setReplyDraft(e.target.value)}
                        placeholder="Write a reply to the person who raised this…"
                        rows={3}
                        className="form-control"
                      />
                      <button
                        onClick={() => handleSendReply(c.id)}
                        disabled={savingId === c.id || !replyDraft.trim()}
                        className="btn btn-dark flex-shrink-0"
                      >
                        {savingId === c.id ? "…" : "Send"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminComplaints;
