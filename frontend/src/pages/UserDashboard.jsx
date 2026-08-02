import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserName, getEmail } from "../utils/auth";
import eventService from "../services/eventService";
import { downloadBookingPdf } from "../utils/bookingPdf";
import ComplaintBox from "../components/ComplaintBox";

function formatDate(isoDate) {
  if (!isoDate) return "—";
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const STATUS_STYLES = {
  CONFIRMED: "bg-success-subtle text-success-emphasis border border-success-subtle",
  CANCELLED: "bg-danger-subtle text-danger-emphasis border border-danger-subtle",
};
const STATUS_LABELS = { CONFIRMED: "Confirmed", CANCELLED: "Cancelled" };

function UserDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComplaints, setShowComplaints] = useState(false);

  const userName = getUserName() || "there";
  const email = getEmail() || "—";

  const loadData = useCallback(async () => {
    try {
      const data = await eventService.getMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Clicking a registered event should take the user to their events page.
  function handleEventClick() {
    navigate("/user/events");
  }

  const confirmed = bookings.filter(b => b.status === "CONFIRMED");

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-dark text-white px-4 py-3 d-flex align-items-center justify-content-between">
        <div>
          <h1 className="fs-3 fw-bold mb-0">My Dashboard</h1>
          <p className="text-white-50 small mt-1 mb-0">Welcome back, {userName}</p>
        </div>
      </div>

      <div className="container py-5" style={{ maxWidth: "56rem" }}>
        {/* Profile card */}
        <div className="card border shadow-sm rounded-4 p-4 mb-4 d-flex flex-column flex-sm-row align-items-sm-center gap-4">
          <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{ width: 80, height: 80, fontSize: "1.75rem" }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="small text-secondary fw-semibold text-uppercase mb-0" style={{ letterSpacing: "0.05em" }}>Name</p>
            <p className="fs-5 fw-bold mb-2">{userName}</p>
            <p className="small text-secondary fw-semibold text-uppercase mb-0" style={{ letterSpacing: "0.05em" }}>Email</p>
            <p className="fs-5 fw-bold mb-0">{email}</p>
          </div>
        </div>

        {/* Complaints — raise complaints, view status & admin replies */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="fw-bold mb-0">Complaints</h4>
          <button
            type="button"
            onClick={() => setShowComplaints(v => !v)}
            className="btn btn-outline-secondary btn-sm"
          >
            {showComplaints ? "Hide Complaints" : "Complaints"}
          </button>
        </div>
        {showComplaints && <ComplaintBox role="USER" />}

        {/* Registered events */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="fw-bold mb-0">My Registered Events</h4>
          <button
            onClick={() => navigate("/user/events")}
            className="btn btn-link btn-sm fw-semibold text-decoration-none p-0"
          >
            Browse all events
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary">
            <div className="spinner-border mb-3" role="status" />
            <p className="mb-0">Loading your events…</p>
          </div>
        ) : confirmed.length === 0 ? (
          <div className="card border shadow-sm rounded-4 text-center py-5 px-3 text-secondary">
            <h5 className="fw-bold mb-2">No events registered yet</h5>
            <p className="small mb-3">Browse events and register to see them here.</p>
            <div>
              <button
                onClick={() => navigate("/user/events")}
                className="btn btn-dark btn-sm"
              >
                Browse Events
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {confirmed.map(b => {
              const s = STATUS_STYLES[b.status] || STATUS_STYLES.CONFIRMED;
              return (
                <div className="col-sm-6" key={b.bookingId}>
                  <div className="card border shadow-sm rounded-4 h-100 p-3 d-flex flex-column gap-2">
                    <button
                      type="button"
                      onClick={handleEventClick}
                      className="btn text-start p-0 border-0 bg-transparent d-flex flex-column gap-2"
                    >
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <h6 className="fw-bold mb-0">{b.eventName}</h6>
                        <span className={`badge rounded-pill fw-semibold text-uppercase small ${s}`}>
                          {STATUS_LABELS[b.status] || b.status}
                        </span>
                      </div>
                      <p className="text-secondary small mb-0 text-truncate">{b.venue}</p>
                      <p className="text-secondary small mb-0">{formatDate(b.eventDate)}</p>
                      <p className="text-secondary small mb-0">
                        {b.numberOfTickets || 1} ticket{(b.numberOfTickets || 1) !== 1 ? "s" : ""}
                        {b.totalAmount != null && Number(b.totalAmount) > 0 && (
                          <> · ₹{Number(b.totalAmount).toFixed(2)}</>
                        )}
                      </p>
                    </button>

                    {/* Feature 4: organizer contact details, same as the confirmation email */}
                    {(b.organizerName || b.organizerEmail) && (
                      <div className="bg-light rounded-3 p-2 small text-secondary mt-1">
                        <p className="text-secondary fw-semibold text-uppercase mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                          Organizer
                        </p>
                        <p className="fw-semibold mb-0">{b.organizerName || "—"}</p>
                        {b.organizerEmail && <p className="text-truncate mb-0">{b.organizerEmail}</p>}
                        {b.organizerPhone && <p className="mb-0">{b.organizerPhone}</p>}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => downloadBookingPdf(b)}
                      className="btn btn-outline-secondary btn-sm mt-1"
                    >
                      Download Details (PDF)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
