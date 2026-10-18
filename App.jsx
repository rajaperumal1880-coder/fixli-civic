
import "./App.css";
import { useCallback, useEffect, useState } from "react";
import Auth from "./Auth";

const API_URL = "http://localhost:8080/api";

const categories = [
  { icon: "🛣️", name: "Roads & Potholes", color: "#e8efff" },
  { icon: "💧", name: "Water Supply", color: "#e2f6ff" },
  { icon: "💡", name: "Street Lights", color: "#fff3d6" },
  { icon: "🗑️", name: "Garbage & Waste", color: "#e4f8e9" },
];

function App() {
  const [trackedComplaint, setTrackedComplaint] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Error loading saved user:", error);
      return null;
    }
  });

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load complaints from the Spring Boot backend.
  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/complaints`);

      if (!response.ok) {
        throw new Error("Failed to load complaints.");
      }

      const data = await response.json();
      setComplaints(data);
    } catch (err) {
      console.error("Loading complaints failed:", err);
      setError("Could not load complaints. Please check the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Login handler.
  function handleLogin(loggedInUser) {
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  // Logout handler.
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  // Submit a new civic complaint.
  async function handleComplaintSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in again before submitting a complaint.");
      return;
    }

    const complaint = {
      title: formData.get("title"),
      category: formData.get("category"),
      location: formData.get("location"),
      description: formData.get("description"),
    };

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(complaint),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Server error: ${response.status}`);
      }

      const savedComplaint = await response.json();

      alert(`Complaint submitted successfully! ID: ${savedComplaint.id}`);

      form.reset();

      // Refresh the dashboard after a successful submission.
      await loadComplaints();
    } catch (err) {
      console.error("Complaint submission failed:", err);
      alert(
        err.message ||
          "Could not submit the complaint. Please check the backend."
      );
    } finally {
      setSubmitting(false);
    }
  }
  
  // Update a complaint's status from the Admin Dashboard.
  async function handleStatusChange(complaintId, newStatus) {
    const previousComplaints = complaints;

    // Update the displayed status immediately.
    setComplaints((current) =>
      current.map((complaint) =>
        complaint.id === complaintId
          ? { ...complaint, status: newStatus }
          : complaint
      )
    );

    try {
      const response = await fetch(
        `${API_URL}/complaints/${complaintId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not update the complaint status.");
      }

      const updatedComplaint = await response.json();

      // Keep the backend response in the frontend state.
      setComplaints((current) =>
        current.map((complaint) =>
          complaint.id === complaintId
            ? updatedComplaint
            : complaint
        )
      );

      // Update the tracking result too, if it is this complaint.
      setTrackedComplaint((current) =>
        current && current.id === complaintId
          ? updatedComplaint
          : current
      );
    } catch (err) {
      console.error("Status update failed:", err);

      // Restore the previous list if the update fails.
      setComplaints(previousComplaints);

      alert(
        err.message ||
          "Status update failed. Please try again."
      );
    }
  }


  // Find and display a complaint by ID.
  async function handleTrackComplaint(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const complaintId = form.elements.complaintId.value.trim();

    if (!complaintId) {
      alert("Please enter a complaint ID.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/complaints/${encodeURIComponent(complaintId)}`
      );

      if (!response.ok) {
        throw new Error("Complaint not found. Please check the ID.");
      }

      const complaint = await response.json();
      setTrackedComplaint(complaint);

      alert(
        `Title: ${complaint.title}\n` +
          `Location: ${complaint.location}\n` +
          `Status: ${complaint.status}`
      );
    } catch (err) {
      console.error("Tracking error:", err);
      setTrackedComplaint(null);
      alert(err.message || "Could not track this complaint.");
    }
  }

  // Show the authentication screen when logged out.
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {/* Navigation */}
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">F</span>
          FixIt<span className="brand-dot">.</span>
        </a>

        <nav className="nav-links">
          <a className="active" href="#home">
            Home
          </a>
          <a href="#categories">Categories</a>
          <a href="#track">Track Complaint</a>
          <a href="#admin">Admin Dashboard</a>
        </nav>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <button className="nav-button" onClick={handleLogout}>
            Logout
          </button>

          <a className="nav-button" href="#report">
            + Report Issue
          </a>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              <span className="status-dot"></span>
              YOUR CITY, YOUR VOICE
            </span>

            <h1>
              Let's make our city
              <br />
              <span>better together.</span>
            </h1>

            <p>
              Report civic issues, track their progress, and help
              build a cleaner, safer and smarter community.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#report">
                Report a Complaint <span>→</span>
              </a>
              <a className="secondary-button" href="#track">
                Track an Issue
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span> Easy reporting
              <span>✓</span> Transparent tracking
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orb orb-one"></div>
            <div className="visual-orb orb-two"></div>

            <div className="city-card">
              <div className="city-card-top">
                <div>
                  <span className="small-label">COMMUNITY FIRST</span>
                  <h3>A better city starts here.</h3>
                </div>
                <span className="city-symbol">⌂</span>
              </div>

              <div className="city-illustration">
                <div className="sun"></div>
                <div className="cloud cloud-one"></div>
                <div className="cloud cloud-two"></div>
                <div className="building building-one"></div>
                <div className="building building-two"></div>
                <div className="building building-three"></div>
                <div className="tree tree-one"></div>
                <div className="tree tree-two"></div>
                <div className="road"></div>
                <div className="road-line"></div>
              </div>

              <div className="city-card-bottom">
                <span className="mini-check">✓</span>
                <div>
                  <strong>Every issue matters</strong>
                  <p>Your report can make a difference.</p>
                </div>
              </div>
            </div>

            <div className="floating-badge">
              <span>📍</span>
              <div>
                <strong>See it. Report it.</strong>
                <p>Help your community</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="categories-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="section-label">WHAT NEEDS FIXING?</span>
              <h2>Report an issue</h2>
              <p>Choose a category to get started.</p>
            </div>

            <span className="category-count">04 categories</span>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <a
                className="category-card"
                href="#report"
                key={category.name}
              >
                <span
                  className="category-icon"
                  style={{ background: category.color }}
                >
                  {category.icon}
                </span>

                <strong>{category.name}</strong>
                <span className="category-arrow">↗</span>
              </a>
            ))}
          </div>
        </section>

        {/* Report Complaint Section */}
        <section className="action-section" id="report">
          <div>
            <span className="section-label">MAKE A DIFFERENCE</span>
            <h2>Report a civic issue</h2>
            <p>Tell us about a problem in your neighbourhood.</p>
          </div>

          <form
            className="complaint-form"
            onSubmit={handleComplaintSubmit}
          >
            <label htmlFor="title">Complaint title</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Damaged road near bus stop"
              required
            />

            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select a category
              </option>
              <option>Roads &amp; Potholes</option>
              <option>Water Supply</option>
              <option>Street Lights</option>
              <option>Garbage &amp; Waste</option>
              <option>Other</option>
            </select>

            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="Enter your area or street"
              required
            />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe the issue..."
              rows="4"
              required
            />

            <button
              className="primary-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Complaint →"}
            </button>
          </form>
        </section>

        {/* Complaint Tracking Section */}
        <section className="track-section" id="track">
          <div>
            <span className="section-label">STAY INFORMED</span>
            <h2>Track your complaint</h2>
            <p>Enter your complaint ID to check its progress.</p>
          </div>

          <form onSubmit={handleTrackComplaint}>
            <input
              name="complaintId"
              type="number"
              min="1"
              placeholder="e.g. 3"
              aria-label="Complaint ID"
              required
            />

            <button className="primary-button" type="submit">
              Track Issue →
            </button>
          </form>
        </section>

        {/* Tracking Result */}
        {trackedComplaint && (
          <section className="tracking-result">
            <h3>Complaint Details</h3>

            <p>
              <strong>Complaint ID:</strong> {trackedComplaint.id}
            </p>
            <p>
              <strong>Title:</strong> {trackedComplaint.title}
            </p>
            <p>
              <strong>Location:</strong> {trackedComplaint.location}
            </p>
            <p>
              <strong>Category:</strong> {trackedComplaint.category}
            </p>
            
<p>
  <strong>Status:</strong>{" "}
  <span
    className={`status-badge ${
      (trackedComplaint.status || "").toLowerCase()
    }`}
  >
    {trackedComplaint.status || "UNKNOWN"}
  </span>
</p>

            <p>
              <strong>Description:</strong>{" "}
              {trackedComplaint.description || "No description provided"}
            </p>
          </section>
        )}

        {/* Admin Dashboard */}
        <section className="admin-section" id="admin">
          <div className="section-heading">
            <div>
              <span className="section-label">ADMINISTRATION</span>
              <h2>Complaint Overview</h2>
              <p>Monitor civic complaints and their current status.</p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={loadComplaints}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {loading && <p>Loading complaints...</p>}

          {error && (
            <div>
              <p role="alert">{error}</p>
              <button
                className="primary-button"
                type="button"
                onClick={loadComplaints}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Statistics Cards */}
              <div className="admin-stats">
                <div className="admin-stat-card">
                  <span>Total Complaints</span>
                  <h3>{complaints.length}</h3>
                </div>

                <div className="admin-stat-card">
                  <span>Pending</span>
                  <h3>
                    {
                      complaints.filter(
                        (c) => c.status === "PENDING"
                      ).length
                    }
                  </h3>
                </div>

                <div className="admin-stat-card">
                  <span>Escalated</span>
                  <h3>
                    {
                      complaints.filter(
                        (c) => c.status === "ESCALATED"
                      ).length
                    }
                  </h3>
                </div>

                <div className="admin-stat-card">
                  <span>Resolved</span>
                  <h3>
                    {
                      complaints.filter(
                        (c) => c.status === "RESOLVED"
                      ).length
                    }
                  </h3>
                </div>
              </div>

              {/* All Complaints Table */}
              <div className="admin-table-container">
                <h3>All Complaints</h3>

                <table className="admin-table">
                 <thead>
                  <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Update Status</th>
                  </tr>
                  </thead>

                  <tbody>
                    {complaints.length === 0 ? (
                      <tr> 
                         <td colSpan="5">No complaints found.</td>
                      </tr>
                      
                    ) : (
                      complaints.map((complaint) => (
                        <tr key={complaint.id}>
                          <td>{complaint.id}</td>
                          <td>{complaint.category}</td>
                          <td>{complaint.location}</td>
                         
  <td>
    <span
      className={`status-badge ${
        (complaint.status || "").toLowerCase()
      }`}
    >
      {complaint.status || "UNKNOWN"}
    </span>
  </td>

  <td>
    <select
      aria-label={`Update status for complaint ${complaint.id}`}
      value={complaint.status || "PENDING"}
      onChange={(event) =>
        handleStatusChange(
          complaint.id,
          event.target.value
        )
      }
    >
      <option value="PENDING">Pending</option>
      <option value="ESCALATED">Escalated</option>
      <option value="RESOLVED">Resolved</option>
    </select>
  </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <a className="brand" href="#home">
          <span className="brand-icon">F</span>
          FixIt<span className="brand-dot">.</span>
        </a>

        <p>Small actions. Better cities. Stronger communities.</p>
        <span>© 2026 FixIt Civic Complaint Tracker</span>
      </footer>
    </div>
  );
}

export default App;
