import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function AdminDashboard() {
  const [pending, setPending] = useState({ doctors: [], labs: [] });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadPending = () => {
    api.get("/admin/pending-verifications").then((res) => setPending(res.data)).catch(() => setError("Could not load verification queue"));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    loadPending();
  }, [navigate]);

  const viewDocument = async (type, id) => {
    try {
      const res = await api.get(`/admin/view-document/${type}/${id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      window.open(url, "_blank");
    } catch (err) {
      alert("Could not open document.");
    }
  };

  const verifyDoctor = async (id) => { await api.post(`/admin/verify-doctor/${id}`); loadPending(); };
  const rejectDoctor = async (id) => {
    const reason = prompt("Reason for rejecting this doctor:");
    if (!reason) return;
    await api.post(`/admin/reject-doctor/${id}?reason=${encodeURIComponent(reason)}`);
    loadPending();
  };
  const cancelDoctor = async (id) => {
    if (!window.confirm("Cancel this doctor's request?")) return;
    await api.post(`/admin/cancel-doctor/${id}`);
    loadPending();
  };

  const verifyLab = async (id) => { await api.post(`/admin/verify-lab/${id}`); loadPending(); };
  const rejectLab = async (id) => {
    const reason = prompt("Reason for rejecting this lab:");
    if (!reason) return;
    await api.post(`/admin/reject-lab/${id}?reason=${encodeURIComponent(reason)}`);
    loadPending();
  };
  const cancelLab = async (id) => {
    if (!window.confirm("Cancel this lab's request?")) return;
    await api.post(`/admin/cancel-lab/${id}`);
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
                <p style={styles.rowMeta}>{doc.specialization} {doc.phone && `· 📞 ${doc.phone}`}</p>
              </div>
              <div style={styles.actions}>
                {doc.has_document ? (
                  <button style={styles.docBtn} onClick={() => viewDocument("doctor", doc.id)}>View Document</button>
                ) : (
                  <span style={styles.noDoc}>No document</span>
                )}
                <button style={styles.verifyBtn} onClick={() => verifyDoctor(doc.id)}>Verify</button>
                <button style={styles.rejectBtn} onClick={() => rejectDoctor(doc.id)}>Reject</button>
                <button style={styles.cancelBtn} onClick={() => cancelDoctor(doc.id)}>Cancel</button>
              </div>
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
                {lab.phone && <p style={styles.rowMeta}>📞 {lab.phone}</p>}
              </div>
              <div style={styles.actions}>
                {lab.has_document ? (
                  <button style={styles.docBtn} onClick={() => viewDocument("lab", lab.id)}>View Document</button>
                ) : (
                  <span style={styles.noDoc}>No document</span>
                )}
                <button style={styles.verifyBtn} onClick={() => verifyLab(lab.id)}>Verify</button>
                <button style={styles.rejectBtn} onClick={() => rejectLab(lab.id)}>Reject</button>
                <button style={styles.cancelBtn} onClick={() => cancelLab(lab.id)}>Cancel</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#F0F5F5", fontFamily: "'IBM Plex Sans', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "#FFFFFF", borderBottom: "1px solid #D5E3E3" },
  logo: { fontFamily: "'Fraunces', serif", fontSize: "20px", color: "#0F5C5C", margin: 0 },
  logoutBtn: { padding: "8px 16px", background: "transparent", color: "#0F5C5C", border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  main: { maxWidth: "800px", margin: "40px auto", padding: "0 24px" },
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 24px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #EFF5F5", gap: "12px", flexWrap: "wrap" },
  rowName: { fontSize: "14px", color: "#3D5555", margin: 0, fontWeight: 500 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: 0 },
  actions: { display: "flex", gap: "6px", flexWrap: "wrap" },
  docBtn: { padding: "6px 12px", background: "transparent", color: "#0F5C5C", border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },
  noDoc: { fontSize: "11px", color: "#C0392B", alignSelf: "center" },
  verifyBtn: { padding: "6px 14px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  rejectBtn: { padding: "6px 14px", background: "transparent", color: "#C0392B", border: "1px solid #C0392B", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  cancelBtn: { padding: "6px 14px", background: "transparent", color: "#8FA3A3", border: "1px solid #D5E3E3", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  error: { color: "#C0392B", fontSize: "13px", marginBottom: "16px" },
};