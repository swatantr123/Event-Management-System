import { useState, useEffect } from 'react'
import { getRole } from '../utils/auth'
import eventService from '../services/eventService'

const EMPTY_EVENT = {
  eventName: '',
  description: '',
  venue: '',
  category: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  maxParticipants: '',
  registrationFee: '',
  status: 'OPEN',
}

/**
 * Validates the form values and returns a { field: message } error map.
 */
function validate(values) {
  const errors = {}

  if (!values.eventName.trim()) {
    errors.eventName = 'Event name is required.'
  } else if (values.eventName.length > 150) {
    errors.eventName = 'Event name must not exceed 150 characters.'
  }

  if (!values.venue.trim()) {
    errors.venue = 'Venue is required.'
  } else if (values.venue.length > 200) {
    errors.venue = 'Venue must not exceed 200 characters.'
  }

  if (!values.category || !values.category.trim()) {
    errors.category = 'Please select an event type.'
  }

  if (!values.eventDate) {
    errors.eventDate = 'Event date is required.'
  }

  if (values.startTime && values.endTime && values.endTime <= values.startTime) {
    errors.endTime = 'End time must be after start time.'
  }

  if (values.maxParticipants !== '' && Number(values.maxParticipants) <= 0) {
    errors.maxParticipants = 'Maximum participants must be a positive number.'
  }

  if (values.registrationFee !== '' && Number(values.registrationFee) < 0) {
    errors.registrationFee = 'Registration fee cannot be negative.'
  }

  return errors
}

/**
 * Shared Create / Edit event form.
 * @param {{
 *   initialValues?: object,
 *   onSubmit: (payload: object) => Promise<void> | void,
 *   submitLabel?: string,
 *   isSubmitting?: boolean,
 *   onCancel?: () => void,
 *   showStatusField?: boolean,
 * }} props
 */
