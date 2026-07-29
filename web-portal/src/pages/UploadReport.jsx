import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

const emptyForm = {
  age: "", gender: "Male", glucose: "", HbA1c: "", bmi: "",
  sysBP: "", diaBP: "", chol: "", hemo: "", creatinine: "", alt: "", ast: "",
};

export default function UploadReport() {
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await api.post("/reports/extract-pdf", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const extracted = res.data.extracted;
      setForm((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(extracted).filter(([, v]) => v !== null && v !== undefined)
        ),
      }));
    } catch (err) {
      setError("Could not read PDF. Please enter values manually.");
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const toNum = (v) => (v === "" || v === undefined ? null : parseFloat(v));
      const payload = {
        age: parseInt(form.age),
        gender: form.gender,
        glucose: toNum(form.glucose),
        HbA1c: toNum(form.HbA1c),
        bmi: toNum(form.bmi),
        sysBP: toNum(form.sysBP),
        diaBP: toNum(form.diaBP),
        chol: toNum(form.chol),
        hemo: toNum(form.hemo),
        creatinine: toNum(form.creatinine),
        alt: toNum(form.alt),
        ast: toNum(form.ast),
      };
      const res = await api.post("/reports/analyze", payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail?.[0]?.msg || "Could not analyze report.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "age", label: "Age" },
    { key: "glucose", label: "Glucose (mg/dL)" },
    { key: "HbA1c", label: "HbA1c (%)" },
    { key: "bmi", label: "BMI" },
    { key: "sysBP", label: "Systolic BP" },
    { key: "diaBP", label: "Diastolic BP" },
    { key: "chol", label: "Cholesterol" },
    { key: "hemo", label: "Hemoglobin" },
    { key: "creatinine", label: "Creatinine" },
    { key: "alt", label: "ALT" },
    { key: "ast", label: "AST" },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.logo}>MedIntel AI</h1>
        <Link to="/patient" style={styles.backLink}>Back to dashboard</Link>
      </header>

      <main style={styles.main}>
        <h2 style={styles.heading}>Upload lab report</h2>
        <p style={styles.subheading}>Upload a PDF to auto-fill, or enter values manually. Only age is required — missing values use healthy defaults.</p>

        <div style={styles.card}>
          <label style={styles.uploadLabel}>
            Upload PDF report
            <input type="file" accept="application/pdf" onChange={handlePdfUpload} style={styles.fileInput} />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <form onSubmit={handleAnalyze}>
            <div style={styles.grid}>
              {fields.map((f) => (
                <div key={f.key}>
                  <label style={styles.label}>
                    {f.label} {f.key !== "age" && <span style={styles.optional}>(optional)</span>}
                  </label>
                  <input
                    style={styles.input}
                    type="text"
                    value={form[f.key]}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    required={f.key === "age"}
                    placeholder="leave blank if unknown"
                  />
                </div>
              ))}
              <div>
                <label style={styles.label}>Gender</label>
                <select
                  style={styles.input}
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze report"}
            </button>
          </form>
        </div>

        {result && (
          <div style={{ ...styles.card, marginTop: "20px" }}>
            <h3 style={styles.sectionTitle}>Risk results</h3>
            <div style={styles.badgeRow}>
              {Object.entries(result.risk_results).map(([key, val]) => (
                <span
                  key={key}
                  style={val === 1 ? styles.badgeDanger : styles.badgeSuccess}
                >
                  {key.replace("_", " ")}: {val === 1 ? "at risk" : "healthy"}
                </span>
              ))}
            </div>

            <h3 style={{ ...styles.sectionTitle, marginTop: "20px" }}>Risk comparison</h3>
            <div style={styles.chartRow}>
              {Object.entries(result.risk_results).map(([key, val]) => (
                <div key={key} style={styles.chartBarWrap}>
                  <div style={{
                    ...styles.chartBar,
                    height: val === 1 ? "80px" : "24px",
                    background: val === 1 ? "#E74C3C" : "#2ECC71",
                  }} />
                  <p style={styles.chartLabel}>{key.replace("_", " ")}</p>
                </div>
              ))}
            </div>

            <h3 style={{ ...styles.sectionTitle, marginTop: "20px" }}>Recommendations</h3>
            <ul style={styles.list}>
              {result.recommendations.map((rec, i) => (
                <li key={i} style={styles.listItem}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
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
  main: { maxWidth: "700px", margin: "40px auto", padding: "0 24px" },
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 24px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  uploadLabel: {
    display: "block", fontSize: "13px", color: "#0F5C5C", fontWeight: 600,
    marginBottom: "20px", padding: "16px", border: "1px dashed #7BA8A8",
    borderRadius: "8px", textAlign: "center", cursor: "pointer", background: "#F7FBFB",
  },
  fileInput: { display: "block", marginTop: "8px", fontSize: "12px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginBottom: "20px" },
  label: { fontSize: "12px", color: "#3D5555", display: "block", marginBottom: "4px" },
  optional: { color: "#8FA3A3", fontWeight: 400, fontSize: "11px" },
  input: {
    width: "100%", padding: "8px 10px", border: "1px solid #D5E3E3", borderRadius: "6px",
    fontSize: "13px", boxSizing: "border-box", fontFamily: "'IBM Plex Mono', monospace",
    background: "#FAFCFC",
  },
  button: {
    padding: "12px 24px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C",
    borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: "pointer",
  },
  error: { color: "#C0392B", fontSize: "13px", marginBottom: "12px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  badgeRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  badgeDanger: {
    background: "#FBE9E7", color: "#C0392B", fontSize: "12px",
    padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize",
  },
  badgeSuccess: {
    background: "#E8F5E9", color: "#2E8B57", fontSize: "12px",
    padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize",
  },
  chartRow: { display: "flex", gap: "16px", alignItems: "flex-end", height: "110px", padding: "0 4px" },
  chartBarWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 },
  chartBar: { width: "100%", borderRadius: "4px 4px 0 0", transition: "height 0.3s" },
  chartLabel: { fontSize: "10px", color: "#6B8080", textAlign: "center", margin: 0, textTransform: "capitalize" },
  list: { margin: 0, paddingLeft: "18px" },
  listItem: { fontSize: "13px", color: "#3D5555", marginBottom: "6px", lineHeight: 1.5 },
};