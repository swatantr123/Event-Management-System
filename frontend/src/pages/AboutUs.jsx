const team = [
  { name: "Divyansh Verma", role: "Project Engineer (Project Mentor)" },
  { name: "Swatantra Singh", role: "Project Lead/Backend Developer" },
  { name: "Nikhil Halade", role: "Backend Developer" },
  { name: "Shailendra Singh", role: "FrontEnd Developer" },
  { name: "Omkar Savant", role: "FrontEnd Developer" },
  { name: "Tushar Bargah", role: "Database" },
];

function AboutUs() {
  return (
    <div className="bg-white">

      {/* HERO */}
      <section className="py-5 border-bottom">
        <div className="container py-5 text-center">
          <h1 className="display-4 fw-bold mb-3">About EventSphere</h1>
          <p className="fs-5 text-secondary mx-auto" style={{ maxWidth: "40rem" }}>
            Connecting people through unforgettable events, experiences and communities.
          </p>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="py-5">
        <div className="container py-4">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <img
                src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200"
                alt="About"
                className="img-fluid rounded-4 shadow-sm w-100"
              />
            </div>
            <div className="col-lg-6">
              <h2 className="fw-bold mb-4">Who We Are</h2>
              <p className="fs-5 text-secondary">
                EventSphere is a modern event management platform
                designed to help people discover, organize and
                participate in exciting events.
              </p>
              <p className="fs-5 text-secondary mb-0">
                From conferences and workshops to festivals and
                community gatherings, we make every event
                accessible and memorable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-5 bg-light border-top border-bottom">
        <div className="container py-4">
          <h2 className="fw-bold text-center mb-5">Our Mission & Vision</h2>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card border shadow-sm h-100 p-4">
                <h4 className="fw-bold mb-3">Our Mission</h4>
                <p className="text-secondary mb-0">
                  To simplify event discovery and help users
                  connect with meaningful experiences.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border shadow-sm h-100 p-4">
                <h4 className="fw-bold mb-3">Our Vision</h4>
                <p className="text-secondary mb-0">
                  To become the most trusted event platform
                  for communities worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-5">
        <div className="container py-4">
          <div className="row g-4 text-center">
            <div className="col-6 col-md-3">
              <div className="card border shadow-sm h-100 p-4">
                <h2 className="fw-bold mb-1">5000+</h2>
                <p className="text-secondary small mb-0">Users</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border shadow-sm h-100 p-4">
                <h2 className="fw-bold mb-1">1200+</h2>
                <p className="text-secondary small mb-0">Events</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border shadow-sm h-100 p-4">
                <h2 className="fw-bold mb-1">300+</h2>
                <p className="text-secondary small mb-0">Organizers</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border shadow-sm h-100 p-4">
                <h2 className="fw-bold mb-1">4.9</h2>
                <p className="text-secondary small mb-0">Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-5 bg-light border-top">
        <div className="container py-4">
          <h2 className="fw-bold text-center mb-5">Meet Our Team</h2>
          <div className="row g-4">
            {team.map((member) => (
              <div className="col-sm-6 col-md-4" key={member.name}>
                <div className="card border shadow-sm h-100 text-center p-4">
                  <div className="rounded-circle bg-secondary-subtle mx-auto mb-3" style={{ width: 96, height: 96 }} />
                  <h5 className="fw-bold mb-1">{member.name}</h5>
                  <p className="text-secondary small mb-0">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export default AboutUs;
