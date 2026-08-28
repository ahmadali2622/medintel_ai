import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import doctorBg from "../assets/doctor-bg.mp4";

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [form, setForm] = useState({ name: "", specialization: "", lat: "", lng: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    api.get("/doctors/my-profile")
      .then((res) => {
        setProfile(res.data);
        setNeedsProfile(false);
        return api.get("/doctors/my-appointments");
      })
      .then((res) => setAppointments(res?.data || []))
      .catch((err) => {
        if (err.response?.status === 404) {
          setNeedsProfile(true);
        } else {
          setError("Could not load dashboard data.");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    loadData();
  }, [navigate]);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/doctors/register", {
        name: form.name,
        specialization: form.specialization,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
      });
      loadData();
    } catch (err) {
      setError("Could not create profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmAppointment = async (id) => {
    await api.post(`/doctors/appointments/${id}/confirm`);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  };

  const statusStyle = (status) => {
    if (status === "confirmed") return styles.badgeSuccess;
    if (status === "cancelled") return styles.badgeDanger;
    return styles.badgePending;
  };

  return (
    <>
      <style>{`
        .doctor-main { max-width: 800px; margin: 40px auto; padding: 0 24px; }
        .doctor-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; margin-bottom: 16px; }
        @media (max-width: 700px) {
          .doctor-main { padding: 0 16px !important; margin: 20px auto !important; }
          .doctor-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div style={styles.page}>
        <div style={styles.banner}>
          <video autoPlay loop muted playsInline style={styles.bgVideo}>
            <source src={doctorBg} type="video/mp4" />
          </video>
          <div style={styles.overlay} />
          <div style={styles.bannerContent}>
            <h1 style={styles.logo}>MedIntel AI</h1>
            <button style={styles.logoutBtn} onClick={handleLogout}>Log out</button>
          </div>
        </div>

        <main className="doctor-main">
          <h2 style={styles.heading}>Doctor Dashboard</h2>
          <p style={styles.subheading}>Your profile and upcoming appointments</p>

          {loading && <p style={styles.notice}>Loading...</p>}
          {error && <p style={styles.notice}>{error}</p>}

          {!loading && needsProfile && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Complete your profile</h3>
              <p style={styles.emptyText}>Submit your details for admin verification.</p>
              <form onSubmit={handleCreateProfile}>
                <div className="doctor-form-grid">
                  <div>
                    <label style={styles.label}>Full name</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Specialization</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Latitude <span style={styles.optional}>(optional)</span></label>
                    <input
                      style={styles.input}
                      type="text"
                      value={form.lat}
                      onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Longitude <span style={styles.optional}>(optional)</span></label>
                    <input
                      style={styles.input}
                      type="text"
                      value={form.lng}
                      onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" style={styles.button} disabled={saving}>
                  {saving ? "Submitting..." : "Submit for verification"}
                </button>
              </form>
            </div>
          )}

          {!loading && profile && (
            <>
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Your profile</h3>
                <div style={styles.profileRow}>
                  <div>
                    <p style={styles.rowName}>{profile.name}</p>
                    <p style={styles.rowMeta}>{profile.specialization}</p>
                  </div>
                  <span style={profile.verified ? styles.badgeSuccess : styles.badgePending}>
                    {profile.verified ? "Verified" : "Pending verification"}
                  </span>
                </div>
              </div>

              <div style={{ ...styles.card, marginTop: "20px" }}>
                <h3 style={styles.sectionTitle}>Appointments</h3>
                {appointments.length === 0 && <p style={styles.emptyText}>No appointments booked yet</p>}
                {appointments.map((appt) => (
                  <div key={appt.id} style={styles.row}>
                    <div>
                      <p style={styles.rowName}>{appt.patient_email}</p>
                      <p style={styles.rowMeta}>{formatDate(appt.scheduled_at)} · {appt.notes || "No notes"}</p>
                    </div>
                    <div style={styles.rowActions}>
                      <span style={statusStyle(appt.status)}>{appt.status}</span>
                      {appt.status === "pending" && (
                        <button style={styles.confirmBtn} onClick={() => confirmAppointment(appt.id)}>Confirm</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#F0F5F5", fontFamily: "'IBM Plex Sans', sans-serif" },
  banner: { position: "relative", height: "200px", overflow: "hidden" },
  bgVideo: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 55%" },
  overlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(180deg, rgba(15,92,92,0.55) 0%, rgba(10,40,40,0.75) 100%)" },
  bannerContent: { position: "relative", height: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 32px" },
  logo: { fontFamily: "'Fraunces', serif", fontSize: "22px", color: "#fff", margin: 0 },
  logoutBtn: { padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 24px" },
  notice: { color: "#8A6D3B", fontSize: "13px", marginBottom: "16px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3", marginBottom: "16px" },
  label: { fontSize: "12px", color: "#3D5555", display: "block", marginBottom: "4px" },
  optional: { color: "#8FA3A3", fontWeight: 400, fontSize: "11px" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #D5E3E3", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", background: "#FAFCFC" },
  button: { padding: "10px 22px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
  profileRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #EFF5F5", gap: "12px" },
  rowName: { fontSize: "14px", color: "#3D5555", margin: 0, fontWeight: 500 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: 0 },
  rowActions: { display: "flex", alignItems: "center", gap: "8px" },
  badgeSuccess: { background: "#E8F5E9", color: "#2E8B57", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  badgeDanger: { background: "#FBE9E7", color: "#C0392B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  badgePending: { background: "#FFF3CD", color: "#8A6D3B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  confirmBtn: { padding: "4px 12px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },
};