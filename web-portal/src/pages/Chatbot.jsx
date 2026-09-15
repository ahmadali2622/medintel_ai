import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

function renderFormatted(text) {
  return text.split("\n").map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
      <div key={lineIdx}>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("*") && part.endsWith("*")) {
            return <strong key={i}>{part.slice(1, -1)}</strong>;
          }
          return part;
        })}
      </div>
    );
  });
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi, I'm your MedIntel health assistant. Ask me anything about your health." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // --- ADDED STATES START ---
  const [documentContext, setDocumentContext] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  // --- ADDED STATES END ---
  
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- ADDED FUNCTIONS START ---
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await api.post("/chatbot/upload-document", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.document_text) {
        setDocumentContext(res.data.document_text);
        setDocumentName(file.name);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Could not process document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDocument = () => {
    setDocumentContext(null);
    setDocumentName("");
  };
  // --- ADDED FUNCTIONS END ---

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // --- MODIFIED API CALL START ---
      const res = await api.post("/chatbot/message", {
        message: userMsg.content,
        history: updatedMessages,
        document_context: documentContext,
      });
      // --- MODIFIED API CALL END ---
      
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .chatbot-main {
          max-width: 600px;
          margin: 40px auto;
          padding: 0 24px;
        }
        @media (max-width: 600px) {
          .chatbot-main {
            padding: 0 12px !important;
            margin: 16px auto !important;
          }
          .chat-window {
            height: 60vh !important;
          }
        }
      `}</style>
      <div style={styles.page}>
        <header style={styles.header}>
          <h1 style={styles.logo}>MedIntel AI</h1>
          <Link to="/patient" style={styles.backLink}>Back to dashboard</Link>
        </header>

        <main className="chatbot-main">
          <h2 style={styles.heading}>Health chatbot</h2>
          <p style={styles.subheading}>Not a substitute for professional medical advice</p>

          <div style={styles.chatWindow} className="chat-window">
            {messages.map((msg, i) => (
              <div key={i} style={msg.role === "user" ? styles.userRow : styles.botRow}>
                <div style={msg.role === "user" ? styles.userBubble : styles.botBubble}>
                  {renderFormatted(msg.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div style={styles.botRow}>
                <div style={styles.botBubble}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* --- ADDED UPLOAD UI START --- */}
          {documentName && (
            <div style={styles.docBadge}>
              📄 {documentName}
              <button style={styles.removeDocBtn} onClick={removeDocument}>✕</button>
            </div>
          )}
          <label style={styles.uploadLabel}>
            {uploadingDoc ? "Processing..." : "📎 Attach a document"}
            <input type="file" accept=".pdf" onChange={handleDocumentUpload} style={styles.fileInput} disabled={uploadingDoc} />
          </label>
          {/* --- ADDED UPLOAD UI END --- */}

          <form onSubmit={sendMessage} style={styles.inputRow}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a health question..."
            />
            <button type="submit" style={styles.sendBtn} disabled={loading}>Send</button>
          </form>
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
  subheading: { color: "#6B8080", fontSize: "13px", margin: "0 0 24px" },
  chatWindow: {
    background: "#fff", border: "1px solid #D5E3E3", borderRadius: "10px",
    padding: "20px", height: "400px", overflowY: "auto", marginBottom: "16px",
  },
  userRow: { display: "flex", justifyContent: "flex-end", marginBottom: "12px" },
  botRow: { display: "flex", justifyContent: "flex-start", marginBottom: "12px" },
  userBubble: {
    background: "#0F5C5C", color: "#fff", padding: "10px 14px",
    borderRadius: "10px 10px 2px 10px", maxWidth: "80%", fontSize: "13px", lineHeight: 1.5,
  },
  botBubble: {
    background: "#F0F5F5", color: "#3D5555", padding: "10px 14px",
    borderRadius: "10px 10px 10px 2px", maxWidth: "80%", fontSize: "13px", lineHeight: 1.5,
  },
  inputRow: { display: "flex", gap: "8px" },
  input: {
    flex: 1, padding: "10px 12px", border: "1px solid #D5E3E3", borderRadius: "6px",
    fontSize: "13px", boxSizing: "border-box",
  },
  sendBtn: {
    padding: "10px 20px", background: "#0F5C5C", color: "#fff", border: "1px solid #0F5C5C",
    borderRadius: "6px", fontSize: "13px", cursor: "pointer",
  },
  
  // --- ADDED UPLOAD STYLES START ---
  docBadge: { display: "flex", alignItems: "center", gap: "8px", background: "#F0F5F5", color: "#0F5C5C", fontSize: "12px", padding: "6px 12px", borderRadius: "6px", marginBottom: "8px", width: "fit-content" },
  removeDocBtn: { background: "none", border: "none", color: "#0F5C5C", cursor: "pointer", fontSize: "12px", padding: 0 },
  uploadLabel: { display: "block", fontSize: "12px", color: "#0F5C5C", cursor: "pointer", marginBottom: "8px" },
  fileInput: { display: "none" }
  // --- ADDED UPLOAD STYLES END ---
};