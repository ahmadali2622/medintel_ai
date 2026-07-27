import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

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
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1 style={styles.title}>MedIntel AI</h1>
        <p style={styles.subtitle}>{isRegister ? "Create an account" : "Sign in to your portal"}</p>

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

        <p style={styles.toggle} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F0F5F5",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#FFFFFF",
    padding: "40px",
    borderRadius: "16px",
    width: "340px",
    boxShadow: "0 4px 24px rgba(15, 92, 92, 0.08)",
  },
  title: { margin: 0, fontSize: "22px", color: "#0F5C5C", fontWeight: 700 },
  subtitle: { margin: "4px 0 24px", fontSize: "13px", color: "#6B8080" },
  label: { fontSize: "12px", color: "#3D5555", display: "block", marginBottom: "4px" },
  input: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "16px",
    border: "1px solid #D5E3E3",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#0F5C5C",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: { color: "#C0392B", fontSize: "13px", marginBottom: "12px" },
  toggle: { textAlign: "center", fontSize: "13px", color: "#0F5C5C", marginTop: "16px", cursor: "pointer" },
};