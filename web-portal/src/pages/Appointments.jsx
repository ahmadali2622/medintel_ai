import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "medicine", message: "", remind_at: "" });
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    Promise.all([
      api.get("/appointments/my"),
      api.get("/reminders/upcoming"),
    ])
      .then(([apptRes, remRes]) => {
        setAppointments(apptRes.data);
        setReminders(remRes.data);
      })
      .catch(() => setError("Could not load appointments/reminders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const cancelAppointment = async (id) => {
    await api.post(`/appointments/${id}/cancel`);
    loadData();
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm("Delete this appointment permanently?")) return;
    await api.delete(`/appointments/${id}`);
    loadData();
  };

  const deleteReminder = async (id) => {
    if (!window.confirm("Delete this reminder permanently?")) return;
    await api.delete(`/reminders/${id}`);
    loadData();
  };

  // --- ADDED FUNCTION START ---
  const leaveReview = async (doctorId) => {
    const rating = prompt("Rate this doctor 1-5:");
    if (!rating || rating < 1 || rating > 5) return;
    const comment = prompt("Any comments? (optional)") || "";
    try {
      await api.post(`/doctors/${doctorId}/reviews`, { doctor_id: doctorId, rating: parseInt(rating), comment });
      alert("Thanks for your feedback!");
    } catch (err) {
      alert("Could not submit review.");
    }
  };
  // --- ADDED FUNCTION END ---

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        remind_at: new Date(form.remind_at).toISOString(),
      };
      await api.post("/reminders/create", payload);
      setForm({ type: "medicine", message: "", remind_at: "" });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert("Could not create reminder. Check all fields are filled.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  };

  const statusStyle = (status) => {
    if (status === "confirmed") return styles.badgeSuccess;
    if (status === "cancelled" || status === "rejected") return styles.badgeDanger;
    return styles.badgePending;
  };

  const providerLabel = (appt) => {
    if (appt.provider_type === "lab") return appt.lab_name || "Laboratory visit";
    return appt.doctor_name || "Doctor appointment";
  };

  return (
    <>
      <style>{`
        .appt-main { max-width: 700px; margin: 40px auto; padding: 0 24px; }
        @media (max-width: 600px) {
          .appt-main { padding: 0 16px !important; margin: 20px auto !important; }
        }
      `}</style>
      <div style={styles.page}>
        <header style={styles.header}>
          <h1 style={styles.logo}>MedIntel AI</h1>
          <Link to="/patient" style={styles.backLink}>Back to dashboard</Link>
        </header>

        <main className="appt-main">
          <h2 style={styles.heading}>Appointments & reminders</h2>
          <p style={styles.subheading}>Your upcoming schedule</p>

          {error && <p style={styles.notice}>{error}</p>}
          {loading && <p style={styles.notice}>Loading...</p>}

          {!loading && (
            <>
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Appointments</h3>
                {appointments.length === 0 && <p style={styles.emptyText}>No appointments booked yet</p>}
                {appointments.map((appt) => (
                  <div key={appt.id} style={styles.apptBlock}>
                    <div style={styles.row}>
                      <div>
                        <p style={styles.rowName}>{providerLabel(appt)}</p>
                        <p style={styles.rowMeta}>{formatDate(appt.scheduled_at)}</p>
                        <p style={styles.rowMeta}>{appt.notes || "No notes"}</p>
                        {appt.status === "rejected" && appt.reject_reason && (
                          <p style={styles.rejectReason}>Rejected: {appt.reject_reason}</p>
                        )}
                      </div>
                      <span style={statusStyle(appt.status)}>{appt.status}</span>
                    </div>
                    <div style={styles.actionRow}>
                      {appt.status !== "cancelled" && appt.status !== "rejected" && (
                        <button style={styles.cancelBtn} onClick={() => cancelAppointment(appt.id)}>Cancel</button>
                      )}
                      
                      {/* --- ADDED REVIEW BUTTON START --- */}
                      {appt.status === "completed" && appt.provider_type === "doctor" && (
                        <button style={styles.reviewBtn} onClick={() => leaveReview(appt.doctor_id)}>Leave a review</button>
                      )}
                      {/* --- ADDED REVIEW BUTTON END --- */}

                      <button style={styles.deleteBtn} onClick={() => deleteAppointment(appt.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...styles.card, marginTop: "20px" }}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>Reminders</h3>
                  <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "+ Add reminder"}
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={handleCreateReminder} style={styles.form}>
                    <div style={styles.formGrid}>
                      <div>
                        <label style={styles.label}>Type</label>
                        <select
                          style={styles.input}
                          value={form.type}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                          <option value="medicine">Medicine</option>
                          <option value="follow_up">Follow-up test</option>
                          <option value="appointment">Appointment</option>
                        </select>
                      </div>
                      <div>
                        <label style={styles.label}>Remind at</label>
                        <input
                          style={styles.input}
                          type="datetime-local"
                          value={form.remind_at}
                          onChange={(e) => setForm({ ...form, remind_at: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: "12px" }}>
                      <label style={styles.label}>Message</label>
                      <input
                        style={styles.input}
                        type="text"
                        placeholder="e.g. Take blood pressure medication"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" style={styles.saveBtn} disabled={saving}>
                      {saving ? "Saving..." : "Save reminder"}
                    </button>
                  </form>
                )}

                {reminders.length === 0 && !showForm && <p style={styles.emptyText}>No reminders set</p>}
                {reminders.map((rem) => (
                  <div key={rem.id} style={styles.row}>
                    <div>
                      <p style={styles.rowName}>{rem.message}</p>
                      <p style={styles.rowMeta}>{formatDate(rem.remind_at)} · {rem.type.replace("_", " ")}</p>
                    </div>
                    <button style={styles.deleteBtn} onClick={() => deleteReminder(rem.id)}>Delete</button>
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "#FFFFFF", borderBottom: "1px solid #D5E3E3" },
  logo: { fontFamily: "'Fraunces', serif", fontSize: "20px", color: "#0F5C5C", margin: 0 },
  backLink: { color: "#0F5C5C", fontSize: "13px", textDecoration: "none" },
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 16px" },
  notice: { color: "#8A6D3B", fontSize: "13px", marginBottom: "16px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: 0, fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3" },
  apptBlock: { padding: "12px 0", borderBottom: "1px solid #EFF5F5" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" },
  rowName: { fontSize: "14px", color: "#3D5555", margin: 0, fontWeight: 500 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: "2px 0 0" },
  rejectReason: { fontSize: "12px", color: "#C0392B", margin: "4px 0 0" },
  badgeSuccess: { background: "#E8F5E9", color: "#2E8B57", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  badgeDanger: { background: "#FBE9E7", color: "#C0392B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  badgePending: { background: "#FFF3CD", color: "#8A6D3B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  actionRow: { display: "flex", gap: "8px", marginTop: "8px" },
  cancelBtn: { padding: "4px 10px", background: "transparent", color: "#C0392B", border: "1px solid #C0392B", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },
  deleteBtn: { padding: "4px 10px", background: "transparent", color: "#8FA3A3", border: "1px solid #D5E3E3", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },
  addBtn: { padding: "6px 14px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  form: { background: "#F7FBFB", border: "1px solid #D5E3E3", borderRadius: "8px", padding: "16px", marginBottom: "16px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  label: { fontSize: "12px", color: "#3D5555", display: "block", marginBottom: "4px" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #D5E3E3", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", background: "#fff" },
  saveBtn: { marginTop: "12px", padding: "8px 20px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  
  /* --- Added style for Review Button --- */
  reviewBtn: { padding: "4px 10px", background: "transparent", color: "#F39C12", border: "1px solid #F39C12", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },
};