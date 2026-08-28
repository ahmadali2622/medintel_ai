import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/my-reports")
      .then((res) => setReports(res.data))
      .catch(() => setError("Could not load reports"))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <style>{`
        .reports-main { max-width: 700px; margin: 40px auto; padding: 0 24px; }
        @media (max-width: 600px) {
          .reports-main { padding: 0 16px !important; margin: 20px auto !important; }
        }
      `}</style>
      <div style={styles.page}>
        <header style={styles.header}>
          <h1 style={styles.logo}>MedIntel AI</h1>
          <Link to="/patient" style={styles.backLink}>Back to dashboard</Link>
        </header>

        <main className="reports-main">
          <h2 style={styles.heading}>My reports</h2>
          <p style={styles.subheading}>Reports submitted by yourself or by a lab on your behalf</p>

          {error && <p style={styles.notice}>{error}</p>}
          {loading && <p style={styles.notice}>Loading...</p>}

          {!loading && reports.length === 0 && (
            <div style={styles.card}><p style={styles.emptyText}>No reports yet</p></div>
          )}

          {!loading && reports.map((r) => (
            <div key={r.id} style={{ ...styles.card, marginBottom: "16px" }}>
              <p style={styles.rowMeta}>{formatDate(r.created_at || new Date())}</p>
              <div style={styles.badgeRow}>
                {Object.entries(r.risk_results).map(([key, val]) => (
                  <span key={key} style={val === 1 ? styles.badgeDanger : styles.badgeSuccess}>
                    {key.replace("_", " ")}: {val === 1 ? "at risk" : "healthy"}
                  </span>
                ))}
              </div>
              <ul style={styles.list}>
                {r.recommendations.map((rec, i) => <li key={i} style={styles.listItem}>{rec}</li>)}
              </ul>
            </div>
          ))}
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
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "20px" },
  emptyText: { fontSize: "13px", color: "#8FA3A3" },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: "0 0 10px" },
  badgeRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" },
  badgeDanger: { background: "#FBE9E7", color: "#C0392B", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize" },
  badgeSuccess: { background: "#E8F5E9", color: "#2E8B57", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize" },
  list: { margin: 0, paddingLeft: "18px" },
  listItem: { fontSize: "13px", color: "#3D5555", marginBottom: "6px", lineHeight: 1.5 },
};