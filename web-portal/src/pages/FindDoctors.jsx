import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function FindDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingFor, setBookingFor] = useState(null);
  const [form, setForm] = useState({ scheduled_at: "", patient_phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Location not supported by your browser. Showing all verified doctors/labs instead.");
      loadAll();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadNearby(pos.coords.latitude, pos.coords.longitude),
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

  const openBookingForm = (type, id, name) => {
    setBookingFor({ type, id, name });
    setForm({ scheduled_at: "", patient_phone: "", notes: "" });
    setBookError("");
  };

  const closeBookingForm = () => setBookingFor(null);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setBookError("");
    try {
      const payload = {
        provider_type: bookingFor.type,
        scheduled_at: form.scheduled_at,
        patient_phone: form.patient_phone,
        notes: form.notes,
      };
      if (bookingFor.type === "doctor") payload.doctor_id = bookingFor.id;
      if (bookingFor.type === "lab") payload.lab_id = bookingFor.id;

      await api.post("/appointments/book", payload);
      alert("Appointment booked! Check the Appointments page.");
      closeBookingForm();
    } catch (err) {
      if (err.response?.status === 409) {
        setBookError("That time slot is already booked. Please choose another time.");
      } else {
        setBookError("Could not book appointment. Please check your details.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .find-main { max-width: 700px; margin: 40px auto; padding: 0 24px; }
        @media (max-width: 600px) {
          .find-main { padding: 0 16px !important; margin: 20px auto !important; }
        }
      `}</style>
      <div style={styles.page}>
        <header style={styles.header}>
          <h1 style={styles.logo}>MedIntel AI</h1>
          <Link to="/patient" style={styles.backLink}>Back to dashboard</Link>
        </header>

        <main className="find-main">
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
                    <div style={styles.rowWithPhoto}>
                      {doc.photo_url && (
                        <img src={`${api.defaults.baseURL}/doctors/${doc.id}/photo`} alt={doc.name} style={styles.photo} />
                      )}
                      <div>
                        <p style={styles.rowName}>{doc.name}</p>
                        <p style={styles.rowMeta}>{doc.specialization}</p>
                        {doc.phone && <p style={styles.rowPhone}>📞 {doc.phone}</p>}
                        {doc.average_rating && (
                          <p style={styles.rating}>⭐ {doc.average_rating} ({doc.review_count} reviews)</p>
                        )}
                      </div>
                    </div>
                    <div style={styles.rowActions}>
                      <span style={styles.verifiedBadge}>Verified</span>
                      <button style={styles.bookBtn} onClick={() => openBookingForm("doctor", doc.id, doc.name)}>Book</button>
                    </div>
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
                      {lab.phone && <p style={styles.rowPhone}>📞 {lab.phone}</p>}
                    </div>
                    <div style={styles.rowActions}>
                      <span style={styles.verifiedBadge}>Verified</span>
                      <button style={styles.bookBtn} onClick={() => openBookingForm("lab", lab.id, lab.lab_name)}>Book</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {bookingFor && (
            <div style={styles.modalOverlay} onClick={closeBookingForm}>
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 style={styles.sectionTitle}>Book with {bookingFor.name}</h3>

                {bookError && <p style={styles.error}>{bookError}</p>}

                <form onSubmit={handleBookSubmit}>
                  <label style={styles.label}>Date & time</label>
                  <input
                    style={styles.input}
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    required
                  />

                  <label style={styles.label}>Your contact number</label>
                  <input
                    style={styles.input}
                    type="tel"
                    placeholder="03001234567"
                    value={form.patient_phone}
                    onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                    required
                  />

                  <label style={styles.label}>Reason for visit <span style={styles.optional}>(optional)</span></label>
                  <input
                    style={styles.input}
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />

                  <div style={styles.modalActions}>
                    <button type="button" style={styles.cancelModalBtn} onClick={closeBookingForm}>Cancel</button>
                    <button type="submit" style={styles.confirmBookBtn} disabled={submitting}>
                      {submitting ? "Booking..." : "Confirm booking"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
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
  heading: { fontFamily: "'Fraunces', serif", fontSize: "24px", color: "#0F5C5C", margin: "0 0 4px" },
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 16px" },
  notice: { color: "#8A6D3B", fontSize: "13px", marginBottom: "16px" },
  card: { background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px", padding: "24px" },
  sectionTitle: { fontSize: "14px", color: "#0F5C5C", margin: "0 0 12px", fontWeight: 600 },
  emptyText: { fontSize: "13px", color: "#8FA3A3" },
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: "1px solid #EFF5F5", gap: "12px",
  },
  rowWithPhoto: { display: "flex", gap: "10px", alignItems: "flex-start" },
  photo: { width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" },
  rowName: { fontSize: "14px", color: "#3D5555", margin: 0, fontWeight: 600 },
  rowMeta: { fontSize: "12px", color: "#8FA3A3", margin: "2px 0 0" },
  rowPhone: { fontSize: "12px", color: "#0F5C5C", margin: "2px 0 0" },
  rating: { fontSize: "12px", color: "#8A6D3B", margin: "2px 0 0" },
  rowActions: { display: "flex", alignItems: "center", gap: "8px" },
  verifiedBadge: {
    background: "#E8F5E9", color: "#2E8B57", fontSize: "11px",
    padding: "3px 10px", borderRadius: "6px", fontWeight: 600,
  },
  bookBtn: {
    padding: "4px 12px", background: "#0F5C5C", color: "#fff",
    border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "11px",
  },
  modalOverlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(15,92,92,0.4)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 100, padding: "16px", boxSizing: "border-box",
  },
  modal: {
    background: "#fff", borderRadius: "10px", padding: "24px",
    width: "100%", maxWidth: "380px", boxSizing: "border-box",
  },
  label: { fontSize: "12px", color: "#3D5555", display: "block", margin: "12px 0 4px" },
  optional: { color: "#8FA3A3", fontWeight: 400 },
  input: {
    width: "100%", padding: "8px 10px", border: "1px solid #D5E3E3", borderRadius: "6px",
    fontSize: "13px", boxSizing: "border-box",
  },
  error: { color: "#C0392B", fontSize: "13px", marginBottom: "8px" },
  modalActions: { display: "flex", gap: "8px", marginTop: "18px" },
  cancelModalBtn: {
    flex: 1, padding: "10px", background: "transparent", color: "#6B8080",
    border: "1px solid #D5E3E3", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
  },
  confirmBookBtn: {
    flex: 1, padding: "10px", background: "#0F5C5C", color: "#fff",
    border: "1px solid #0F5C5C", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
  },
};