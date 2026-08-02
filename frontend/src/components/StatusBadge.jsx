const STATUS_LABELS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

const STATUS_CLASSES = {
  OPEN: 'bg-success-subtle text-success-emphasis border border-success-subtle',
  CLOSED: 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle',
  CANCELLED: 'bg-danger-subtle text-danger-emphasis border border-danger-subtle',
}

/**
 * Colored pill showing an event's status.
 * @param {{status: 'OPEN'|'CLOSED'|'CANCELLED'}} props
 */
function StatusBadge({ status }) {
  const key = (status || '').toUpperCase()
  const className = `badge rounded-pill fw-semibold text-uppercase small ${STATUS_CLASSES[key] || 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle'}`
  return <span className={className}>{STATUS_LABELS[key] || status}</span>
}

export default StatusBadge
