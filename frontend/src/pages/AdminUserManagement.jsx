import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import eventService from "../services/eventService";

const ROLE_COLORS = { ADMIN: "bg-dark-subtle text-dark-emphasis", ORGANIZER: "bg-primary-subtle text-primary-emphasis", USER: "bg-secondary-subtle text-secondary-emphasis" };
const STATUS_COLORS = { ACTIVE: "bg-success-subtle text-success-emphasis", LOCKED: "bg-danger-subtle text-danger-emphasis", PENDING_APPROVAL: "bg-warning-subtle text-warning-emphasis" };

function AdminUserManagement() {
  const [tab, setTab] = useState("ALL"); // ALL | PENDING
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [docLoadingId, setDocLoadingId] = useState(null);
  // Feature: an organizer/admin's verification document must be opened by
  // the admin before that account can be approved.
  const [viewedDocs, setViewedDocs] = useState(new Set());

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const [all, pend] = await Promise.all([
        eventService.getAllUsers(),
        eventService.getPendingUsers(),
      ]);
      setUsers(all);
      setPending(pend);
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Feature 6: view the PDF an organizer/admin uploaded at registration,
  // to validate it before approving their account.
  async function handleViewDocument(id) {
    setDocLoadingId(id);
    try {
      const url = await eventService.getUserDocument(id);
      window.open(url, "_blank", "noopener,noreferrer");
      setViewedDocs(prev => new Set(prev).add(id));
    } catch (e) { showToast(e.message, "error"); }
    finally { setDocLoadingId(null); }
  }

  // A pending user can only be approved once their document has been opened
  // by the admin — unless they didn't upload one at all, in which case there's
  // nothing to review and approval isn't blocked. Backend persists this via
  // `documentViewed`; `viewedDocs` just gives instant feedback in this tab
  // before the list is reloaded.
  function canApprove(u) {
    return !u.hasDocument || u.documentViewed || viewedDocs.has(u.id);
  }

  async function handleApprove(id, name) {
    const target = [...pending, ...users].find(u => u.id === id);
    if (target && !canApprove(target)) {
      showToast("Please view the verification document before approving.", "error");
      return;
    }
    setActionId(id);
    try {
      await eventService.approveUser(id);
      showToast(`${name} approved! They will receive an email notification.`);
      await loadData();
    } catch (e) { showToast(e.message, "error"); }
    finally { setActionId(null); }
  }

  async function handleReject(id, name) {
    setActionId(id);
    try {
      await eventService.rejectUser(id);
      showToast(`${name}'s account rejected and removed.`, "error");
      await loadData();
    } catch (e) { showToast(e.message, "error"); }
    finally { setActionId(null); }
  }

  async function handleStatus(id, newStatus) {
    setActionId(id);
    try {
      await eventService.updateUserStatus(id, newStatus);
      showToast(`User ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
      await loadData();
    } catch (e) { showToast(e.message, "error"); }
    finally { setActionId(null); }
  }

  async function handleRole(id, newRole) {
    setActionId(id);
    try {
      await eventService.updateUserRole(id, newRole);
      showToast("Role updated. User will receive an email notification.");
      await loadData();
    } catch (e) { showToast(e.message, "error"); }
    finally { setActionId(null); }
  }

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="fs-3 fw-bold mb-0">User Management</h1>
          <p className="text-white-50 small mt-1 mb-0">
            {users.length} total users
            {pending.length > 0 && (
              <span className="ms-2 badge rounded-pill bg-warning text-dark">
                {pending.length} pending
              </span>
            )}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/admin/reports" className="btn btn-light btn-sm fw-semibold">Reports</Link>
          <Link to="/admin/venues" className="btn btn-light btn-sm fw-semibold">Venues</Link>
          <Link to="/admin/complaints" className="btn btn-light btn-sm fw-semibold">Complaints</Link>
          <Link to="/events/manage" className="btn btn-outline-light btn-sm fw-semibold">Events</Link>
        </div>
      </div>

      <div className="container py-5">
        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Users", value: users.length, color: "" },
            { label: "Active", value: users.filter(u => u.status === "ACTIVE").length, color: "text-success" },
            { label: "Pending Approval", value: pending.length, color: "text-warning" },
            { label: "Locked", value: users.filter(u => u.status === "LOCKED").length, color: "text-danger" },
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
        <div className="d-flex gap-2 mb-3">
          {["ALL", "PENDING"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`btn btn-sm rounded-pill ${tab === t ? "btn-dark" : "btn-outline-secondary"}`}>
              {t === "PENDING" ? `Pending Approval (${pending.length})` : "All Users"}
            </button>
          ))}
        </div>

        {/* PENDING APPROVALS TAB */}
        {tab === "PENDING" && (
          <div className="card border shadow-sm rounded-4 overflow-hidden">
            {pending.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <p className="fw-semibold mb-0">No pending approvals</p>
              </div>
            ) : (
              <div>
                {pending.map((u, i) => (
                  <div key={u.id} className={`p-4 d-flex align-items-center justify-content-between flex-wrap gap-3 ${i > 0 ? "border-top" : ""}`}>
                    <div>
                      <p className="fw-bold mb-0">{u.fullName}</p>
                      <p className="small text-secondary mb-0">{u.email} · {u.mobileNumber}</p>
                      <p className="small text-secondary mt-1 mb-0">
                        Role: <span className={`badge rounded-pill fw-bold ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                        &nbsp;· Registered: {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}
                      </p>
                      {/* Feature 6: validate the organizer/admin's uploaded document before approving */}
                      {u.hasDocument ? (
                        <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                          <button onClick={() => handleViewDocument(u.id)} disabled={docLoadingId === u.id}
                            className="btn btn-outline-primary btn-sm">
                            {docLoadingId === u.id ? "Opening..." : (u.documentViewed || viewedDocs.has(u.id)) ? "View Document Again" : "View Verification Document"}
                          </button>
                          {(u.documentViewed || viewedDocs.has(u.id)) ? (
                            <span className="small text-success fw-semibold">Document reviewed</span>
                          ) : (
                            <span className="small text-warning-emphasis fw-semibold">Review the document to enable approval</span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 small text-danger fw-semibold mb-0">No verification document uploaded</p>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <button onClick={() => handleApprove(u.id, u.fullName)}
                        disabled={actionId === u.id || !canApprove(u)}
                        title={!canApprove(u) ? "View the verification document first" : undefined}
                        className="btn btn-dark btn-sm">
                        {actionId === u.id ? "..." : "Approve"}
                      </button>
                      <button onClick={() => handleReject(u.id, u.fullName)}
                        disabled={actionId === u.id}
                        className="btn btn-outline-danger btn-sm">
                        {actionId === u.id ? "..." : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALL USERS TAB */}
        {tab === "ALL" && (
          <>
            <input type="text" placeholder="Search by name or email…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="form-control mb-3" />
            <div className="card border shadow-sm rounded-4 overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      {["#","Name","Email","Mobile","Role","Status","Last Login","Actions"].map(h => (
                        <th key={h} className="small text-uppercase text-secondary">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="8" className="text-center py-5 text-secondary">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan="8" className="text-center py-5 text-secondary">No users found</td></tr>
                    ) : filtered.map((u, i) => (
                      <tr key={u.id}>
                        <td className="text-secondary">{i + 1}</td>
                        <td className="fw-semibold">{u.fullName}</td>
                        <td className="text-secondary">{u.email}</td>
                        <td className="text-secondary">{u.mobileNumber || "—"}</td>
                        <td>
                          <select value={u.role} disabled={actionId === u.id}
                            onChange={e => handleRole(u.id, e.target.value)}
                            className="form-select form-select-sm" style={{ width: "auto" }}>
                            <option value="USER">USER</option>
                            <option value="ORGANIZER">ORGANIZER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td>
                          <span className={`badge rounded-pill small fw-bold ${STATUS_COLORS[u.status] || "bg-secondary-subtle text-secondary-emphasis"}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="text-secondary small">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-IN") : "Never"}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {u.status === "PENDING_APPROVAL" ? (
                              <button onClick={() => handleApprove(u.id, u.fullName)}
                                disabled={actionId === u.id || !canApprove(u)}
                                title={!canApprove(u) ? "View the verification document first" : undefined}
                                className="btn btn-dark btn-sm">
                                Approve
                              </button>
                            ) : u.status === "ACTIVE" ? (
                              <button onClick={() => handleStatus(u.id, "LOCKED")}
                                disabled={actionId === u.id}
                                className="btn btn-outline-danger btn-sm">
                                Deactivate
                              </button>
                            ) : (
                              <button onClick={() => handleStatus(u.id, "ACTIVE")}
                                disabled={actionId === u.id}
                                className="btn btn-outline-success btn-sm">
                                Activate
                              </button>
                            )}
                            {u.hasDocument && (
                              <button onClick={() => handleViewDocument(u.id)} disabled={docLoadingId === u.id}
                                className="btn btn-outline-primary btn-sm">
                                {docLoadingId === u.id ? "..." : "Document"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminUserManagement;
