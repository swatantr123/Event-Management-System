import axios from "axios";
import { getToken } from "../utils/auth";
import { API_BASE_URL as BASE_URL } from "../config";

function getHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeError(error) {
  if (error.response?.data)
    return { status: error.response.status,
             message: error.response.data.message || error.response.data.error || "Something went wrong." };
  if (error.request)
    return { status: null, message: "Unable to reach the server. Please check that the backend is running and reachable." };
  return { status: null, message: error.message || "An unexpected error occurred." };
}

const eventService = {
  async getAllEvents() {
    try { return (await axios.get(`${BASE_URL}/events`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async getMyEvents() {
    try { return (await axios.get(`${BASE_URL}/events/my`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async getEventById(id) {
    try { return (await axios.get(`${BASE_URL}/events/${id}`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async createEvent(data) {
    try { return (await axios.post(`${BASE_URL}/events`, data, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async updateEvent(id, data) {
    try { return (await axios.put(`${BASE_URL}/events/${id}`, data, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async deleteEvent(id) {
    try { await axios.delete(`${BASE_URL}/events/${id}`, { headers: getHeaders() }); }
    catch (e) { throw normalizeError(e); }
  },
  // Menu-driven event categories (Sports, Cultural Fest, Family Function,
  // Comedy, Concert, Get Together, ...). Everyone can read the list;
  // only organizers/admins are allowed to add a new one (enforced server-side).
  async getCategories() {
    try { return (await axios.get(`${BASE_URL}/categories`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async createCategory(name) {
    try { return (await axios.post(`${BASE_URL}/categories`, { name }, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  // numberOfTickets: how many seats/tickets the user wants for this event.
  // Price on the backend is registrationFee * numberOfTickets.
  async bookSeat(eventId, numberOfTickets = 1) {
    try { return (await axios.post(`${BASE_URL}/bookings/events/${eventId}/book`, { numberOfTickets }, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async cancelBooking(eventId) {
    try { return (await axios.delete(`${BASE_URL}/bookings/events/${eventId}/cancel`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async getMyBookings() {
    try { return (await axios.get(`${BASE_URL}/bookings/my`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  // Feature 3: organizer dashboard — who has registered for one of my events
  async getEventRegistrations(eventId) {
    try { return (await axios.get(`${BASE_URL}/bookings/events/${eventId}`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async getAllUsers() {
    try { return (await axios.get(`${BASE_URL}/admin/users`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async getPendingUsers() {
    try { return (await axios.get(`${BASE_URL}/admin/users/pending`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async approveUser(id) {
    try { return (await axios.patch(`${BASE_URL}/admin/users/${id}/approve`, {}, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async rejectUser(id) {
    try { await axios.delete(`${BASE_URL}/admin/users/${id}/reject`, { headers: getHeaders() }); }
    catch (e) { throw normalizeError(e); }
  },
  async updateUserStatus(id, status) {
    try { return (await axios.patch(`${BASE_URL}/admin/users/${id}/status`, { status }, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  async updateUserRole(id, role) {
    try { return (await axios.patch(`${BASE_URL}/admin/users/${id}/role`, { role }, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  // Feature 5: user deletion removed — no deleteUser call exists anymore.

  // Feature 6: fetch a user's uploaded verification PDF as a blob URL so
  // admin can view/download it before approving.
  async getUserDocument(id) {
    try {
      const res = await axios.get(`${BASE_URL}/admin/users/${id}/document`, {
        headers: getHeaders(),
        responseType: "blob",
      });
      return URL.createObjectURL(res.data);
    } catch (e) { throw normalizeError(e); }
  },
  async getAdminReport() {
    try { return (await axios.get(`${BASE_URL}/admin/reports`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },

  // Feature: Complaints — a USER or ORGANIZER raises one, optionally tied
  // to a specific event. Visible to admin, and to the event's organizer too
  // when raised by a user.
  async raiseComplaint(data) {
    try { return (await axios.post(`${BASE_URL}/complaints`, data, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  // Complaints raised by the logged-in user/organizer themselves.
  async getMyComplaints() {
    try { return (await axios.get(`${BASE_URL}/complaints/my`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  // Organizer: complaints raised by users about the organizer's own events.
  async getComplaintsForOrganizer() {
    try { return (await axios.get(`${BASE_URL}/complaints/for-organizer`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  // Admin: every complaint raised by anyone.
  async getAllComplaints() {
    try { return (await axios.get(`${BASE_URL}/complaints`, { headers: getHeaders() })).data; }
    catch (e) { throw normalizeError(e); }
  },
  // Admin: change a complaint's status and/or leave a reply.
  async updateComplaintStatus(id, status, adminReply) {
    try {
      return (await axios.patch(`${BASE_URL}/complaints/${id}/status`, { status, adminReply }, { headers: getHeaders() })).data;
    } catch (e) { throw normalizeError(e); }
  },
};

export default eventService;
