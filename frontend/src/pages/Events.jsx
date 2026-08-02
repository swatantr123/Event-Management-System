import { getToken } from "../utils/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import eventService from "../services/eventService";
import { API_BASE_URL } from "../config";

function formatDate(isoDate) {
  if (!isoDate) return "—";
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function formatTime(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":");
  const d = new Date(); d.setHours(+h, +m);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES = {
  OPEN: "bg-success-subtle text-success-emphasis border border-success-subtle",
  CLOSED: "bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle",
  CANCELLED: "bg-danger-subtle text-danger-emphasis border border-danger-subtle",
};
const STATUS_LABELS = { OPEN: "Open", CLOSED: "Closed", CANCELLED: "Cancelled" };

function EventCard({ event, isLoggedIn, onRegisterClick }) {
  const statusClass = STATUS_STYLES[event.status] || STATUS_STYLES.OPEN;
  const start = formatTime(event.startTime);
  const end = formatTime(event.endTime);
  const isFull = event.availableSeats != null && event.availableSeats <= 0;

  return (
    <div className="card border shadow-sm rounded-4 h-100 d-flex flex-column overflow-hidden">
      <div className="bg-dark text-white p-3">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <h6 className="fw-bold mb-0">{event.eventName}</h6>
          <span className={`badge rounded-pill fw-semibold text-uppercase small ${statusClass}`}>
            {STATUS_LABELS[event.status] || event.status}
          </span>
        </div>
        <div className="mt-1 small text-white-50 text-truncate">{event.venue}</div>
      </div>

      <div className="p-3 d-flex flex-column gap-3 flex-grow-1">
        {event.category && (
          <span className="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle align-self-start text-uppercase small">
            {event.category}
          </span>
        )}
        {event.description && (
          <p className="text-secondary small mb-0" style={{
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
          }}>{event.description}</p>
        )}
        <div className="row g-2">
          <div className="col-6">
            <div className="bg-light rounded-3 p-2">
              <p className="text-secondary fw-semibold text-uppercase mb-0" style={{ fontSize: "0.68rem" }}>Date</p>
              <p className="fw-bold small mb-0">{formatDate(event.eventDate)}</p>
            </div>
          </div>
          <div className="col-6">
            <div className="bg-light rounded-3 p-2">
              <p className="text-secondary fw-semibold text-uppercase mb-0" style={{ fontSize: "0.68rem" }}>Time</p>
              <p className="fw-bold small mb-0">{start ? `${start}${end ? ` – ${end}` : ""}` : "TBA"}</p>
            </div>
          </div>
          <div className="col-6">
            <div className="bg-light rounded-3 p-2">
              <p className="text-secondary fw-semibold text-uppercase mb-0" style={{ fontSize: "0.68rem" }}>Fee</p>
              <p className="fw-bold small mb-0">
                {event.registrationFee > 0 ? `₹${Number(event.registrationFee).toFixed(2)}` : "Free"}
              </p>
            </div>
          </div>
          <div className={`col-6`}>
            <div className={`rounded-3 p-2 ${isFull ? "bg-danger-subtle" : "bg-success-subtle"}`}>
              <p className="text-secondary fw-semibold text-uppercase mb-0" style={{ fontSize: "0.68rem" }}>Seats</p>
              {event.availableSeats != null ? (
                <p className={`fw-bold small mb-0 ${isFull ? "text-danger-emphasis" : "text-success-emphasis"}`}>
                  {isFull ? "Full" : `${event.availableSeats} left`}
                  {event.maxParticipants &&
                    <span className="text-secondary fw-normal"> / {event.maxParticipants}</span>}
                </p>
              ) : (
                <p className="fw-bold small mb-0">Unlimited</p>
              )}
            </div>
          </div>
        </div>

        {/* Seat fill bar */}
        {event.maxParticipants && event.availableSeats != null && (
          <div>
            <div className="progress" style={{ height: 6 }}>
              <div
                className={`progress-bar ${isFull ? "bg-danger" : "bg-success"}`}
                style={{ width: `${Math.max(0, Math.min(100, ((event.maxParticipants - event.availableSeats) / event.maxParticipants) * 100))}%` }}
              />
            </div>
            <p className="text-secondary mt-1 mb-0" style={{ fontSize: "0.7rem" }}>
              {event.maxParticipants - event.availableSeats} / {event.maxParticipants} booked
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      {event.status === "OPEN" && (
        <div className="p-3 pt-0">
          {isLoggedIn ? (
            <button
              disabled={isFull}
              onClick={() => onRegisterClick(event.eventId)}
              className={`btn w-100 btn-sm ${isFull ? "btn-outline-secondary disabled" : "btn-dark"}`}
            >
              {isFull ? "No Seats Available" : "Register Now"}
            </button>
          ) : (
            <button
              onClick={() => onRegisterClick(null)}
              className="btn btn-dark w-100 btn-sm"
            >
              Login to Register
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Events() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  // Menu-driven event type filter — users can only pick from this list,
  // they cannot add to it (that's organizer/admin-only, done from EventForm).
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    eventService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      try {
        // Public fetch — no auth header needed for viewing
        const res = await fetch(`${API_BASE_URL}/events`, {
          headers: isLoggedIn
            ? { Authorization: `Bearer ${getToken()}` }
            : {},
        });
        if (!res.ok) throw new Error("Failed to load events");
        setEvents(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleRegisterClick(eventId) {
    if (!eventId) {
      // Not logged in — redirect to login
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/bookings/events/${eventId}/book`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      showToast("Successfully registered!");
      // Refresh events to update seat count
      const updated = await fetch(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setEvents(await updated.json());
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  const counts = {
    ALL: events.length,
    OPEN: events.filter(e => e.status === "OPEN").length,
    CLOSED: events.filter(e => e.status === "CLOSED").length,
    CANCELLED: events.filter(e => e.status === "CANCELLED").length,
  };
  const filtered = events
    .filter(e => filter === "ALL" || e.status === filter)
    .filter(e => categoryFilter === "ALL" || e.category === categoryFilter);

  return (
    <div className="min-vh-100 bg-light">
      {/* Toast */}
      {toast && (
        <div className={`position-fixed top-0 end-0 m-3 px-4 py-3 rounded-3 shadow text-white fw-semibold small ${
          toast.type === "error" ? "bg-danger" : "bg-success"}`} style={{ zIndex: 1080 }}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="bg-dark text-white px-3 py-5 text-center">
        <h1 className="fs-2 fw-bold mb-2">Events</h1>
        <p className="text-white-50 small mb-0">
          Browse all events below.{" "}
          {isLoggedIn
            ? "Click Register Now to book your seat."
            : <span>
                <button onClick={() => navigate("/login")}
                  className="btn btn-link btn-sm text-white fw-semibold p-0 align-baseline">Login</button>
                {" "}or{" "}
                <button onClick={() => navigate("/register")}
                  className="btn btn-link btn-sm text-white fw-semibold p-0 align-baseline">Register</button>
                {" "}to book a seat.
              </span>
          }
        </p>
      </div>

      <div className="container py-5">
        {/* Stats */}
        {!loading && events.length > 0 && (
          <div className="row g-3 mb-4">
            {[
              { label: "Total Events", value: counts.ALL, color: "" },
              { label: "Open", value: counts.OPEN, color: "text-success" },
              { label: "Closed", value: counts.CLOSED, color: "text-secondary" },
              { label: "Cancelled", value: counts.CANCELLED, color: "text-danger" },
            ].map(s => (
              <div className="col-6 col-md-3" key={s.label}>
                <div className="card border shadow-sm text-center p-3 h-100">
                  <p className={`fs-3 fw-bold mb-0 ${s.color}`}>{s.value}</p>
                  <p className="text-secondary small text-uppercase fw-semibold mb-0 mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {!loading && events.length > 0 && (
          <div className="d-flex gap-2 mb-3 flex-wrap">
            {["ALL","OPEN","CLOSED","CANCELLED"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`btn btn-sm rounded-pill ${filter === f ? "btn-dark" : "btn-outline-secondary"}`}>
                {f === "ALL" ? "All Events" : f.charAt(0) + f.slice(1).toLowerCase()}
                <span className="ms-2 small opacity-75">({counts[f]})</span>
              </button>
            ))}
          </div>
        )}

        {/* Event type (category) menu — menu-driven, view/filter only */}
        {!loading && events.length > 0 && categories.length > 0 && (
          <div className="mb-4" style={{ maxWidth: 260 }}>
            <label className="form-label small text-secondary fw-semibold text-uppercase">
              Event Type
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select form-select-sm"
            >
              <option value="ALL">All Types</option>
              {categories.map(c => (
                <option key={c.categoryId} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary">
            <div className="spinner-border mb-3" role="status" />
            <p className="mb-0">Loading events…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <h3 className="fw-bold mb-2">No events found</h3>
            <p className="small mb-0">
              {filter === "ALL" ? "No events yet. Check back soon!" : `No ${filter.toLowerCase()} events.`}
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map(event => (
              <div className="col-sm-6 col-lg-4" key={event.eventId}>
                <EventCard
                  event={event}
                  isLoggedIn={isLoggedIn}
                  onRegisterClick={handleRegisterClick}
                />
              </div>
            ))}
          </div>
        )}

        {/* Login prompt banner for guests */}
        {!isLoggedIn && events.some(e => e.status === "OPEN") && (
          <div className="mt-4 alert alert-success text-center p-4">
            <p className="fw-semibold fs-5 mb-2">Want to register for an event?</p>
            <p className="small mb-3">Create a free account or login to book your seat instantly.</p>
            <div className="d-flex gap-2 justify-content-center">
              <button onClick={() => navigate("/register")} className="btn btn-dark btn-sm px-4">
                Create Account
              </button>
              <button onClick={() => navigate("/login")} className="btn btn-outline-secondary btn-sm px-4">
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;
