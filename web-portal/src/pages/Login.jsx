import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import loginBgVideo from "../assets/login-bg.mp4";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await api.post("/auth/register", { email, password, role });
      }
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);

      const payload = JSON.parse(atob(res.data.access_token.split(".")[1]));
      localStorage.setItem("role", payload.role);

      navigate(`/${payload.role}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.leftPanel}>
        <video autoPlay loop muted playsInline style={styles.bgVideo}>
          <source src={loginBgVideo} type="video/mp4" />
        </video>
        <div style={styles.overlay} />
        <div style={styles.leftContent}>
          <h2 style={styles.leftHeading}>Bringing AI healthcare<br />to every Pakistani household.</h2>
          <p style={styles.leftSub}>
            Digital health records, AI-powered report analysis, and verified doctors — built for Pakistan.
          </p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <form onSubmit={handleSubmit} style={styles.card}>
          <h1 style={styles.title}>MedIntel AI</h1>
          <p style={styles.subtitle}>Sign in to your portal</p>

          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {isRegister && (
            <>
              <label style={styles.label}>Role</label>
              <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="doctor">Doctor</option>
                <option value="lab">Laboratory</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>
            {isRegister ? "Create account" : "Sign in"}
          </button>

          <p style={styles.toggleRow}>
            <span style={styles.toggleGrey}>
              {isRegister ? "Already have an account? " : "Need an account? "}
            </span>
            <span style={styles.toggleGreen} onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Sign in" : "Register now"}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  leftPanel: {
    flex: "1 1 45%",
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden",
  },
  bgVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(180deg, rgba(15,92,92,0.25) 0%, rgba(10,40,40,0.85) 100%)",
  },
  leftContent: {
    position: "relative",
    padding: "48px",
    color: "#fff",
  },
  leftHeading: {
    fontFamily: "'Fraunces', serif",
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: 1.25,
    margin: "0 0 16px",
  },
  leftSub: {
    fontSize: "14px",
    color: "#CFE8E4",
    lineHeight: 1.6,
    maxWidth: "320px",
    margin: 0,
  },
  rightPanel: {
    flex: "1 1 55%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F0F5F5",
  },
  card: {
    background: "#FFFFFF",
    padding: "40px",
    borderRadius: "10px",
    width: "340px",
    border: "1px solid #D5E3E3",
  },
  title: {
    margin: 0,
    fontSize: "26px",
    color: "#0F5C5C",
    fontWeight: 600,
    fontFamily: "'Fraunces', serif",
  },
  subtitle: { margin: "4px 0 24px", fontSize: "13px", color: "#6B8080" },
  label: { fontSize: "12px", color: "#3D5555", display: "block", marginBottom: "4px" },
  input: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "16px",
    border: "1px solid #D5E3E3",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
    fontFamily: "'IBM Plex Mono', monospace",
    background: "#FAFCFC",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#0F5C5C",
    color: "#fff",
    border: "1px solid #0F5C5C",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  error: { color: "#C0392B", fontSize: "13px", marginBottom: "12px" },
  toggleRow: { textAlign: "center", fontSize: "13px", marginTop: "16px" },
  toggleGrey: { color: "#8FA3A3" },
  toggleGreen: { color: "#2E8B57", fontWeight: 600, cursor: "pointer" },
};