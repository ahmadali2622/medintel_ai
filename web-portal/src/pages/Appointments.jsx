import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
        .appt-main {
          max-width: 700px;
          margin: 40px auto;
          padding: 0 24px;
        }
        @media (max-width: 600px) {
          .appt-main {
            padding: 0 16px !important;
            margin: 20px auto !important;
          }
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
                  <div key={appt.id} style={styles.row}>
                    <div>
                      <p style={styles.rowName}>{formatDate(appt.scheduled_at)}</p>
                      <p style={styles.rowMeta}>{appt.notes || "No notes"}</p>
                    </div>
                    <div style={styles.rowActions}>
                      <span style={statusStyle(appt.status)}>{appt.status}</span>
                      {appt.status !== "cancelled" && (
                        <button style={styles.cancelBtn} onClick={() => cancelAppointment(appt.id)}>Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...styles.card, marginTop: "20px" }}>
                <h3 style={styles.sectionTitle}>Reminders</h3>
                {reminders.length === 0 && <p style={styles.emptyText}>No reminders set</p>}
                {reminders.map((rem) => (
                  <div key={rem.id} style={styles.row}>
                    <div>
                      <p style={styles.rowName}>{rem.message}</p>
                      <p style={styles.rowMeta}>{formatDate(rem.remind_at)} · {rem.type.replace("_", " ")}</p>
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
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 32px", background: "#FFFFFF", borderBottom: "1px solid #D5E3E3",
  },
  logo: { fontFamily: "'Fraunces', serif", fontSize: "20px", color: "#0F5C5C", margin: 0 },
  backLink: { color: "#0F5C5C", fontSize: "13px", textDecoration: "none" },
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 16px" },
  notice: { color: "#8A6D3B", fontSize: "13px", marginBottom: "16px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3" },
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: "1px solid #EFF5F5", gap: "12px",
  },
  rowName: { fontSize: "14px", color: "#3D5555", margin: 0, fontWeight: 500 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: 0 },
  rowActions: { display: "flex", alignItems: "center", gap: "8px" },
  badgeSuccess: { background: "#E8F5E9", color: "#2E8B57", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  badgeDanger: { background: "#FBE9E7", color: "#C0392B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  badgePending: { background: "#FFF3CD", color: "#8A6D3B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  cancelBtn: {
    padding: "4px 10px", background: "transparent", color: "#C0392B",
    border: "1px solid #C0392B", borderRadius: "6px", cursor: "pointer", fontSize: "11px",
  },
};