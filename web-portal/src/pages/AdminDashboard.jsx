import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function AdminDashboard() {
  const [pending, setPending] = useState({ doctors: [], labs: [] });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadPending = () => {
    api.get("/admin/pending-verifications")
      .then((res) => setPending(res.data))
      .catch(() => setError("Could not load verification queue"));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    loadPending();
  }, [navigate]);

  const verifyDoctor = async (id) => {
    await api.post(`/admin/verify-doctor/${id}`);
    loadPending();
  };

  const verifyLab = async (id) => {
    await api.post(`/admin/verify-lab/${id}`);
    loadPending();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.logo}>MedIntel AI</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>Log out</button>
      </header>

      <main style={styles.main}>
        <h2 style={styles.heading}>Admin Dashboard</h2>
        <p style={styles.subheading}>Verification queue</p>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Doctors awaiting verification</h3>
          {pending.doctors.length === 0 && <p style={styles.emptyText}>No pending doctors</p>}
          {pending.doctors.map((doc) => (
            <div key={doc.id} style={styles.row}>
              <div>
                <p style={styles.rowName}>{doc.name}</p>
                <p style={styles.rowMeta}>{doc.specialization}</p>
              </div>
              <button style={styles.verifyBtn} onClick={() => verifyDoctor(doc.id)}>Verify</button>
            </div>
          ))}
        </div>

        <div style={{ ...styles.card, marginTop: "20px" }}>
          <h3 style={styles.sectionTitle}>Labs awaiting verification</h3>
          {pending.labs.length === 0 && <p style={styles.emptyText}>No pending labs</p>}
          {pending.labs.map((lab) => (
            <div key={lab.id} style={styles.row}>
              <div>
                <p style={styles.rowName}>{lab.lab_name}</p>
              </div>
              <button style={styles.verifyBtn} onClick={() => verifyLab(lab.id)}>Verify</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#F0F5F5", fontFamily: "'IBM Plex Sans', sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "#FFFFFF",
    borderBottom: "1px solid #D5E3E3",
  },
  logo: { fontFamily: "'Fraunces', serif", fontSize: "20px", color: "#0F5C5C", margin: 0 },
  logoutBtn: {
    padding: "8px 16px",
    background: "transparent",
    color: "#0F5C5C",
    border: "1px solid #0F5C5C",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  main: { maxWidth: "800px", margin: "40px auto", padding: "0 24px" },
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 24px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #EFF5F5",
  },
  rowName: { fontSize: "14px", color: "#3D5555", margin: 0, fontWeight: 500 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: 0 },
  verifyBtn: {
    padding: "6px 14px",
    background: "#0F5C5C",
    color: "#fff",
    border: "1px solid #0F5C5C",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  error: { color: "#C0392B", fontSize: "13px", marginBottom: "16px" },
};