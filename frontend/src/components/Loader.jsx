/**
 * Full-area loading indicator.
 * @param {{label?: string}} props
 */
function Loader({ label = 'Loading events…' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3 py-5 text-secondary">
      <div className="spinner-border" role="status" style={{ width: "2.25rem", height: "2.25rem" }} />
      <p className="mb-0 small">{label}</p>
    </div>
  )
}

export default Loader