function EventForm({
  initialValues,
  onSubmit,
  submitLabel = 'Save Event',
  isSubmitting = false,
  onCancel,
  showStatusField = true,
}) {
  const [values, setValues] = useState({ ...EMPTY_EVENT, ...initialValues })
  const [errors, setErrors] = useState({})

  // Menu-driven event type / category (Sports, Cultural Fest, Family Function,
  // Comedy, Concert, Get Together, ...). Organizers/admins may add a new
  // option to the menu; regular users never see this form so they can only
  // ever pick from the existing list.
  const role = (getRole() || '').trim().toUpperCase()
  const canAddCategory = role === 'ORGANIZER' || role === 'ADMIN'
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addCategoryError, setAddCategoryError] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function loadCategories() {
      try {
        const data = await eventService.getCategories()
        if (isMounted) setCategories(data)
      } catch {
        // Non-fatal — the select just falls back to an empty menu.
      } finally {
        if (isMounted) setCategoriesLoading(false)
      }
    }
    loadCategories()
    return () => { isMounted = false }
  }, [])

  async function handleAddCategory() {
    const name = newCategoryName.trim()
    if (!name) {
      setAddCategoryError('Enter a category name.')
      return
    }
    setAddingCategory(true)
    setAddCategoryError('')
    try {
      const created = await eventService.createCategory(name)
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setValues((prev) => ({ ...prev, category: created.name }))
      if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }))
      setNewCategoryName('')
      setShowAddCategory(false)
    } catch (err) {
      setAddCategoryError(err.message)
    } finally {
      setAddingCategory(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const payload = {
      eventName: values.eventName.trim(),
      description: values.description.trim() || null,
      venue: values.venue.trim(),
      category: values.category,
      eventDate: values.eventDate,
      startTime: values.startTime || null,
      endTime: values.endTime || null,
      maxParticipants: values.maxParticipants === '' ? null : Number(values.maxParticipants),
      registrationFee: values.registrationFee === '' ? null : Number(values.registrationFee),
      status: values.status,
    }

    await onSubmit(payload)
  }

  return (
    <form className="card border shadow-sm rounded-4 p-4" onSubmit={handleSubmit} noValidate>
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="category">
            Event Type<span className="text-danger ms-1">*</span>
          </label>
          <select
            id="category"
            name="category"
            className={`form-select ${errors.category ? 'is-invalid' : ''}`}
            value={values.category}
            onChange={(e) => {
              if (e.target.value === '__add_new__') {
                setShowAddCategory(true)
                return
              }
              handleChange(e)
            }}
            disabled={categoriesLoading}
          >
            <option value="" disabled>
              {categoriesLoading ? 'Loading event types…' : 'Select an event type'}
            </option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.name}>{c.name}</option>
            ))}
            {canAddCategory && <option value="__add_new__">+ Add new event type…</option>}
          </select>
          {errors.category && <div className="invalid-feedback d-block">{errors.category}</div>}

          {canAddCategory && showAddCategory && (
            <div className="d-flex gap-2 align-items-start mt-2">
              <div className="flex-grow-1">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Wedding, Workshop, Exhibition"
                  value={newCategoryName}
                  maxLength={100}
                  onChange={(e) => { setNewCategoryName(e.target.value); if (addCategoryError) setAddCategoryError('') }}
                />
                {addCategoryError && <div className="invalid-feedback d-block">{addCategoryError}</div>}
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={addingCategory}
                onClick={handleAddCategory}
              >
                {addingCategory ? 'Adding…' : 'Add'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => { setShowAddCategory(false); setNewCategoryName(''); setAddCategoryError('') }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="eventName">
            Event Name<span className="text-danger ms-1">*</span>
          </label>
          <input
            id="eventName"
            name="eventName"
            type="text"
            className={`form-control ${errors.eventName ? 'is-invalid' : ''}`}
            value={values.eventName}
            onChange={handleChange}
            placeholder="e.g. City Marathon 2026"
            maxLength={150}
          />
          {errors.eventName && <div className="invalid-feedback d-block">{errors.eventName}</div>}
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            rows={3}
            value={values.description}
            onChange={handleChange}
            placeholder="Brief details about the event…"
            maxLength={2000}
          />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="venue">
            Venue<span className="text-danger ms-1">*</span>
          </label>
          <input
            id="venue"
            name="venue"
            type="text"
            className={`form-control ${errors.venue ? 'is-invalid' : ''}`}
            value={values.venue}
            onChange={handleChange}
            placeholder="e.g. MG Road, Bengaluru"
            maxLength={200}
          />
          {errors.venue && <div className="invalid-feedback d-block">{errors.venue}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="eventDate">
            Event Date<span className="text-danger ms-1">*</span>
          </label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            className={`form-control ${errors.eventDate ? 'is-invalid' : ''}`}
            value={values.eventDate}
            onChange={handleChange}
          />
          {errors.eventDate && <div className="invalid-feedback d-block">{errors.eventDate}</div>}
        </div>

        {showStatusField && (
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="form-select"
              value={values.status}
              onChange={handleChange}
            >
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}

        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="startTime">
            Start Time
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            className="form-control"
            value={values.startTime}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="endTime">
            End Time
          </label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            className={`form-control ${errors.endTime ? 'is-invalid' : ''}`}
            value={values.endTime}
            onChange={handleChange}
          />
          {errors.endTime && <div className="invalid-feedback d-block">{errors.endTime}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="maxParticipants">
            Maximum Participants
          </label>
          <input
            id="maxParticipants"
            name="maxParticipants"
            type="number"
            min="1"
            className={`form-control ${errors.maxParticipants ? 'is-invalid' : ''}`}
            value={values.maxParticipants}
            onChange={handleChange}
            placeholder="e.g. 100"
          />
          {errors.maxParticipants && (
            <div className="invalid-feedback d-block">{errors.maxParticipants}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="registrationFee">
            Registration Fee (₹)
          </label>
          <input
            id="registrationFee"
            name="registrationFee"
            type="number"
            min="0"
            step="0.01"
            className={`form-control ${errors.registrationFee ? 'is-invalid' : ''}`}
            value={values.registrationFee}
            onChange={handleChange}
            placeholder="e.g. 500.00"
          />
          {errors.registrationFee && (
            <div className="invalid-feedback d-block">{errors.registrationFee}</div>
          )}
        </div>
      </div>

      <div className="d-flex gap-2 mt-4 pt-4 border-top">
        <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default EventForm
