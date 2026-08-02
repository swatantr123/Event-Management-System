import { Link } from 'react-router-dom'
import ComplaintBox from '../components/ComplaintBox'

/**
 * Standalone Complaints page for organizers. Reached via the "Complaints"
 * button on the Event Roster page, instead of showing the complaint box
 * inline on every visit to that page.
 */
function OrganizerComplaints() {
  return (
    <div className="container py-5">
      <div className="d-flex align-items-end justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Complaints</h1>
          <p className="text-secondary mb-0">
            Raise a complaint to admin, or review complaints users have raised about your events.
          </p>
        </div>
        <Link to="/events/manage" className="btn btn-outline-secondary">
          Back to Events
        </Link>
      </div>

      <ComplaintBox role="ORGANIZER" />
    </div>
  )
}

export default OrganizerComplaints
