import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import eventService from "../services/eventService";

function StatCard({ label, value, color = "" }) {
  return (
    <div className="card border shadow-sm text-center p-4 h-100">
      <p className={`fs-2 fw-bold mb-0 ${color}`}>{value}</p>
      <p className="text-secondary small text-uppercase fw-semibold mb-0 mt-1">{label}</p>
    </div>
  );
}

function MiniBar({ label, value, max, color = "bg-success" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="d-flex align-items-center gap-3">
      <span className="small text-secondary text-truncate" style={{ width: 110 }}>{label}</span>
      <div className="progress flex-grow-1" style={{ height: 12 }}>
        <div className={`progress-bar ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="small fw-bold text-end" style={{ width: 30 }}>{value}</span>
    </div>
  );
}

function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try { setReport(await eventService.getAdminReport()); }
      catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function exportCSV() {
    if (!report?.eventDetails) return;
    const headers = ["Event ID","Event Name","Venue","Date","Status","Max Participants","Available Seats","Booked Seats","Registration Fee"];
    const rows = report.eventDetails.map(e => [
      e.eventId, `"${e.eventName}"`, `"${e.venue}"`, e.eventDate, e.status,
      e.maxParticipants ?? "Unlimited", e.availableSeats ?? "N/A",
      e.bookedSeats, e.registrationFee ?? 0,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `sports-ems-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  if (loading) return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <div className="spinner-border" role="status" />
    </div>
  );

  const byStatus = report?.eventsByStatus || {};
  const byRole = report?.usersByRole || {};

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-dark text-white px-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h1 className="fs-3 fw-bold mb-0">System Reports</h1>
          <p className="text-white-50 small mt-1 mb-0">Generated {new Date().toLocaleString("en-IN")}</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="btn btn-light btn-sm fw-semibold">Export CSV</button>
          <Link to="/admin/users" className="btn btn-outline-light btn-sm fw-semibold">Users</Link>
          <Link to="/admin/venues" className="btn btn-light btn-sm fw-semibold">Venues</Link>
          <Link to="/admin/complaints" className="btn btn-light btn-sm fw-semibold">Complaints</Link>
        </div>
      </div>

      <div className="container py-5 d-flex flex-column gap-5">
        {error && <div className="alert alert-danger mb-0">{error}</div>}

        {/* Overview stats */}
        <section>
          <h5 className="fw-bold text-secondary mb-3">Overview</h5>
          <div className="row g-3">
            <div className="col-6 col-md-3"><StatCard label="Total Events" value={report?.totalEvents ?? 0} /></div>
            <div className="col-6 col-md-3"><StatCard label="Total Users" value={report?.totalUsers ?? 0} /></div>
            <div className="col-6 col-md-3"><StatCard label="Total Bookings" value={report?.totalBookings ?? 0} color="text-primary" /></div>
            <div className="col-6 col-md-3"><StatCard label="Confirmed Bookings" value={report?.confirmedBookings ?? 0} color="text-success" /></div>
          </div>
        </section>

        {/* Charts row */}
        <div className="row g-4">
          {/* Events by status */}
          <div className="col-md-4">
            <div className="card border shadow-sm p-4 h-100">
              <h6 className="fw-bold text-secondary text-uppercase small mb-3">Events by Status</h6>
              <div className="d-flex flex-column gap-3">
                {[["OPEN","bg-success"],["CLOSED","bg-secondary"],["CANCELLED","bg-danger"]].map(([k,c]) => (
                  <MiniBar key={k} label={k} value={byStatus[k] || 0} max={report?.totalEvents || 1} color={c} />
                ))}
              </div>
            </div>
          </div>

          {/* Users by role */}
          <div className="col-md-4">
            <div className="card border shadow-sm p-4 h-100">
              <h6 className="fw-bold text-secondary text-uppercase small mb-3">Users by Role</h6>
              <div className="d-flex flex-column gap-3">
                {[["ADMIN","bg-dark"],["ORGANIZER","bg-primary"],["USER","bg-secondary"]].map(([k,c]) => (
                  <MiniBar key={k} label={k} value={byRole[k] || 0} max={report?.totalUsers || 1} color={c} />
                ))}
              </div>
            </div>
          </div>

          {/* Bookings split */}
          <div className="col-md-4">
            <div className="card border shadow-sm p-4 h-100">
              <h6 className="fw-bold text-secondary text-uppercase small mb-3">Booking Status</h6>
              <div className="d-flex flex-column gap-3">
                <MiniBar label="Confirmed" value={report?.confirmedBookings || 0} max={report?.totalBookings || 1} color="bg-success" />
                <MiniBar label="Cancelled" value={report?.cancelledBookings || 0} max={report?.totalBookings || 1} color="bg-danger" />
              </div>
              <div className="row g-2 mt-3 pt-3 border-top">
                <div className="col-6">
                  <div className="bg-danger-subtle rounded-3 p-2 text-center">
                    <p className="fs-4 fw-bold text-danger-emphasis mb-0">{report?.cancelledBookings || 0}</p>
                    <p className="small text-secondary fw-semibold mb-0">Cancelled</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-success-subtle rounded-3 p-2 text-center">
                    <p className="fs-4 fw-bold text-success-emphasis mb-0">{report?.confirmedBookings || 0}</p>
                    <p className="small text-secondary fw-semibold mb-0">Confirmed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seat utilization table */}
        <section>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold text-secondary mb-0">Seat Utilization per Event</h5>
            <button onClick={exportCSV} className="btn btn-dark btn-sm">Export CSV</button>
          </div>
          <div className="card border shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {["Event","Venue","Date","Status","Capacity","Booked","Available","Fee","Fill %"].map(h => (
                      <th key={h} className="small text-uppercase text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(report?.eventDetails || []).length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-5 text-secondary">No events yet</td></tr>
                  ) : (report?.eventDetails || []).map(e => {
                    const pct = e.maxParticipants > 0 ? Math.round((e.bookedSeats / e.maxParticipants) * 100) : 0;
                    const statusColors = { OPEN: "bg-success-subtle text-success-emphasis", CLOSED: "bg-secondary-subtle text-secondary-emphasis", CANCELLED: "bg-danger-subtle text-danger-emphasis" };
                    const barColor = pct >= 90 ? "bg-danger" : pct >= 60 ? "bg-warning" : "bg-success";
                    return (
                      <tr key={e.eventId}>
                        <td className="fw-semibold text-truncate" style={{ maxWidth: 160 }}>{e.eventName}</td>
                        <td className="text-secondary text-truncate" style={{ maxWidth: 120 }}>{e.venue}</td>
                        <td className="text-secondary">{e.eventDate}</td>
                        <td>
                          <span className={`badge rounded-pill small fw-bold ${statusColors[e.status]}`}>{e.status}</span>
                        </td>
                        <td className="text-center">{e.maxParticipants ?? "∞"}</td>
                        <td className="text-center fw-semibold text-primary">{e.bookedSeats}</td>
                        <td className="text-center fw-semibold text-success">{e.availableSeats ?? "∞"}</td>
                        <td>{e.registrationFee > 0 ? `₹${e.registrationFee}` : "Free"}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 6, width: 64 }}>
                              <div className={`progress-bar ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="small fw-bold">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminReports;
