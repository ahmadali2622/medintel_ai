import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import doctorBg from "../assets/doctor-bg.mp4";

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ name: "", specialization: "", phone: "", file: null });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    api.get("/doctors/my-profile")
      .then((res) => {
        setProfile(res.data);
        if (res.data.status === "verified") {
          return api.get("/doctors/my-appointments");
        }
        return { data: [] };
      })
      .then((res) => setAppointments(res.data || []))
      .catch((err) => {
        if (err.response?.status !== 404) setError("Could not load dashboard data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    loadData();
  }, [navigate]);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!form.file) return;
    setSaving(true);
    setError("");
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("specialization", form.specialization);
      data.append("phone", form.phone);
      data.append("lat", 31.5204);
      data.append("lng", 74.3587);
      data.append("file", form.file);
      await api.post("/doctors/register", data, { headers: { "Content-Type": "multipart/form-data" } });
      loadData();
    } catch (err) {
      setError("Could not submit profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const data = new FormData();
    data.append("file", file);
    try {
      await api.post("/doctors/upload-photo", data, { headers: { "Content-Type": "multipart/form-data" } });
      alert("Photo uploaded!");
      loadData();
    } catch (err) {
      alert("Could not upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const confirmAppointment = async (id) => {
    await api.post(`/doctors/appointments/${id}/confirm`);
    loadData();
  };

  const rejectAppointment = async (id) => {
    const reason = prompt("Reason for rejecting this appointment:");
    if (!reason) return;
    await api.post(`/doctors/appointments/${id}/reject?reason=${encodeURIComponent(reason)}`);
    loadData();
  };

  const completeAppointment = async (id) => {
    if (!window.confirm("Mark this appointment as completed?")) return;
    await api.post(`/doctors/appointments/${id}/complete`);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const formatDate = (iso) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const statusStyle = (status) => {
    if (status === "confirmed" || status === "verified" || status === "completed") return styles.badgeSuccess;
    if (status === "cancelled" || status === "rejected") return styles.badgeDanger;
    return styles.badgePending;
  };

  const needsForm = !profile || profile.status === "rejected" || profile.status === "cancelled";

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

          {!loading && profile && profile.status === "rejected" && (
            <div style={styles.rejectBanner}>
              Your previous submission was rejected: {profile.reject_reason || "No reason given"}. Please resubmit below.
            </div>
          )}
          {!loading && profile && profile.status === "cancelled" && (
            <div style={styles.rejectBanner}>Your previous request was cancelled by admin. Please resubmit below.</div>
          )}

          {!loading && needsForm && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>{profile ? "Resubmit your profile" : "Complete your profile"}</h3>
              <p style={styles.emptyText}>Fill in your details and upload a verification document (license/degree). Submission is disabled until a document is attached.</p>
              {error && <p style={styles.error}>{error}</p>}
              <form onSubmit={handleSubmitProfile}>
                <div className="doctor-form-grid">
                  <div>
                    <label style={styles.label}>Full name</label>
                    <input style={styles.input} type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Doe" required />
                  </div>
                  <div>
                    <label style={styles.label}>Specialization</label>
                    <input style={styles.input} type="text" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Cardiologist" required />
                  </div>
                  <div>
                    <label style={styles.label}>Phone number</label>
                    <input style={styles.input} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03001234567" />
                  </div>
                </div>
                <label style={styles.uploadLabel}>
                  {form.file ? `✓ ${form.file.name}` : "Upload verification document (required)"}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} style={styles.fileInput} />
                </label>
                <button type="submit" style={styles.button} disabled={saving || !form.file}>
                  {saving ? "Submitting..." : "Submit for verification"}
                </button>
              </form>
            </div>
          )}

          {!loading && profile && profile.status === "pending" && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Verification pending</h3>
              <div style={styles.profileRow}>
                <div>
                  <p style={styles.rowName}>{profile.name}</p>
                  <p style={styles.rowMeta}>{profile.specialization}</p>
                </div>
                <span style={styles.badgePending}>Pending review</span>
              </div>
              <p style={styles.emptyText}>An admin will review your document shortly.</p>
            </div>
          )}

          {!loading && profile && profile.status === "verified" && (
            <>
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Your profile</h3>
                <div style={styles.profileRow}>
                  <div>
                    <p style={styles.rowName}>{profile.name}</p>
                    <p style={styles.rowMeta}>{profile.specialization}</p>
                    {profile.phone && <p style={styles.rowMeta}>📞 {profile.phone}</p>}
                  </div>
                  <span style={styles.badgeSuccess}>Verified</span>
                </div>
                <div style={styles.uploadSection}>
                  <label style={styles.uploadLabel}>
                    {profile.photo_url ? "Change profile photo" : "Upload profile photo"}
                    <input type="file" accept="image/*" onChange={handleUploadPhoto} style={styles.fileInput} disabled={uploadingPhoto} />
                  </label>
                </div>
              </div>

              <div style={{ ...styles.card, marginTop: "20px" }}>
                <h3 style={styles.sectionTitle}>Appointments</h3>
                {appointments.length === 0 && <p style={styles.emptyText}>No appointments booked yet</p>}
                {appointments.map((appt) => (
                  <div key={appt.id} style={styles.apptBlock}>
                    <div style={styles.row}>
                      <div>
                        <p style={styles.rowName}>{appt.patient_email}</p>
                        <p style={styles.rowMeta}>📞 {appt.patient_phone || "No phone provided"} · {formatDate(appt.scheduled_at)}</p>
                        <p style={styles.rowMeta}>{appt.notes || "No notes"}</p>
                        {appt.status === "rejected" && appt.reject_reason && <p style={styles.rejectReason}>Rejected: {appt.reject_reason}</p>}
                      </div>
                      <span style={statusStyle(appt.status)}>{appt.status}</span>
                    </div>
                    {appt.status === "pending" && (
                      <div style={styles.actionRow}>
                        <button style={styles.confirmBtn} onClick={() => confirmAppointment(appt.id)}>Confirm</button>
                        <button style={styles.rejectBtn} onClick={() => rejectAppointment(appt.id)}>Reject</button>
                      </div>
                    )}
                    {appt.status === "confirmed" && (
                      <div style={styles.actionRow}>
                        <button style={styles.confirmBtn} onClick={() => completeAppointment(appt.id)}>Mark completed</button>
                      </div>
                    )}
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
  bgVideo: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 65%" },
  overlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(180deg, rgba(15,92,92,0.55) 0%, rgba(10,40,40,0.75) 100%)" },
  bannerContent: { position: "relative", height: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 32px" },
  logo: { fontFamily: "'Fraunces', serif", fontSize: "22px", color: "#fff", margin: 0 },
  logoutBtn: { padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 24px" },
  notice: { color: "#8A6D3B", fontSize: "13px", marginBottom: "16px" },
  rejectBanner: { background: "#FBE9E7", color: "#C0392B", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3", marginBottom: "16px" },
  label: { fontSize: "12px", color: "#3D5555", display: "block", marginBottom: "4px" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #D5E3E3", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", background: "#FAFCFC" },
  uploadLabel: { display: "block", fontSize: "13px", color: "#0F5C5C", fontWeight: 600, padding: "14px", border: "1px dashed #7BA8A8", borderRadius: "8px", textAlign: "center", cursor: "pointer", background: "#F7FBFB", marginBottom: "16px" },
  fileInput: { display: "block", marginTop: "8px", fontSize: "12px" },
  button: { padding: "10px 22px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
  error: { color: "#C0392B", fontSize: "13px", marginBottom: "12px" },
  profileRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  uploadSection: { marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #EFF5F5" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #EFF5F5", gap: "12px" },
  apptBlock: { padding: "12px 0", borderBottom: "1px solid #EFF5F5" },
  rowName: { fontSize: "14px", color: "#3D5555", margin: 0, fontWeight: 500 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: 0 },
  rejectReason: { fontSize: "12px", color: "#C0392B", margin: "4px 0 0" },
  actionRow: { display: "flex", gap: "8px", marginTop: "8px" },
  confirmBtn: { padding: "4px 12px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },
  rejectBtn: { padding: "4px 12px", background: "transparent", color: "#C0392B", border: "1px solid #C0392B", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },
  badgeSuccess: { background: "#E8F5E9", color: "#2E8B57", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  badgeDanger: { background: "#FBE9E7", color: "#C0392B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  badgePending: { background: "#FFF3CD", color: "#8A6D3B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
};