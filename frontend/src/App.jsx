import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import AboutUs from "./pages/AboutUs";
import ForgotPassword from "./pages/ForgotPassword";

// USER — event cards + booking (FR-3.1)
import UserEventList from "./pages/UserEventList";
import UserDashboard from "./pages/UserDashboard";

// ORGANIZER — event management (Module 6.2)
import EventList from "./pages/EventList";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import OrganizerComplaints from "./pages/OrganizerComplaints";

// ADMIN — user management (FR-6.1) + reports (FR-6.2)
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminReports from "./pages/AdminReports";
import AdminVenueDetails from "./pages/AdminVenueDetails";

// Complaints — admin view of every complaint raised by users/organizers
import AdminComplaints from "./pages/AdminComplaints";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-vh-100 d-flex flex-column">
        <Navbar />
        <div className="flex-grow-1">
          <Routes>
        {/* Public */}
        <Route path="/"                 element={<Home />} />
        <Route path="/login"            element={<Login />} />
        <Route path="/register"         element={<Register />} />
        <Route path="/events"           element={<Events />} />
        <Route path="/about"            element={<AboutUs />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />

        {/* USER — dashboard (profile + registered events) */}
        <Route path="/user/dashboard" element={
          <ProtectedRoute><UserDashboard /></ProtectedRoute>
        } />

        {/* USER — browse & book events (FR-3.1) */}
        <Route path="/user/events" element={
          <ProtectedRoute><UserEventList /></ProtectedRoute>
        } />

        {/* ORGANIZER — CRUD events (Module 6.2) */}
        <Route path="/events/manage" element={
          <ProtectedRoute><EventList /></ProtectedRoute>
        } />
        <Route path="/events/create" element={
          <ProtectedRoute><CreateEvent /></ProtectedRoute>
        } />
        <Route path="/events/edit/:id" element={
          <ProtectedRoute><EditEvent /></ProtectedRoute>
        } />
        <Route path="/events/complaints" element={
          <ProtectedRoute><OrganizerComplaints /></ProtectedRoute>
        } />

        {/* ADMIN — user management (FR-6.1) */}
        <Route path="/admin/users" element={
          <ProtectedRoute><AdminUserManagement /></ProtectedRoute>
        } />

        {/* ADMIN — system reports (FR-6.2) */}
        <Route path="/admin/reports" element={
          <ProtectedRoute><AdminReports /></ProtectedRoute>
        } />

        {/* ADMIN — venue-wise events, organizer & user details */}
        <Route path="/admin/venues" element={
          <ProtectedRoute><AdminVenueDetails /></ProtectedRoute>
        } />

        {/* ADMIN — complaints raised by users & organizers */}
        <Route path="/admin/complaints" element={
          <ProtectedRoute><AdminComplaints /></ProtectedRoute>
        } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
