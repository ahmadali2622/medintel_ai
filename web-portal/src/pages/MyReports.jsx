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

  const downloadPdf = async (reportId) => {
    try {
      const res = await api.get(`/reports/${reportId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Could not download PDF.");
    }
  };

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
              <div style={styles.reportHeader}>
                <div>
                  <p style={styles.labName}>{r.uploaded_by_name || "Self-submitted"}</p>
                  <p style={styles.rowMeta}>{r.created_at ? formatDate(r.created_at) : ""}</p>
                </div>
                <button style={styles.downloadBtn} onClick={() => downloadPdf(r.id)}>Download PDF</button>
              </div>

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
  reportHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  labName: { fontFamily: "'Fraunces', serif", fontSize: "16px", fontWeight: 700, color: "#0F5C5C", margin: 0 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: "2px 0 0" },
  downloadBtn: { padding: "6px 14px", background: "transparent", color: "#0F5C5C", border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" },
  badgeRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" },
  badgeDanger: { background: "#FBE9E7", color: "#C0392B", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize" },
  badgeSuccess: { background: "#E8F5E9", color: "#2E8B57", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize" },
  list: { margin: 0, paddingLeft: "18px" },
  listItem: { fontSize: "13px", color: "#3D5555", marginBottom: "6px", lineHeight: 1.5 },
};