import { useEffect, useState, useCallback } from "react";
import eventService from "../services/eventService";

const STATUS_STYLES = {
  OPEN: "bg-warning-subtle text-warning-emphasis border border-warning-subtle",
  IN_PROGRESS: "bg-primary-subtle text-primary-emphasis border border-primary-subtle",
  RESOLVED: "bg-success-subtle text-success-emphasis border border-success-subtle",
};

const STATUS_LABELS = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved" };

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function StatusPill({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.OPEN;
  return (
    <span className={`badge rounded-pill fw-semibold text-uppercase small ${cls}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ComplaintCard({ complaint, showRaisedBy }) {
  return (
    <div className="border rounded-4 p-3 bg-light">
      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
        <h6 className="fw-bold mb-0">{complaint.subject}</h6>
        <StatusPill status={complaint.status} />
      </div>
      {showRaisedBy && (
        <p className="small text-secondary mb-1">
          From {complaint.raisedByName || complaint.raisedByEmail}
        </p>
      )}
      {complaint.eventName && (
        <p className="small text-secondary mb-1">Event: {complaint.eventName}</p>
      )}
      <p className="small text-body" style={{ whiteSpace: "pre-wrap" }}>{complaint.message}</p>
      {complaint.adminReply && (
        <div className="mt-2 bg-white border rounded-3 p-2">
          <p className="small fw-semibold text-uppercase text-secondary mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
            Admin reply
          </p>
          <p className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>{complaint.adminReply}</p>
        </div>
      )}
      <p className="text-secondary mt-2 mb-0" style={{ fontSize: "0.7rem" }}>{formatDateTime(complaint.createdAt)}</p>
    </div>
  );
}

/**
 * Complaint box shown on the USER dashboard and the ORGANIZER dashboard.
 *
 * - USER role: can raise a complaint (optionally about one of their booked
 * events) and sees their own complaints.
 * - ORGANIZER role: can raise a complaint to admin (optionally about one of
 * their own events), sees their own complaints, AND sees complaints users
 * have raised about their events.
 *
 * Visibility (enforced server-side):
 * - USER complaint -> visible to admin + that event's organizer
 * - ORGANIZER complaint -> visible to admin only
 */
function ComplaintBox({ role }) {
  const isOrganizer = role === "ORGANIZER";

  const [myComplaints, setMyComplaints] = useState([]);
  const [receivedComplaints, setReceivedComplaints] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("mine"); // "mine" | "received" (organizer only)

  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [eventId, setEventId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const mine = await eventService.getMyComplaints();
      setMyComplaints(mine);
      if (isOrganizer) {
        const received = await eventService.getComplaintsForOrganizer();
        setReceivedComplaints(received);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isOrganizer]);

  const loadEventOptions = useCallback(async () => {
    try {
      if (isOrganizer) {
        const events = await eventService.getMyEvents();
        setEventOptions(events.map(e => ({ id: e.eventId, name: e.eventName })));
      } else {
        const bookings = await eventService.getMyBookings();
        const confirmed = bookings.filter(b => b.status === "CONFIRMED");
        const seen = new Set();
        const options = [];
        confirmed.forEach(b => {
          if (!seen.has(b.eventId)) {
            seen.add(b.eventId);
            options.push({ id: b.eventId, name: b.eventName });
          }
        });
        setEventOptions(options);
      }
    } catch {
      // Non-critical — the event dropdown just stays empty if this fails.
    }
  }, [isOrganizer]);

  useEffect(() => { loadComplaints(); loadEventOptions(); }, [loadComplaints, loadEventOptions]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!subject.trim() || !message.trim()) {
      setFormError("Please fill in both subject and message.");
      return;
    }
    setSubmitting(true);
    try {
      await eventService.raiseComplaint({
        subject: subject.trim(),
        message: message.trim(),
        eventId: eventId ? Number(eventId) : null,
      });
      setSubject("");
      setMessage("");
      setEventId("");
      setShowForm(false);
      setToast("Complaint submitted. Our team has been notified by email.");
      setTimeout(() => setToast(""), 4000);
      await loadComplaints();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const list = tab === "received" ? receivedComplaints : myComplaints;

  return (
    <div className="card border shadow-sm rounded-4 p-4 mb-4">
      {toast && (
        <div className="alert alert-success mb-4">{toast}</div>
      )}

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Complaints</h4>
          <p className="small text-secondary mb-0">
            {isOrganizer
              ? "Raise a complaint to admin, or review complaints users have raised about your events."
              : "Raise a complaint about an event or the platform — admin and the organizer will be notified."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="btn btn-dark btn-sm"
        >
          {showForm ? "Cancel" : "+ Raise a Complaint"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-light border rounded-4 p-3 mb-4 d-flex flex-column gap-3">
          {formError && (
            <div className="alert alert-danger mb-0">{formError}</div>
          )}
          <div>
            <label className="form-label small text-secondary fw-semibold text-uppercase">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary of the issue"
              className="form-control"
            />
          </div>
          {eventOptions.length > 0 && (
            <div>
              <label className="form-label small text-secondary fw-semibold text-uppercase">
                Related event (optional)
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="form-select"
              >
                <option value="">— Not about a specific event —</option>
                {eventOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="form-label small text-secondary fw-semibold text-uppercase">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your complaint in detail…"
              rows={4}
              className="form-control"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-dark btn-sm"
            >
              {submitting ? "Submitting…" : "Submit Complaint"}
            </button>
          </div>
        </form>
      )}

      {isOrganizer && (
        <div className="d-flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`btn btn-sm ${tab === "mine" ? "btn-dark" : "btn-outline-secondary"}`}
          >
            My Complaints ({myComplaints.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("received")}
            className={`btn btn-sm ${tab === "received" ? "btn-dark" : "btn-outline-secondary"}`}
          >
            Complaints On My Events ({receivedComplaints.length})
          </button>
        </div>
      )}

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {loading ? (
        <p className="small text-secondary mb-0">Loading complaints…</p>
      ) : list.length === 0 ? (
        <p className="small text-secondary mb-0">
          {tab === "received" ? "No complaints have been raised about your events." : "No complaints raised yet."}
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {list.map(c => (
            <ComplaintCard key={c.id} complaint={c} showRaisedBy={tab === "received"} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ComplaintBox;
