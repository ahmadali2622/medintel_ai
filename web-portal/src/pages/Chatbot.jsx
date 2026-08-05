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
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chatbot/message", { message: userMsg.content });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
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
        <h2 style={styles.heading}>Health chatbot</h2>
        <p style={styles.subheading}>Not a substitute for professional medical advice</p>

        <div style={styles.chatWindow}>
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
  main: { maxWidth: "600px", margin: "40px auto", padding: "0 24px" },
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
};