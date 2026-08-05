import { useNavigate } from "react-router-dom";
import labBg from "../assets/lab-bg.mp4";

export default function LabDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div style={styles.page}>
      <div style={styles.banner}>
        <video autoPlay loop muted playsInline style={styles.bgVideo}>
          <source src={labBg} type="video/mp4" />
        </video>
        <div style={styles.overlay} />
        <div style={styles.bannerContent}>
          <h1 style={styles.logo}>MedIntel AI</h1>
          <button style={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        </div>
      </div>

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
  banner: { position: "relative", height: "140px", overflow: "hidden" },
  bgVideo: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" },
  overlay: {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    background: "linear-gradient(180deg, rgba(15,92,92,0.55) 0%, rgba(10,40,40,0.75) 100%)",
  },
  bannerContent: {
    position: "relative", height: "100%", display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "0 32px",
  },
  logo: { fontFamily: "'Fraunces', serif", fontSize: "22px", color: "#fff", margin: 0 },
  logoutBtn: {
    padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff",
    border: "1px solid rgba(255,255,255,0.5)", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
  },
  main: { maxWidth: "800px", margin: "40px auto", padding: "0 24px" },
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 24px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  cardText: { fontSize: "14px", color: "#3D5555", lineHeight: 1.6, margin: 0 },
};