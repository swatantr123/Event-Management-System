import { Link } from "react-router-dom";

const year = new Date().getFullYear();

const linkGroups = [
  {
    title: "Company",
    links: [
      { label: "Home", to: "/" },
      { label: "About Us", to: "/about" },
      { label: "Events", to: "/events" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", to: "/login" },
      { label: "Register", to: "/register" },
      { label: "Forgot Password", to: "/forgot-password" },
    ],
  },
];

/**
 * Site-wide footer. Rendered once in App.jsx so it appears — unchanged —
 * on every page, including the login screen.
 */
function Footer() {
  return (
    <footer className="mt-auto bg-dark text-white">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <h2 className="fs-4 fw-bold">Event Management System</h2>
            <p className="text-white-50 mt-3 small" style={{ maxWidth: "24rem" }}>
              Discover, host and manage events — from local
              tournaments to large-scale championships — all in one place.
            </p>
          </div>

          {linkGroups.map((group) => (
            <div className="col-6 col-md-2" key={group.title}>
              <h3 className="fw-semibold small text-uppercase text-white-50 mb-3" style={{ letterSpacing: "0.05em" }}>
                {group.title}
              </h3>
              <ul className="list-unstyled d-flex flex-column gap-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-white-50 text-decoration-none small">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-6 col-md-3">
            <h3 className="fw-semibold small text-uppercase text-white-50 mb-3" style={{ letterSpacing: "0.05em" }}>
              Get in touch
            </h3>
            <ul className="list-unstyled d-flex flex-column gap-2 small text-white-50">
              <li>eventmanagement1.team@gmail.com</li>
              <li>Bengaluru, India</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-top border-secondary-subtle">
        <div className="container py-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 small text-white-50">
          <p className="mb-0">© {year} EventManagement System. All rights reserved.</p>
          <p className="mb-0">Made for organizers, players and fans alike.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
