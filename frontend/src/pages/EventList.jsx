import { getRole } from "../utils/auth";
import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import eventService from '../services/eventService'
import Alert from '../components/Alert'
import Loader from '../components/Loader'
import ConfirmModal from '../components/ConfirmModal'
import RegistrantsModal from '../components/RegistrantsModal'
import StatusBadge from '../components/StatusBadge'

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(hhmm) {
  if (!hhmm) return '—'
  const [h, m] = hhmm.split(':')
  const date = new Date()
  date.setHours(Number(h), Number(m))
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function formatFee(fee) {
  if (fee === null || fee === undefined) return '—'
  return `₹${Number(fee).toFixed(2)}`
}

function EventList() {
  const location = useLocation()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Feature 3: registered-users modal
  const [registrantsEvent, setRegistrantsEvent] = useState(null)
  const [registrants, setRegistrants] = useState([])
  const [registrantsLoading, setRegistrantsLoading] = useState(false)
  const [registrantsError, setRegistrantsError] = useState('')

  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const role = (getRole() || "").trim().toUpperCase()
      const data = role === "ADMIN" ? await eventService.getAllEvents() : await eventService.getMyEvents()
      setEvents(data)
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
    // Clear any "success" state passed via navigation so it doesn't reappear on refresh
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleDeleteClick(event) {
    setDeleteTarget(event)
  }

  // Feature 3: show who has registered for this event
  async function handleViewRegistrants(event) {
    setRegistrantsEvent(event)
    setRegistrantsLoading(true)
    setRegistrantsError('')
    try {
      const data = await eventService.getEventRegistrations(event.eventId)
      setRegistrants(data.filter((b) => b.status === 'CONFIRMED'))
    } catch (err) {
      setRegistrantsError(err.message)
    } finally {
      setRegistrantsLoading(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await eventService.deleteEvent(deleteTarget.eventId)
      setSuccessMessage(`"${deleteTarget.eventName}" was deleted successfully.`)
      setDeleteTarget(null)
      await loadEvents()
    } catch (err) {
      setErrorMessage(err.message)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const stats = {
    total: events.length,
    open: events.filter((e) => e.status === 'OPEN').length,
    closed: events.filter((e) => e.status === 'CLOSED').length,
    cancelled: events.filter((e) => e.status === 'CANCELLED').length,
    registrations: events.reduce((sum, e) => sum + Number(e.registeredCount || 0), 0),
  }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-end justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Event Roster</h1>
          <p className="text-secondary mb-0">
            Create, review, and manage every sports event on the calendar.
          </p>
        </div>
        <div className="d-flex gap-2">
          {(getRole() || '').trim().toUpperCase() === 'ORGANIZER' && (
            <Link to="/events/complaints" className="btn btn-outline-secondary">
              Complaints
            </Link>
          )}
          <Link to="/events/create" className="btn btn-dark">
            + Create Event
          </Link>
        </div>
      </div>

      <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />

      {!isLoading && events.length > 0 && (
        <div className="row g-0 border rounded-4 overflow-hidden mb-4 text-center bg-white">
          <div className="col-6 col-md border-end border-bottom border-md-bottom-0 p-3">
            <div className="fs-3 fw-bold">{stats.total}</div>
            <div className="small text-secondary text-uppercase">Total Events</div>
          </div>
          <div className="col-6 col-md border-end border-bottom border-md-bottom-0 p-3">
            <div className="fs-3 fw-bold">{stats.open}</div>
            <div className="small text-secondary text-uppercase">Open</div>
          </div>
          <div className="col-6 col-md border-end p-3">
            <div className="fs-3 fw-bold">{stats.closed}</div>
            <div className="small text-secondary text-uppercase">Closed</div>
          </div>
          <div className="col-6 col-md border-end p-3">
            <div className="fs-3 fw-bold">{stats.cancelled}</div>
            <div className="small text-secondary text-uppercase">Cancelled</div>
          </div>
          <div className="col-12 col-md p-3">
            <div className="fs-3 fw-bold">{stats.registrations}</div>
            <div className="small text-secondary text-uppercase">Total Registrations</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader label="Loading events…" />
      ) : events.length === 0 ? (
        <div className="border rounded-4 shadow-sm text-center py-5 px-3">
          <h3 className="fw-bold mb-2">No events yet</h3>
          <p className="text-secondary mb-3">Get the calendar started by creating your first sports event.</p>
          <Link to="/events/create" className="btn btn-dark">
            + Create Event
          </Link>
        </div>
      ) : (
        <div className="table-responsive border rounded-4 shadow-sm">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Time</th>
                <th>Fee</th>
                <th>Capacity</th>
                <th>Registered</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.eventId}>
                  <td className="fw-semibold">{event.eventName}</td>
                  <td className="text-secondary small">{event.category || '—'}</td>
                  <td>{event.venue}</td>
                  <td>{formatDate(event.eventDate)}</td>
                  <td className="text-secondary small">
                    {formatTime(event.startTime)} – {formatTime(event.endTime)}
                  </td>
                  <td>{formatFee(event.registrationFee)}</td>
                  <td>
                    {event.maxParticipants ?? '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handleViewRegistrants(event)}
                      title="View who has registered for this event"
                    >
                      {event.registeredCount ?? 0}
                    </button>
                  </td>
                  <td>
                    <StatusBadge status={event.status} />
                  </td>
                  <td>
                    <div className="d-flex gap-2 justify-content-end">
                      <Link
                        to={`/events/edit/${event.eventId}`}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteClick(event)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete this event?"
        message={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.eventName}" from the roster. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Event"
        isProcessing={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <RegistrantsModal
        isOpen={!!registrantsEvent}
        eventName={registrantsEvent?.eventName || ''}
        registrants={registrants}
        isLoading={registrantsLoading}
        errorMessage={registrantsError}
        onClose={() => setRegistrantsEvent(null)}
      />
    </div>
  )
}

export default EventList
