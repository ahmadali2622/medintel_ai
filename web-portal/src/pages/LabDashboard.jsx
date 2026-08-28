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
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ lab_name: "", lat: "", lng: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [form, setForm] = useState(emptyReportForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const loadProfile = () => {
    setLoading(true);
    api.get("/labs/my-profile")
      .then((res) => {
        setProfile(res.data);
        setNeedsProfile(false);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setNeedsProfile(true);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    loadProfile();
  }, [navigate]);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.post("/labs/register", {
        lab_name: profileForm.lab_name,
        lat: profileForm.lat ? parseFloat(profileForm.lat) : null,
        lng: profileForm.lng ? parseFloat(profileForm.lng) : null,
      });
      loadProfile();
    } catch (err) {
      alert("Could not create lab profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);
    try {
      const toNum = (v) => (v === "" || v === undefined ? null : parseFloat(v));
      const payload = {
        patient_email: form.patient_email,
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
      const res = await api.post("/reports/lab-submit", payload);
      setResult(res.data);
      setForm(emptyReportForm);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit report. Check the patient email is correct and registered.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const fields = [
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

          {!loading && needsProfile && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Complete your lab profile</h3>
              <p style={styles.emptyText}>Submit your lab details for admin verification.</p>
              <form onSubmit={handleCreateProfile}>
                <label style={styles.label}>Lab name</label>
                <input
                  style={{ ...styles.input, marginBottom: "12px" }}
                  type="text"
                  value={profileForm.lab_name}
                  onChange={(e) => setProfileForm({ ...profileForm, lab_name: e.target.value })}
                  required
                />
                <label style={styles.label}>Latitude <span style={styles.optional}>(optional)</span></label>
                <input
                  style={{ ...styles.input, marginBottom: "12px" }}
                  type="text"
                  value={profileForm.lat}
                  onChange={(e) => setProfileForm({ ...profileForm, lat: e.target.value })}
                />
                <label style={styles.label}>Longitude <span style={styles.optional}>(optional)</span></label>
                <input
                  style={{ ...styles.input, marginBottom: "16px" }}
                  type="text"
                  value={profileForm.lng}
                  onChange={(e) => setProfileForm({ ...profileForm, lng: e.target.value })}
                />
                <button type="submit" style={styles.button} disabled={savingProfile}>
                  {savingProfile ? "Submitting..." : "Submit for verification"}
                </button>
              </form>
            </div>
          )}

          {!loading && profile && (
            <>
              <div style={{ ...styles.card, marginBottom: "20px" }}>
                <div style={styles.profileRow}>
                  <div>
                    <p style={styles.rowName}>{profile.lab_name}</p>
                  </div>
                  <span style={profile.verified ? styles.badgeSuccess : styles.badgePending}>
                    {profile.verified ? "Verified" : "Pending verification"}
                  </span>
                </div>
              </div>

              <h2 style={styles.heading}>Submit patient report</h2>
              <p style={styles.subheading}>Enter the patient's registered email and lab values. Only age is required.</p>

              <div style={styles.card}>
                {error && <p style={styles.error}>{error}</p>}
                <form onSubmit={handleSubmit}>
                  <label style={styles.label}>Patient email</label>
                  <input
                    style={{ ...styles.input, marginBottom: "16px" }}
                    type="email"
                    value={form.patient_email}
                    onChange={(e) => handleChange("patient_email", e.target.value)}
                    placeholder="patient@example.com"
                    required
                  />

                  <div className="lab-grid">
                    <div>
                      <label style={styles.label}>Age</label>
                      <input
                        style={styles.input}
                        type="text"
                        value={form.age}
                        onChange={(e) => handleChange("age", e.target.value)}
                        required
                      />
                    </div>
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
                    {fields.map((f) => (
                      <div key={f.key}>
                        <label style={styles.label}>{f.label} <span style={styles.optional}>(optional)</span></label>
                        <input
                          style={styles.input}
                          type="text"
                          value={form[f.key]}
                          onChange={(e) => handleChange(f.key, e.target.value)}
                          placeholder="leave blank if unknown"
                        />
                      </div>
                    ))}
                  </div>

                  <button type="submit" style={styles.button} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit report"}
                  </button>
                </form>
              </div>

              {result && (
                <div style={{ ...styles.card, marginTop: "20px" }}>
                  <h3 style={styles.sectionTitle}>Report submitted successfully</h3>
                  <div style={styles.badgeRow}>
                    {Object.entries(result.risk_results).map(([key, val]) => (
                      <span key={key} style={val === 1 ? styles.badgeDanger : styles.badgeSuccess}>
                        {key.replace("_", " ")}: {val === 1 ? "at risk" : "healthy"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  profileRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3", marginBottom: "16px" },
  label: { fontSize: "12px", color: "#3D5555", display: "block", marginBottom: "4px" },
  optional: { color: "#8FA3A3", fontWeight: 400, fontSize: "11px" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #D5E3E3", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", fontFamily: "'IBM Plex Mono', monospace", background: "#FAFCFC" },
  button: { padding: "12px 24px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C", borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: "pointer" },
  error: { color: "#C0392B", fontSize: "13px", marginBottom: "12px" },
  badgeRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  badgeDanger: { background: "#FBE9E7", color: "#C0392B", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize" },
  badgeSuccess: { background: "#E8F5E9", color: "#2E8B57", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", textTransform: "capitalize" },
  badgePending: { background: "#FFF3CD", color: "#8A6D3B", fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" },
};