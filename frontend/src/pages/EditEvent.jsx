import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import eventService from '../services/eventService'
import EventForm from '../components/EventForm'
import Alert from '../components/Alert'
import Loader from '../components/Loader'

function EditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [initialValues, setInitialValues] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadEvent() {
      setIsLoading(true)
      setLoadError('')
      try {
        const event = await eventService.getEventById(id)
        if (isMounted) {
          setInitialValues({
            eventName: event.eventName || '',
            description: event.description || '',
            venue: event.venue || '',
            category: event.category || '',
            eventDate: event.eventDate || '',
            startTime: event.startTime || '',
            endTime: event.endTime || '',
            maxParticipants: event.maxParticipants ?? '',
            registrationFee: event.registrationFee ?? '',
            status: event.status || 'OPEN',
          })
        }
      } catch (err) {
        if (isMounted) setLoadError(err.message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadEvent()
    return () => {
      isMounted = false
    }
  }, [id])

  async function handleSubmit(payload) {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const updated = await eventService.updateEvent(id, payload)
      navigate('/', {
        state: { successMessage: `"${updated.eventName}" was updated successfully.` },
      })
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-end justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Edit Event</h1>
          <p className="text-secondary mb-0">Update the event details and save your changes.</p>
        </div>
        <Link to="/events/manage" className="btn btn-outline-secondary">
          Back to Events
        </Link>
      </div>

      {loadError && <Alert type="error" message={loadError} />}
      <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />

      {isLoading ? (
        <Loader label="Loading event details…" />
      ) : initialValues ? (
        <EventForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
          onCancel={() => navigate('/events/manage')}
        />
      ) : null}
    </div>
  )
}

export default EditEvent
