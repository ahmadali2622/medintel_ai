import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import labBg from "../assets/lab-bg.mp4";

const emptyReportForm = {
  patient_email: "", age: "", gender: "Male", glucose: "", HbA1c: "", bmi: "",
  sysBP: "", diaBP: "", chol: "", hemo: "", creatinine: "", alt: "", ast: "",
};

export default function LabDashboard() {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ lab_name: "", phone: "", file: null });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [form, setForm] = useState(emptyReportForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [submittedReports, setSubmittedReports] = useState([]);
  const navigate = useNavigate();

  const loadProfile = () => {
    setLoading(true);
    api.get("/labs/my-profile")
      .then((res) => setProfile(res.data))
      .catch((err) => { if (err.response?.status !== 404) setError("Could not load profile"); })
      .finally(() => setLoading(false));
  };

  const loadSubmittedReports = () => {
    api.get("/reports/submitted-by-me").then((res) => setSubmittedReports(res.data)).catch(() => {});
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    loadProfile();
    loadSubmittedReports();
  }, [navigate]);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.file) return;
    setSavingProfile(true);
    setProfileError("");
    try {
      const data = new FormData();
      data.append("lab_name", profileForm.lab_name);
      data.append("phone", profileForm.phone);
      data.append("lat", 31.5204);
      data.append("lng", 74.3587);
      data.append("file", profileForm.file);
      await api.post("/labs/register", data, { headers: { "Content-Type": "multipart/form-data" } });
      loadProfile();
    } catch (err) {
      setProfileError("Could not submit profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setResult(null); setSubmitting(true);
    try {
      const toNum = (v) => (v === "" || v === undefined ? null : parseFloat(v));
      const payload = {
        patient_email: form.patient_email, age: parseInt(form.age), gender: form.gender,
        glucose: toNum(form.glucose), HbA1c: toNum(form.HbA1c), bmi: toNum(form.bmi),
        sysBP: toNum(form.sysBP), diaBP: toNum(form.diaBP), chol: toNum(form.chol),
        hemo: toNum(form.hemo), creatinine: toNum(form.creatinine), alt: toNum(form.alt), ast: toNum(form.ast),
      };
      const res = await api.post("/reports/lab-submit", payload);
      setResult(res.data);
      setForm(emptyReportForm);
      loadSubmittedReports();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const fields = [
    { key: "glucose", label: "Glucose (mg/dL)" }, { key: "HbA1c", label: "HbA1c (%)" }, { key: "bmi", label: "BMI" },
    { key: "sysBP", label: "Systolic BP" }, { key: "diaBP", label: "Diastolic BP" }, { key: "chol", label: "Cholesterol" },
    { key: "hemo", label: "Hemoglobin" }, { key: "creatinine", label: "Creatinine" }, { key: "alt", label: "ALT" }, { key: "ast", label: "AST" },
  ];

  const needsForm = !profile || profile.status === "rejected" || profile.status === "cancelled";

  return (
    <>
      <style>{`
        .lab-main { max-width: 700px; margin: 40px auto; padding: 0 24px; }
        .lab-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; margin-bottom: 20px; }
        @media (max-width: 600px) {
          .lab-main { padding: 0 16px !important; margin: 20px auto !important; }
          .lab-grid { grid-template-columns: 1fr; }
        }
      `}</style>
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

        <main className="lab-main">
          {loading && <p style={styles.notice}>Loading...</p>}

          {!loading && profile && profile.status === "rejected" && (
            <div style={styles.rejectBanner}>Rejected: {profile.reject_reason || "No reason given"}. Please resubmit below.</div>
          )}
          {!loading && profile && profile.status === "cancelled" && (
            <div style={styles.rejectBanner}>Your request was cancelled by admin. Please resubmit below.</div>
          )}

          {!loading && needsForm && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>{profile ? "Resubmit your lab profile" : "Complete your lab profile"}</h3>
              <p style={styles.emptyText}>Upload a verification document. Submission is disabled until attached.</p>
              {profileError && <p style={styles.error}>{profileError}</p>}
              <form onSubmit={handleSubmitProfile}>
                <label style={styles.label}>Lab name</label>
                <input style={{ ...styles.input, marginBottom: "12px" }} type="text" value={profileForm.lab_name} onChange={(e) => setProfileForm({ ...profileForm, lab_name: e.target.value })} required />
                <label style={styles.label}>Phone number</label>
                <input style={{ ...styles.input, marginBottom: "16px" }} type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="03001234567" />
                <label style={styles.uploadLabel}>
                  {profileForm.file ? `✓ ${profileForm.file.name}` : "Upload verification document (required)"}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setProfileForm({ ...profileForm, file: e.target.files[0] })} style={styles.fileInput} />
                </label>
                <button type="submit" style={styles.button} disabled={savingProfile || !profileForm.file}>
                  {savingProfile ? "Submitting..." : "Submit for verification"}
                </button>
              </form>
            </div>
          )}

          {!loading && profile && profile.status === "pending" && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Verification pending</h3>
              <p style={styles.labName}>{profile.lab_name}</p>
              <span style={styles.badgePending}>Pending review</span>
            </div>
          )}

          {!loading && profile && profile.status === "verified" && (
            <>
              <div style={{ ...styles.card, marginBottom: "20px" }}>
                <div style={styles.profileRow}>
                  <div>
                    <p style={styles.labName}>{profile.lab_name}</p>
                    {profile.phone && <p style={styles.rowMeta}>📞 {profile.phone}</p>}
                  </div>
                  <span style={styles.badgeSuccess}>Verified</span>
                </div>
              </div>

              <h2 style={styles.heading}>Submit patient report</h2>
              <p style={styles.subheading}>Only age is required — missing values use healthy defaults.</p>

              <div style={styles.card}>
                {error && <p style={styles.error}>{error}</p>}
                <form onSubmit={handleSubmit}>
                  <label style={styles.label}>Patient email</label>
                  <input style={{ ...styles.input, marginBottom: "16px" }} type="email" value={form.patient_email} onChange={(e) => handleChange("patient_email", e.target.value)} required />
                  <div className="lab-grid">
                    <div>
                      <label style={styles.label}>Age</label>
                      <input style={styles.input} type="text" value={form.age} onChange={(e) => handleChange("age", e.target.value)} required />
                    </div>
                    <div>
                      <label style={styles.label}>Gender</label>
                      <select style={styles.input} value={form.gender} onChange={(e) => handleChange("gender", e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    {fields.map((f) => (
                      <div key={f.key}>
                        <label style={styles.label}>{f.label} <span style={styles.optional}>(optional)</span></label>
                        <input style={styles.input} type="text" value={form[f.key]} onChange={(e) => handleChange(f.key, e.target.value)} placeholder="leave blank if unknown" />
                      </div>
                    ))}
                  </div>
                  <button type="submit" style={styles.button} disabled={submitting}>{submitting ? "Submitting..." : "Submit report"}</button>
                </form>
              </div>

              {result && (
                <div style={{ ...styles.card, marginTop: "20px" }}>
                  <h3 style={styles.sectionTitle}>Report submitted</h3>
                  <div style={styles.badgeRow}>
                    {Object.entries(result.risk_results).map(([key, val]) => (
                      <span key={key} style={val === 1 ? styles.badgeDanger : styles.badgeSuccess}>{key.replace("_", " ")}: {val === 1 ? "at risk" : "healthy"}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ ...styles.card, marginTop: "20px" }}>
                <h3 style={styles.sectionTitle}>Reports submitted by you</h3>
                {submittedReports.length === 0 && <p style={styles.emptyText}>No reports submitted yet</p>}
                {submittedReports.map((r) => (
                  <div key={r.id} style={styles.row}>
                    <div>
                      <p style={styles.rowName}>{r.uploaded_by_name}</p>
                      <p style={styles.rowMeta}>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</p>
                    </div>
                    <button style={styles.downloadBtn} onClick={() => downloadPdf(r.id)}>Download PDF</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#F0F5F5", fontFamily: "'IBM Plex Sans', sans-serif" },
  banner: { position: "relative", height: "200px", overflow: "hidden" },
  bgVideo: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 55%" },
  overlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(180deg, rgba(15,92,92,0.55) 0%, rgba(10,40,40,0.75) 100%)" },
  bannerContent: { position: "relative", height: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 32px" },
  logo: { fontFamily: "'Fraunces', serif", fontSize: "22px", color: "#fff", margin: 0 },
  logoutBtn: { padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 24px" },
  notice: { color: "#8A6D3B", fontSize: "13px", marginBottom: "16px" },
  rejectBanner: { background: "#FBE9E7", color: "#C0392B", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  profileRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  labName: { fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700, color: "#0F5C5C", margin: "0 0 8px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3", marginBottom: "16px" },
  label: { fontSize: "12px", color: "#3D5555", display: "block", marginBottom: "4px" },
  optional: { color: "#8FA3A3", fontWeight: 400, fontSize: "11px" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #D5E3E3", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", fontFamily: "'IBM Plex Mono', monospace", background: "#FAFCFC" },
  uploadLabel: { display: "block", fontSize: "13px", color: "#0F5C5C", fontWeight: 600, padding: "14px", border: "1px dashed #7BA8A8", borderRadius: "8px", textAlign: "center", cursor: "pointer", background: "#F7FBFB", marginBottom: "16px" },
  fileInput: { display: "block", marginTop: "8px", fontSize: "12px" },
  button: { padding: "12px 24px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C", borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: "pointer" },
  error: { color: "#C0392B", fontSize: "13px", marginBottom: "12px" },
  badgeRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  badgeDanger: { background: "#FBE9E7", color: "#C0392B", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize" },
  badgeSuccess: { background: "#E8F5E9", color: "#2E8B57", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize" },
  badgePending: { background: "#FFF3CD", color: "#8A6D3B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #EFF5F5", gap: "12px" },
  rowName: { fontSize: "14px", color: "#3D5555", margin: 0, fontWeight: 500 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: "2px 0 0" },
  downloadBtn: { padding: "6px 14px", background: "transparent", color: "#0F5C5C", border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
};