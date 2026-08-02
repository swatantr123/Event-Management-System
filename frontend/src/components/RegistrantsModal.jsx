/**
 * Shows the list of users registered for one event. Renders nothing when
 * isOpen is false. Data (registrants/isLoading/errorMessage) is fetched by
 * the parent so this component just displays it.
 * @param {{
 *   isOpen: boolean,
 *   eventName: string,
 *   registrants: Array<{ bookingId: number, userName: string, userEmail: string, bookedAt: string }>,
 *   isLoading: boolean,
 *   errorMessage: string,
 *   onClose: () => void,
 * }} props
 */
function RegistrantsModal({ isOpen, eventName, registrants, isLoading, errorMessage, onClose }) {
  if (!isOpen) return null

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 p-3"
      style={{ zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="card border-0 shadow-sm rounded-4 p-4 w-100"
        style={{ maxWidth: 620 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="registrants-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h5 id="registrants-modal-title" className="fw-bold mb-3">Registered users — {eventName}</h5>

        {isLoading ? (
          <p className="text-secondary">Loading registrants…</p>
        ) : errorMessage ? (
          <p className="text-danger">{errorMessage}</p>
        ) : registrants.length === 0 ? (
          <p className="text-secondary">No one has registered for this event yet.</p>
        ) : (
          <div className="table-responsive mb-4" style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Tickets</th>
                  <th>Amount</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {registrants.map((r) => (
                  <tr key={r.bookingId}>
                    <td className="fw-semibold">{r.userName || '—'}</td>
                    <td className="text-secondary small">{r.userEmail}</td>
                    <td className="text-secondary small">{r.numberOfTickets || 1}</td>
                    <td className="text-secondary small">
                      {r.totalAmount != null && Number(r.totalAmount) > 0
                        ? `₹${Number(r.totalAmount).toFixed(2)}`
                        : 'Free'}
                    </td>
                    <td className="text-secondary small">
                      {r.bookedAt ? new Date(r.bookedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegistrantsModal
