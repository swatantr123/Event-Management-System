import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, getRole, getUserName, clearAuth } from "../utils/auth";
import ThemeToggle from "./ThemeToggle";

// A little warmth for the returning visitor, based on time of day.
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const role = (getRole() || "").trim().toUpperCase();
  const userName = getUserName();

  // Bug fix: every logged-in role clicking "Events" lands on the shared
  // /user/events browsing page. Organizers manage their own events
  // separately via the "Dashboard" link (/events/manage) below.
  let eventsPath = "/events";
  if (loggedIn) {
    if (role === "USER" || role === "ORGANIZER") eventsPath = "/user/events";
    // ADMIN falls back to the public /events page
  }

  // Dashboard destination differs per role — every logged-in role gets one.
  let dashboardPath = "/user/dashboard";
  if (role === "ORGANIZER") dashboardPath = "/events/manage";
  else if (role === "ADMIN") dashboardPath = "/admin/users";

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  const initial = userName ? userName.trim().charAt(0).toUpperCase() : "?";

  return (
    <nav className="navbar navbar-expand-md bg-white border-bottom px-3 px-md-4 py-3">
      <div className="d-flex align-items-center gap-4 flex-wrap">
        <Link to="/" className="text-decoration-none fw-semibold text-dark">Home</Link>
        <Link to="/about" className="text-decoration-none fw-semibold text-dark">About Us</Link>
        <Link to={eventsPath} className="text-decoration-none fw-semibold text-dark">Events</Link>
        {loggedIn && (
          <Link to={dashboardPath} className="text-decoration-none fw-semibold text-dark">Dashboard</Link>
        )}
      </div>

      <div className="ms-auto d-flex align-items-center gap-3">
        {loggedIn ? (
          <>
            <ThemeToggle />
            <span className="text-secondary small text-nowrap d-none d-sm-inline">
              {greeting()}{userName ? `, ${userName.split(" ")[0]}` : ""}
            </span>
            <div
              title={userName || "Your account"}
              className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
              style={{ width: 34, height: 34, fontSize: "0.9rem" }}
            >
              {initial}
            </div>
            <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm">
              Log out
            </button>
          </>
        ) : (
          <>
            <ThemeToggle />
            <Link to="/login" className="btn btn-dark btn-sm">
              Log in / Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
