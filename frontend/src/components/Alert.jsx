/**
 * Dismissible banner used to show success or error messages.
 * @param {{type: 'success'|'error', message: string, onClose?: () => void}} props
 */
function Alert({ type = 'success', message, onClose }) {
  if (!message) return null

  const variant = type === 'error' ? 'danger' : 'success'

  return (
    <div className={`alert alert-${variant} d-flex align-items-start justify-content-between gap-3 border shadow-sm`} role="alert">
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Dismiss message"
        />
      )}
    </div>
  )
}

export default Alert
