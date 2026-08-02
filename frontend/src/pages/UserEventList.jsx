import { getUserName } from "../utils/auth";
import { useEffect, useState, useCallback } from "react";
import eventService from "../services/eventService";

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

function EventCard({ event, myBookings, onBook, onCancel, loading }) {
  const statusClass = STATUS_STYLES[event.status] || STATUS_STYLES.OPEN;
  const start = formatTime(event.startTime);
  const end = formatTime(event.endTime);
  const myBooking = myBookings.find(b => b.eventId === event.eventId && b.status === "CONFIRMED");
  const booked = !!myBooking;
  const isFull = event.availableSeats != null && event.availableSeats <= 0;

  // Feature: one user can book multiple tickets for the same event —
  // price scales as fee * ticketCount. Capped by whatever seats remain.
  const maxTickets = event.availableSeats != null ? Math.max(1, event.availableSeats) : 10;
  const [ticketCount, setTicketCount] = useState(1);
  const fee = Number(event.registrationFee) || 0;
  const totalPrice = fee * ticketCount;

  function updateTicketCount(next) {
    setTicketCount(Math.min(Math.max(1, next), maxTickets));
  }

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
              <p className="text-secondary fw-semibold text-uppercase mb-0" style={{ fontSize: "0.68rem" }}>
                {fee > 0 && !booked && event.status === "OPEN" ? `Total (x${ticketCount})` : "Fee"}
              </p>
              <p className="fw-bold small mb-0">
                {fee > 0
                  ? `₹${(booked ? (myBooking.totalAmount ?? fee * (myBooking.numberOfTickets || 1)) : totalPrice).toFixed(2)}`
                  : "Free"}
              </p>
            </div>
          </div>
          {/* FR-3.1 — live seat count */}
          <div className="col-6">
            <div className={`rounded-3 p-2 ${isFull ? "bg-danger-subtle" : "bg-success-subtle"}`}>
              <p className="text-secondary fw-semibold text-uppercase mb-0" style={{ fontSize: "0.68rem" }}>Seats</p>
              {event.availableSeats != null ? (
                <p className={`fw-bold small mb-0 ${isFull ? "text-danger-emphasis" : "text-success-emphasis"}`}>
                  {isFull ? "Full" : `${event.availableSeats} left`}
                  {event.maxParticipants && <span className="text-secondary fw-normal"> / {event.maxParticipants}</span>}
                </p>
              ) : (
                <p className="fw-bold small mb-0">Unlimited</p>
              )}
            </div>
          </div>
        </div>

        {/* Seat bar */}
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

      {/* Action buttons */}
      {event.status === "OPEN" && (
        <div className="p-3 pt-0 d-flex flex-column gap-2">
          {booked ? (
            <div className="d-flex gap-2">
              <div className="flex-grow-1 py-2 bg-success-subtle text-success-emphasis fw-semibold rounded-3 text-center small">
                Registered{myBooking.numberOfTickets > 1 ? ` · ${myBooking.numberOfTickets} tickets` : ""}
              </div>
              <button
                disabled={loading === event.eventId}
                onClick={() => onCancel(event.eventId)}
                className="btn btn-outline-danger btn-sm"
              >
                {loading === event.eventId ? "..." : "Cancel"}
              </button>
            </div>
          ) : (
            <>
              {!isFull && (
                <div className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2">
                  <span className="small text-secondary fw-semibold text-uppercase">Tickets</span>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      disabled={ticketCount <= 1}
                      onClick={() => updateTicketCount(ticketCount - 1)}
                      className="btn btn-outline-secondary btn-sm py-0 px-2"
                    >
                      −
                    </button>
                    <span className="fw-bold small" style={{ width: 24, textAlign: "center", display: "inline-block" }}>{ticketCount}</span>
                    <button
                      type="button"
                      disabled={ticketCount >= maxTickets}
                      onClick={() => updateTicketCount(ticketCount + 1)}
                      className="btn btn-outline-secondary btn-sm py-0 px-2"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              <button
                disabled={isFull || loading === event.eventId}
                onClick={() => onBook(event.eventId, ticketCount)}
                className={`btn btn-sm ${isFull ? "btn-outline-secondary disabled" : "btn-dark"}`}
              >
                {loading === event.eventId
                  ? "Processing..."
                  : isFull
                  ? "No Seats Available"
                  : fee > 0
                  ? `Register Now · ₹${totalPrice.toFixed(2)}`
                  : "Register Now"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function UserEventList() {
  const [events, setEvents] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("ALL");
  // Menu-driven event type filter — users pick from the list, they cannot add to it.
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    eventService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const userName = getUserName() || "there";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [evts, bookings] = await Promise.all([
        eventService.getAllEvents(),
        eventService.getMyBookings(),
      ]);
      setEvents(evts);
      setMyBookings(bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleBook(eventId, ticketCount = 1) {
    setActionLoading(eventId);
    try {
      await eventService.bookSeat(eventId, ticketCount);
      showToast(
        ticketCount > 1
          ? `Successfully booked ${ticketCount} tickets!`
          : "Successfully registered for event!"
      );
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(eventId) {
    setActionLoading(eventId);
    try {
      await eventService.cancelBooking(eventId);
      showToast("Booking cancelled.");
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = events
    .filter(e => filter === "ALL" || e.status === filter)
    .filter(e => categoryFilter === "ALL" || e.category === categoryFilter);
  const counts = {
    ALL: events.length,
    OPEN: events.filter(e => e.status === "OPEN").length,
    CLOSED: events.filter(e => e.status === "CLOSED").length,
    CANCELLED: events.filter(e => e.status === "CANCELLED").length,
  };
  const myConfirmed = myBookings.filter(b => b.status === "CONFIRMED").length;

  return (
    <div className="min-vh-100 bg-light">
      {/* Toast */}
      {toast && (
        <div className={`position-fixed top-0 end-0 m-3 px-4 py-3 rounded-3 shadow text-white fw-semibold small ${
          toast.type === "error" ? "bg-danger" : "bg-success"
        }`} style={{ zIndex: 1080 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-dark text-white px-4 py-3 d-flex align-items-center justify-content-between">
        <div>
          <h1 className="fs-3 fw-bold mb-0">Events</h1>
          <p className="text-white-50 small mt-1 mb-0">
            Welcome, {userName} · {myConfirmed} active registration{myConfirmed !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="container py-5">
        {/* Stats */}
        {!loading && events.length > 0 && (
          <div className="row g-3 mb-4">
            {[
              { label: "Total Events", value: counts.ALL, color: "" },
              { label: "Open", value: counts.OPEN, color: "text-success" },
              { label: "My Registrations", value: myConfirmed, color: "text-primary" },
              { label: "Closed/Cancelled", value: counts.CLOSED + counts.CANCELLED, color: "text-secondary" },
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
            {["ALL", "OPEN", "CLOSED", "CANCELLED"].map(f => (
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

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary">
            <div className="spinner-border mb-3" role="status" />
            <p className="mb-0">Loading events…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <h3 className="fw-bold mb-2">No events found</h3>
            <p className="small mb-0">{filter === "ALL" ? "No events yet. Check back soon!" : `No ${filter.toLowerCase()} events.`}</p>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map(event => (
              <div className="col-sm-6 col-lg-4" key={event.eventId}>
                <EventCard event={event} myBookings={myBookings}
                  onBook={handleBook} onCancel={handleCancel} loading={actionLoading} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserEventList;
