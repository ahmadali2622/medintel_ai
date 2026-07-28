import { useNavigate } from "react-router-dom";

export default function LabDashboard() {
  const navigate = useNavigate();

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
        <h2 style={styles.heading}>Lab Dashboard</h2>
        <p style={styles.subheading}>Manage patient reports and verification status</p>

        <div style={styles.card}>
          <p style={styles.cardText}>
            Report upload and patient-linking features are being built next. For now, this confirms
            you're logged in as a lab account and the dashboard route is working.
          </p>
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
  cardText: { fontSize: "14px", color: "#3D5555", lineHeight: 1.6, margin: 0 },
};