import { useNavigate, Link } from "react-router-dom";
import patientBg from "../assets/patient-bg.mp4";

export default function PatientDashboard() {
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
          <source src={patientBg} type="video/mp4" />
        </video>
        <div style={styles.overlay} />
        <div style={styles.bannerContent}>
          <h1 style={styles.logo}>MedIntel AI</h1>
          <button style={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <main style={styles.main}>
        <h2 style={styles.heading}>Your health dashboard</h2>
        <p style={styles.subheading}>Upload reports, ask questions, find specialists</p>

        <div style={styles.grid}>
          <Link to="/patient/upload" style={styles.cardLink}>
            <div style={styles.card}>
              <p style={styles.cardTitle}>Upload lab report</p>
              <p style={styles.cardDesc}>PDF auto-analysis or manual entry</p>
            </div>
          </Link>

          <Link to="/patient/chatbot" style={styles.cardLink}>
            <div style={styles.card}>
              <p style={styles.cardTitle}>Ask health chatbot</p>
              <p style={styles.cardDesc}>Grounded in your latest report</p>
            </div>
          </Link>

          <Link to="/patient/doctors" style={styles.cardLink}>
            <div style={styles.card}>
              <p style={styles.cardTitle}>Find doctors & labs</p>
              <p style={styles.cardDesc}>Verified, sorted by distance</p>
            </div>
          </Link>
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
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" },
  cardLink: { textDecoration: "none" },
  card: {
    background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px",
    padding: "20px", cursor: "pointer", height: "100%", boxSizing: "border-box",
  },
  cardTitle: { fontSize: "14px", fontWeight: 600, color: "#0F5C5C", margin: "0 0 6px" },
  cardDesc: { fontSize: "12px", color: "#6B8080", margin: 0 },
};