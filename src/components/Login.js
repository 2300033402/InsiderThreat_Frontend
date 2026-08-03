import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [generatedCaptcha, setGeneratedCaptcha] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // --- CAPTCHA GENERATOR ---
  const generateCaptcha = useCallback(() => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(result);
    setCaptchaInput(""); // Reset input on refresh
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const login = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // 1. Validate CAPTCHA locally first
    if (captchaInput.toUpperCase() !== generatedCaptcha) {
      setErrorMsg("⚠️ Security Verification Failed: Invalid CAPTCHA.");
      generateCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post("/api/login", { username, password });
      if (res.data.status === "success") {
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("userId", res.data.userId);
        localStorage.setItem("trustToken", res.data.trustToken);
        navigate(res.data.role === "ADMIN" ? "/admin" : "/user");
      } else {
        setErrorMsg("⚠️ Access Denied: Invalid Credentials.");
        setIsLoading(false);
        generateCaptcha();
      }
    } catch (err) {
      setErrorMsg("❌ Connection Error: Backend Unreachable.");
      setIsLoading(false);
      generateCaptcha();
    }
  };

  return (
    <div style={styles.container}>
      {/* LEFT SIDE: CYBER VISUALS */}
      <div style={styles.imageSection}>
        <div style={styles.imageOverlay} />
        <div style={styles.brandContent}>
          <div style={styles.securityTag}>SECURE NODE: ACTIVE</div>
          <h1 style={styles.brandTitle}>
            <span style={{ fontWeight: 300 }}>SKILLPAL</span> <br />
            <span style={{ color: "#6366f1" }}>ZERO TRUST</span>
          </h1>
          <p style={styles.brandSubtitle}>
            Continuous Insider Threat Detection & Behavioral Monitoring System.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: AUTH FORM */}
      <div style={styles.formSection}>
        <div style={styles.formCard}>
          <div style={styles.headerArea}>
            <h2 style={styles.heading}>Workstation Login</h2>
            <p style={styles.subHeading}>Authenticate to access the monitoring console.</p>
          </div>

          {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

          <form onSubmit={login}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Identity (Username)</label>
              <input 
                style={styles.input} 
                placeholder="Enter username..." 
                value={username}
                onChange={(e) => setUsername(e.target.value)} 
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Access Key (Password)</label>
              <input 
                type="password" 
                style={styles.input} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>

            {/* CAPTCHA SECTION */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Human Verification</label>
              <div style={styles.captchaRow}>
                <div style={styles.captchaDisplay}>
                   {generatedCaptcha.split('').map((char, i) => (
                     <span key={i} style={{ 
                       display: 'inline-block', 
                       transform: `rotate(${Math.random() * 20 - 10}deg)`,
                       margin: '0 2px'
                     }}>{char}</span>
                   ))}
                </div>
                <button 
                  type="button" 
                  onClick={generateCaptcha} 
                  style={styles.refreshBtn}
                  title="Refresh Captcha"
                >
                  🔄
                </button>
              </div>
              <input 
                style={{...styles.input, marginTop: '10px'}} 
                placeholder="Type the code above" 
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)} 
                required
              />
            </div>

            <button 
              type="submit" 
              style={isLoading ? styles.buttonDisabled : styles.button}
              disabled={isLoading}
            >
              {isLoading ? "VERIFYING IDENTITY..." : "INITIALIZE SESSION"}
            </button>
          </form>

          <div style={styles.footer}>
            <p>New Personnel?</p>
            <button 
              onClick={() => navigate("/signup")}
              style={styles.linkButton}
            >
              Request Access Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // ... (keeping previous container, imageSection, etc.)
  container: { display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", backgroundColor: "#0a0c10", color: "#e2e8f0" },
  imageSection: { flex: 1.2, backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "60px" },
  imageOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(180deg, rgba(10, 12, 16, 0.2) 0%, #0a0c10 100%)" },
  brandContent: { position: "relative", zIndex: 2, maxWidth: "500px" },
  securityTag: { display: "inline-block", padding: "4px 12px", backgroundColor: "rgba(99, 102, 241, 0.2)", border: "1px solid #6366f1", borderRadius: "20px", fontSize: "10px", fontWeight: "bold", letterSpacing: "2px", color: "#818cf8", marginBottom: "20px" },
  brandTitle: { fontSize: "48px", margin: "0 0 15px 0", lineHeight: "1.1", letterSpacing: "-1px" },
  brandSubtitle: { color: "#94a3b8", fontSize: "16px", lineHeight: "1.6", margin: 0 },
  formSection: { flex: 1, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0a0c10" },
  formCard: { width: "100%", maxWidth: "400px", padding: "40px", backgroundColor: "#11141b", borderRadius: "24px", border: "1px solid #1e293b" },
  headerArea: { marginBottom: "30px" },
  heading: { fontSize: "24px", fontWeight: "bold", color: "#fff", margin: "0 0 8px 0" },
  subHeading: { color: "#64748b", fontSize: "14px", margin: 0 },
  errorBanner: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "12px", borderRadius: "12px", marginBottom: "24px", fontSize: "13px", textAlign: "center" },
  inputGroup: { marginBottom: "20px" },
  label: { display: "block", marginBottom: "10px", fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" },
  input: { width: "100%", padding: "14px 16px", fontSize: "15px", backgroundColor: "#0a0c10", border: "1px solid #334155", borderRadius: "12px", color: "#fff", outline: "none", boxSizing: "border-box" },
  
  // NEW CAPTCHA STYLES
  captchaRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  captchaDisplay: {
    flex: 1,
    background: "repeating-linear-gradient(45deg, #0f172a, #0f172a 10px, #1e293b 10px, #1e293b 20px)", // Diagonal security lines
    color: "#6366f1",
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: "8px",
    padding: "12px",
    borderRadius: "12px",
    textAlign: "center",
    userSelect: "none",
    border: "1px solid #334155",
    fontFamily: "'Courier New', Courier, monospace"
  },
  refreshBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    color: "#fff",
    padding: "12px",
    cursor: "pointer",
    fontSize: "18px"
  },

  button: { width: "100%", padding: "16px", backgroundColor: "#6366f1", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  buttonDisabled: { width: "100%", padding: "16px", backgroundColor: "#1e293b", color: "#475569", border: "none", borderRadius: "12px", fontSize: "14px", cursor: "not-allowed", marginTop: "10px" },
  footer: { marginTop: "30px", textAlign: "center", borderTop: "1px solid #1e293b", paddingTop: "20px", fontSize: "13px", color: "#64748b" },
  linkButton: { background: "none", border: "none", color: "#818cf8", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }
};

export default Login;