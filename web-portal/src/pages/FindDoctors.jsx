import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function FindDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Location not supported by your browser. Showing all verified doctors/labs instead.");
      loadAll();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loadNearby(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setError("Location permission denied. Showing all verified doctors/labs instead.");
        loadAll();
      }
    );
  }, []);

  const loadNearby = async (lat, lng) => {
    try {
      const [docRes, labRes] = await Promise.all([
        api.get(`/doctors/nearby?lat=${lat}&lng=${lng}&radius_km=50`),
        api.get(`/labs/nearby?lat=${lat}&lng=${lng}&radius_km=50`),
      ]);
      setDoctors(docRes.data);
      setLabs(labRes.data);
    } catch (err) {
      setError("Could not load nearby doctors/labs.");
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    try {
      const [docRes, labRes] = await Promise.all([
        api.get("/doctors/nearby"),
        api.get("/labs/nearby"),
      ]);
      setDoctors(docRes.data);
      setLabs(labRes.data);
    } catch (err) {
      setError((prev) => prev + " Could not load list.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.logo}>MedIntel AI</h1>
        <Link to="/patient" style={styles.backLink}>Back to dashboard</Link>
      </header>

      <main style={styles.main}>
        <h2 style={styles.heading}>Find doctors & labs</h2>
        <p style={styles.subheading}>Verified providers, sorted by distance when location is available</p>

        {error && <p style={styles.notice}>{error}</p>}
        {loading && <p style={styles.notice}>Loading...</p>}

        {!loading && (
          <>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Doctors</h3>
              {doctors.length === 0 && <p style={styles.emptyText}>No verified doctors found nearby</p>}
              {doctors.map((doc) => (
                <div key={doc.id} style={styles.row}>
                  <div>
                    <p style={styles.rowName}>{doc.name}</p>
                    <p style={styles.rowMeta}>{doc.specialization}</p>
                  </div>
                  <span style={styles.verifiedBadge}>Verified</span>
                </div>
              ))}
            </div>

            <div style={{ ...styles.card, marginTop: "20px" }}>
              <h3 style={styles.sectionTitle}>Laboratories</h3>
              {labs.length === 0 && <p style={styles.emptyText}>No verified labs found nearby</p>}
              {labs.map((lab) => (
                <div key={lab.id} style={styles.row}>
                  <div>
                    <p style={styles.rowName}>{lab.lab_name}</p>
                  </div>
                  <span style={styles.verifiedBadge}>Verified</span>
                </div>
              ))}
            </div>
          </>
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
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 16px" },
  notice: { color: "#8A6D3B", fontSize: "13px", marginBottom: "16px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3" },
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: "1px solid #EFF5F5",
  },
  rowName: { fontSize: "14px", color: "#3D5555", margin: 0, fontWeight: 500 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: 0 },
  verifiedBadge: {
    background: "#E8F5E9", color: "#2E8B57", fontSize: "11px",
    padding: "3px 10px", borderRadius: "6px", fontWeight: 600,
  },
};