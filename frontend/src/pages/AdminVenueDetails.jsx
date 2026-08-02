import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import eventService from "../services/eventService";

const STATUS_COLORS = { OPEN: "bg-success-subtle text-success-emphasis", CLOSED: "bg-secondary-subtle text-secondary-emphasis", CANCELLED: "bg-danger-subtle text-danger-emphasis" };

function AdminVenueDetails() {
  const [venueDetails, setVenueDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedVenue, setExpandedVenue] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);

  // Per-event registrant list, fetched on demand and cached: { [eventId]: BookingResponseDTO[] }
  const [eventUsers, setEventUsers] = useState({});
  const [usersLoadingId, setUsersLoadingId] = useState(null);
  const [usersError, setUsersError] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const report = await eventService.getAdminReport();
        setVenueDetails(report?.venueDetails || []);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function toggleEvent(eventId) {
    if (expandedEvent === eventId) { setExpandedEvent(null); return; }
    setExpandedEvent(eventId);
    if (eventUsers[eventId]) return; // already fetched
    setUsersLoadingId(eventId);
    try {
      const regs = await eventService.getEventRegistrations(eventId);
      setEventUsers(prev => ({ ...prev, [eventId]: regs }));
    } catch (e) {
      setUsersError(prev => ({ ...prev, [eventId]: e.message }));
    } finally {
      setUsersLoadingId(null);
    }
  }

  if (loading) return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <div className="spinner-border" role="status" />
    </div>
  );

  const totalVenues = venueDetails.length;
  const totalEvents = venueDetails.reduce((s, v) => s + v.eventCount, 0);
  const totalOrganizers = new Set(
    venueDetails.flatMap(v => (v.events || []).map(e => e.createdBy)).filter(Boolean)
  ).size;
  const totalUsers = venueDetails.reduce((s, v) => s + v.totalUsers, 0);

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-dark text-white px-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h1 className="fs-3 fw-bold mb-0">Venue & Organizer Details</h1>
          <p className="text-white-50 small mt-1 mb-0">Which organizers and how many users are at every event, venue by venue</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/admin/users" className="btn btn-light btn-sm fw-semibold">Users</Link>
          <Link to="/admin/reports" className="btn btn-light btn-sm fw-semibold">Reports</Link>
          <Link to="/admin/complaints" className="btn btn-light btn-sm fw-semibold">Complaints</Link>
        </div>
      </div>

      <div className="container py-5 d-flex flex-column gap-4">
        {error && <div className="alert alert-danger mb-0">{error}</div>}

        {/* Overview stats */}
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="card border shadow-sm text-center p-4 h-100">
              <p className="fs-2 fw-bold mb-0">{totalVenues}</p>
              <p className="text-secondary small text-uppercase fw-semibold mb-0 mt-1">Venues</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border shadow-sm text-center p-4 h-100">
              <p className="fs-2 fw-bold text-primary mb-0">{totalEvents}</p>
              <p className="text-secondary small text-uppercase fw-semibold mb-0 mt-1">Events</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border shadow-sm text-center p-4 h-100">
              <p className="fs-2 fw-bold mb-0">{totalOrganizers}</p>
              <p className="text-secondary small text-uppercase fw-semibold mb-0 mt-1">Organizers</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border shadow-sm text-center p-4 h-100">
              <p className="fs-2 fw-bold text-success mb-0">{totalUsers}</p>
              <p className="text-secondary small text-uppercase fw-semibold mb-0 mt-1">Users Booked</p>
            </div>
          </div>
        </div>

        {/* Venue-wise breakdown */}
        {venueDetails.length === 0 ? (
          <div className="card border shadow-sm p-5 text-center text-secondary">No venues yet</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {venueDetails.map(v => {
              const isVenueOpen = expandedVenue === v.venue;
              return (
                <div key={v.venue} className="card border shadow-sm rounded-4 overflow-hidden">
                  <button
                    onClick={() => setExpandedVenue(isVenueOpen ? null : v.venue)}
                    className="btn w-100 d-flex align-items-center justify-content-between px-4 py-3 text-start border-0 rounded-0"
                  >
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      <span className="fw-bold text-truncate">{v.venue}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis fw-bold">
                        {v.eventCount} event{v.eventCount === 1 ? "" : "s"}
                      </span>
                      <span className="badge rounded-pill bg-dark-subtle text-dark-emphasis fw-bold">
                        {v.organizerCount} organizer{v.organizerCount === 1 ? "" : "s"}
                      </span>
                      <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-bold">
                        {v.totalUsers} user{v.totalUsers === 1 ? "" : "s"}
                      </span>
                      <span className="text-secondary" style={{ transform: isVenueOpen ? "rotate(180deg)" : "none", display: "inline-block" }}>▼</span>
                    </div>
                  </button>

                  {isVenueOpen && (
                    <div className="border-top">
                      {(v.events || []).map((e, i) => {
                        const isEventOpen = expandedEvent === e.eventId;
                        const regs = eventUsers[e.eventId];
                        return (
                          <div key={e.eventId} className={i > 0 ? "border-top" : ""}>
                            <button
                              onClick={() => toggleEvent(e.eventId)}
                              className="btn w-100 d-flex align-items-center justify-content-between px-4 py-2 text-start border-0 rounded-0"
                            >
                              <div className="text-truncate">
                                <p className="fw-semibold mb-0 text-truncate">{e.eventName}</p>
                                <p className="small text-secondary mt-1 mb-0">
                                  Organizer: <span className="fw-medium">{e.createdBy || "—"}</span>
                                  {e.category && <>&nbsp;· {e.category}</>}
                                  {e.eventDate && <>&nbsp;· {e.eventDate}</>}
                                </p>
                              </div>
                              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                <span className={`badge rounded-pill fw-bold ${STATUS_COLORS[e.status] || "bg-secondary-subtle text-secondary-emphasis"}`}>{e.status}</span>
                                <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-bold">
                                  {e.userCount} user{e.userCount === 1 ? "" : "s"}
                                </span>
                                <span className="text-secondary" style={{ transform: isEventOpen ? "rotate(180deg)" : "none", display: "inline-block" }}>▼</span>
                              </div>
                            </button>

                            {isEventOpen && (
                              <div className="px-4 pb-3 bg-light">
                                {usersLoadingId === e.eventId ? (
                                  <p className="small text-secondary py-3 mb-0">Loading users…</p>
                                ) : usersError[e.eventId] ? (
                                  <p className="small text-danger py-3 mb-0">{usersError[e.eventId]}</p>
                                ) : !regs || regs.length === 0 ? (
                                  <p className="small text-secondary py-3 mb-0">No users have booked this event yet.</p>
                                ) : (
                                  <div className="table-responsive mt-2 border rounded-3 bg-white">
                                    <table className="table table-hover align-middle mb-0">
                                      <thead className="table-light">
                                        <tr>
                                          {["User", "Email", "Tickets", "Status", "Booked At"].map(h => (
                                            <th key={h} className="small text-uppercase text-secondary">{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {regs.map(r => (
                                          <tr key={r.bookingId}>
                                            <td className="fw-medium">{r.userName || "—"}</td>
                                            <td className="text-secondary">{r.userEmail}</td>
                                            <td className="text-center">{r.numberOfTickets ?? 1}</td>
                                            <td>
                                              <span className={`badge rounded-pill fw-bold ${
                                                r.status === "CONFIRMED" ? "bg-success-subtle text-success-emphasis" : "bg-danger-subtle text-danger-emphasis"
                                              }`}>{r.status}</span>
                                            </td>
                                            <td className="text-secondary small">
                                              {r.bookedAt ? new Date(r.bookedAt).toLocaleString("en-IN") : "—"}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminVenueDetails;
