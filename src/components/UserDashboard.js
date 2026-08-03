import React, { useState, useEffect } from "react";
import api from "../api";

/**
 * SKILLPAL OS - SECURE WORKSTATION 
 * INTEGRATED WITH SENTINEL AI BEHAVIORAL ENGINE & NMAP AUDITOR
 */
function UserDashboard() {
  const userId = localStorage.getItem("userId");
  const [activeApp, setActiveApp] = useState("home");
  const [statusMsg, setStatusMsg] = useState("");
  const [viewData, setViewData] = useState(null);
  
  // App States
  const [browserUrl, setBrowserUrl] = useState("");
  const [emailBody, setEmailBody] = useState(""); 

  // Nmap Auditor States
  const [nmapTarget, setNmapTarget] = useState("scanme.nmap.org");
  const [nmapOutput, setNmapOutput] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Zero Trust & Gatekeeper States
  const [riskData, setRiskData] = useState({ riskScore: 0, isQuarantined: false });
  const [isMfaVerified, setIsMfaVerified] = useState(false); 
  const [pin, setPin] = useState("");
  const [mfaError, setMfaError] = useState(false);
  const [location, setLocation] = useState("Authenticating Location...");

  // ── NEW: Extra UI States ──────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionId] = useState("SID-" + Math.random().toString(36).substring(2, 10).toUpperCase());
  const [activityCount, setActivityCount] = useState(0);
  const [killedProcesses, setKilledProcesses] = useState([]);
  const [inboxOpen, setInboxOpen] = useState(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset forensic view when switching apps
  useEffect(() => {
    setViewData(null);
  }, [activeApp]);

  // --- 1. CLIPBOARD FORENSICS ---
  useEffect(() => {
    const handleCopy = () => {
      const text = window.getSelection().toString();
      if (text.length > 0) {
        logAction("WARNING_DATA_COPY", `Clipboard Copy: "${text.substring(0, 15)}..."`);
        setStatusMsg("⚠️ Warning: Clipboard activity is being monitored.");
      }
    };
    window.addEventListener('copy', handleCopy);
    return () => window.removeEventListener('copy', handleCopy);
  }, []);

  // --- 2. GEOLOCATION ---
  useEffect(() => {
    const checkLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const displayLoc = data.city && data.country_name ? `${data.city}, ${data.country_name}` : "Secure VPN Node";
        setLocation(displayLoc);
        if (data.country_name && data.country_name !== "India") {
           logAction("CRITICAL_GEO_ANOMALY", `Login from ${data.country_name}`);
        }
      } catch (e) { setLocation("Authorized Enterprise Zone"); }
    };
    checkLocation();
  }, []);

  // --- 3. HEARTBEAT & SENTINEL MONITORING ---
  useEffect(() => {
    if (!userId) return;
    const pulse = setInterval(async () => {
      try {
        await api.post(`/api/heartbeat?userId=${userId}`);
        const res = await api.get(`/api/verify-status?userId=${userId}`);
        setRiskData(res.data);
        if (res.data.isQuarantined && (activeApp === "vault" || activeApp === "security" || activeApp === "nmap")) {
            setActiveApp("home");
            setStatusMsg("🚨 ACCESS REVOKED: Security Policy Violation Detected.");
        }
      } catch (e) { console.error("Heartbeat sync error"); }
    }, 3000);
    return () => clearInterval(pulse);
  }, [activeApp, userId]);

  // --- GATEKEEPER ---
  const verifyGatekeeper = async () => {
    try {
      const res = await api.post(`/api/verify-step-up?userId=${userId}`, { pin });
      if (res.data.status === "verified") {
        setIsMfaVerified(true);
        setMfaError(false);
        setStatusMsg("✅ Session Authenticated.");
      } else {
        setMfaError(true);
        setPin("");
        setStatusMsg("❌ Access Denied: Invalid Security Pin.");
      }
    } catch (e) { console.error("Gatekeeper connection failure"); }
  };

  // --- LOGGING ENGINE ---
  const logAction = async (type, detail) => {
    try {
      await api.post(`/api/log-complex-activity?userId=${userId}`, { type, detail });
      setActivityCount(prev => prev + 1);
    } catch (e) { 
      if (e.response && e.response.status === 403) {
          setStatusMsg("⛔ DATA LOSS PREVENTION (DLP) BLOCK ACTIVE");
      }
    }
  };

  // --- EXISTING FEATURE HANDLERS (unchanged) ---
  const handleNmapScan = async () => {
    setIsScanning(true);
    setNmapOutput(`Initializing Nmap 7.98 Engine...\nBypassing Kernel Restrictions...\nScanning ${nmapTarget}...`);
    setStatusMsg("🚀 NETWORK AUDIT IN PROGRESS...");
    try {
      const res = await api.get(`/api/tools/nmap-scan?target=${nmapTarget}&userId=${userId}`);
      setNmapOutput(res.data.result);
      setStatusMsg("✅ Scan Complete. Target Analyzed.");
      setViewData({ title: "NMAP VULNERABILITY REPORT", content: res.data.result, type: "forensic" });
    } catch (e) {
      setNmapOutput("CRITICAL ERROR: Failed to communicate with Nmap binary.");
    }
    setIsScanning(false);
  };

  const handleFileDownload = (file) => {
    setStatusMsg(`Syncing ${file.name}...`);
    logAction("CRITICAL_DATA_THEFT", `Download Attempt: ${file.name}`);
    const content = file.name.includes("Layoff") 
      ? "CONFIDENTIAL: Internal restructuring scheduled for Sept. Affecting 15% of staff." 
      : file.name.includes("CEO")
      ? "INTERNAL USE ONLY: CEO Q3 Bonus calculated at $4.2M."
      : file.name.includes("Network")
      ? "RESTRICTED: Full network topology and IP schema for all 3 offices."
      : "CLASSIFIED: Source code repository access tokens — expires Dec 2026.";
    setViewData({ title: file.name, content: content, type: "forensic" });
    if (file.name === "Q3_Layoff_Plan_Draft.docx") {
       const link = document.createElement("a"); 
       link.href = "/files/Q3_Layoff_Plan_Draft.docx"; 
       link.download = file.name; 
       document.body.appendChild(link); 
       link.click(); 
       document.body.removeChild(link);
    }
    setTimeout(() => setStatusMsg(`✅ Download Authorized`), 1500);
  };

  const handleSendEmail = () => {
    setStatusMsg("Scanning email content...");
    logAction("MAIL_EXFILTRATION_TEST", `DLP Scan on: "${emailBody}"`);
    setViewData({ 
        title: "Email Dispatch Log", 
        content: `Recipient: competitor@global.com\nPayload: ${emailBody || 'Empty Body'}\nStatus: Logged by Sentinel.`,
        type: "log"
    });
    setTimeout(() => setStatusMsg("✅ Email Dispatched"), 1500);
  };

  const handleUsbMount = () => {
    setStatusMsg("Initializing Hardware Port...");
    logAction("CRITICAL_HARDWARE_VIOLATION", "USB Port Bypass Attempted");
    setViewData({
        title: "Hardware Mount Success",
        content: "Drive ID: DISK_X86_VOL_09\nStatus: Mounted (Kernel Bypass Active)",
        type: "success"
    });
    setTimeout(() => setStatusMsg("✅ Virtual Drive Mounted"), 2000);
  };

  const handleRevealPassword = (service) => {
    setStatusMsg(`Retrieving hash for ${service}...`);
    logAction("CRITICAL_CREDENTIAL_THEFT", `Viewed plain-text credentials for ${service}`);
    const hash = service.includes("AWS") ? "AKIA_PROD_ROOT_KEY: 8x92k-qwerty-7712"
      : service.includes("Bank") ? "SWIFT_TOKEN_SHA256: 0x9f8e7d...a1b2c3"
      : service.includes("GitHub") ? "ghp_xK92mNpQ7rTv3wLs8uYj1hBdCeF4oZ56Rn"
      : "DB_ROOT_PASS: Pr0d@MySQL#2026!";
    setViewData({ title: service, content: `DECRYPTED HASH: ${hash}`, type: "vault" });
    if (service === "AWS Root Console") {
      new Image().src = "http://canarytokens.com/feedback/articles/yihd32kx1frunhw8w8ixmox48/post.jsp";
    }
    setTimeout(() => setStatusMsg(`✅ Credentials decrypted`), 1000);
  };

  const handleRestore = (filename) => {
    setStatusMsg(`Recovering ${filename}...`);
    logAction("WARNING_DATA_RECOVERY", `File Recovery: ${filename}`);
    setViewData({
        title: `Restored: ${filename}`,
        content: "File Integrity Check: 100% OK\nMetadata: Re-indexed to local repository.",
        type: "success"
    });
    setTimeout(() => setStatusMsg(`✅ File restored`), 1000);
  };

  const handleBrowse = () => {
    if(!browserUrl) return;
    setStatusMsg(`Routing through Proxy: ${browserUrl}...`);
    logAction("WARNING_PROHIBITED_BROWSING", `Web Request: ${browserUrl}`);
    setViewData({
        title: "Proxy Response Header",
        content: `HTTP/1.1 200 OK\nServer: Zero-Trace-Gateway\nTarget: ${browserUrl}`,
        type: "log"
    });
    setTimeout(() => setStatusMsg(`✅ Request Finished`), 1000);
  };

  const handleDisableFirewall = () => {
    setStatusMsg("Modifying System Policy...");
    logAction("CRITICAL_SECURITY_TAMPERING", "Firewall Service Termination Attempted");
    setViewData({
        title: "Kernel Warning",
        content: "CRITICAL: Firewall service killed. Host exposed to incoming traffic.",
        type: "danger"
    });
    setTimeout(() => setStatusMsg("⚠️ Security Services Suspended"), 2000);
  };

  // ── NEW HANDLERS ──────────────────────────────────────────────────────────

  const handleKillProcess = (proc) => {
    logAction("CRITICAL_SECURITY_TAMPERING", `Process killed: ${proc.name} (PID ${proc.pid})`);
    setKilledProcesses(prev => [...prev, proc.pid]);
    setStatusMsg(`⚠️ Process ${proc.name} terminated — logged by Sentinel.`);
  };

  // ── INFO DISPLAY (unchanged) ──────────────────────────────────────────────
  const InfoDisplay = () => {
    if (!viewData) return null;
    const colors = { forensic: '#ff9f43', log: '#3498db', vault: '#f1c40f', success: '#2ecc71', danger: '#e74c3c' };
    return (
        <div style={{ marginTop: '20px', padding: '20px', background: '#0f1215', borderRadius: '8px', border: `1px solid ${colors[viewData.type] || '#333'}`, fontFamily: 'monospace' }}>
            <div style={{color: colors[viewData.type], fontWeight: 'bold', marginBottom: '10px'}}>[ DATA OUTPUT: {viewData.title} ]</div>
            <div style={{whiteSpace: 'pre-wrap', color: '#ecf0f1', fontSize: '13px'}}>{viewData.content}</div>
        </div>
    );
  };

  // ── MOCK DATA ─────────────────────────────────────────────────────────────

  const deletedFiles = [
    { id: 1, name: "Internal_Audit_Report.docx", date: "Yesterday" },
    { id: 2, name: "Employee_Contact_List.pdf", date: "3 days ago" },
  ];

  // NEW: Extended file list
  const restrictedFiles = [
    { name: "Q3_Layoff_Plan_Draft.docx", size: "2.1 MB", risk: "CRITICAL", label: "CONFIDENTIAL", accessed: "2h ago" },
    { name: "CEO_Bonus_Structure.xlsx", size: "890 KB", risk: "CRITICAL", label: "RESTRICTED", accessed: "1d ago" },
    { name: "Network_Topology_Map.pdf", size: "5.4 MB", risk: "HIGH", label: "INTERNAL", accessed: "3d ago" },
    { name: "Dev_Repo_AccessTokens.txt", size: "12 KB", risk: "HIGH", label: "SECRET", accessed: "5d ago" },
  ];

  // NEW: Vault entries
  const vaultEntries = [
    { label: "AWS_PROD_ROOT", service: "AWS Root Console", icon: "☁️" },
    { label: "CORPORATE_SWIFT_BANK", service: "Corporate Bank Account", icon: "🏦" },
    { label: "GITHUB_ORG_TOKEN", service: "GitHub Org Token", icon: "🐙" },
    { label: "PROD_DB_ROOT", service: "Production Database", icon: "🗄️" },
  ];

  // NEW: Fake inbox
  const inboxEmails = [
    { id: 1, from: "cto@skillpal.com", subject: "Re: Q3 Roadmap — CONFIDENTIAL", time: "09:14 AM", body: "Do not share this outside the leadership team. The restructuring plan affects 3 departments." },
    { id: 2, from: "hr@skillpal.com", subject: "Salary Review 2026 — Internal Only", time: "Yesterday", body: "Please find attached the compensation benchmarking report. This is strictly confidential." },
    { id: 3, from: "it-alerts@skillpal.com", subject: "⚠️ Unusual Login Detected", time: "Yesterday", body: "A login was detected from an unrecognized device at 02:34 AM. If this was not you, contact IT immediately." },
    { id: 4, from: "ceo@skillpal.com", subject: "Project Falcon — Eyes Only", time: "2 days ago", body: "The board has approved Project Falcon. Begin data migration to offshore servers by EOD Friday." },
  ];

  // NEW: Processes
  const processes = [
    { pid: 1042, name: "sentinel_monitor.exe", cpu: "0.2%", mem: "18 MB", status: "SYSTEM", safe: true },
    { pid: 2381, name: "data_sync_agent.exe", cpu: "4.1%", mem: "54 MB", status: "RUNNING", safe: true },
    { pid: 3190, name: "keylogger_v2.exe", cpu: "1.8%", mem: "9 MB", status: "HIDDEN", safe: false },
    { pid: 4402, name: "chrome.exe", cpu: "12.4%", mem: "210 MB", status: "RUNNING", safe: true },
    { pid: 5511, name: "exfil_tool.bat", cpu: "3.3%", mem: "6 MB", status: "HIDDEN", safe: false },
    { pid: 6204, name: "python.exe", cpu: "0.9%", mem: "32 MB", status: "RUNNING", safe: true },
    { pid: 7890, name: "powershell.exe", cpu: "2.1%", mem: "44 MB", status: "SUSPICIOUS", safe: false },
  ];

  // NEW: Login history
  const loginHistory = [
    { time: "Today 09:01 AM", ip: "192.168.1.104", location: "Hyderabad, India", device: "Chrome / Windows", status: "SUCCESS" },
    { time: "Today 02:34 AM", ip: "185.220.101.47", location: "Frankfurt, Germany", device: "Unknown / Linux", status: "SUSPICIOUS" },
    { time: "Yesterday 6:12 PM", ip: "192.168.1.104", location: "Hyderabad, India", device: "Chrome / Windows", status: "SUCCESS" },
    { time: "Yesterday 11:48 AM", ip: "192.168.1.104", location: "Hyderabad, India", device: "Firefox / Windows", status: "SUCCESS" },
    { time: "3 days ago", ip: "103.21.58.200", location: "Mumbai, India", device: "Mobile / Android", status: "SUCCESS" },
  ];

  // ── RISK LABEL HELPER ─────────────────────────────────────────────────────
  const getThreatLabel = (score) => {
    if (score >= 90) return { label: "CRITICAL", color: "#ff4757" };
    if (score >= 60) return { label: "HIGH", color: "#ffa502" };
    if (score >= 30) return { label: "MEDIUM", color: "#f0c060" };
    return { label: "LOW", color: "#2ecc71" };
  };
  const threat = getThreatLabel(riskData.riskScore);

  // ── QUARANTINE SCREEN (unchanged) ─────────────────────────────────────────
  if (riskData.riskScore >= 100) {
    return (
      <div style={quarantineTerminalStyle}>
        <div style={{fontSize: '80px', marginBottom: '20px'}}>🛑</div>
        <h1 style={{fontSize: '32px', letterSpacing: '4px', margin: '0 0 20px 0'}}>[!] WORKSTATION QUARANTINED [!]</h1>
        <div style={forensicBoxStyle}>
           <div style={{color: '#ff4757', fontWeight: 'bold', borderBottom: '1px solid #ff4757', paddingBottom: '10px', marginBottom: '15px'}}>SENTINEL AI: CRITICAL SECURITY INCIDENT REPORT</div>
           <div style={{display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', fontSize: '14px'}}>
              <span>TERMINAL ID:</span> <span style={{color: '#fff'}}>{userId}-ZT-OS</span>
              <span>RISK SCORE:</span> <span style={{color: '#ff4757', fontWeight: 'bold'}}>100.0% (MAXIMUM)</span>
              <span>GEO-NODE:</span> <span style={{color: '#fff'}}>{location}</span>
              <span>ACTION:</span> <span style={{color: '#ff4757'}}>KERNEL LOCK / DATA REVOCATION</span>
           </div>
        </div>
      </div>
    );
  }

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', backgroundColor: '#0f1215' }}>
      
      {/* ZERO TRUST GATEKEEPER OVERLAY (unchanged) */}
      {!isMfaVerified && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{fontSize: '40px', marginBottom: '10px'}}>🛡️</div>
            <h2>ZERO TRUST ACCESS</h2>
            <input type="password" value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="••••" style={modalInputStyle} />
            <button onClick={verifyGatekeeper} style={modalButtonStyle}>AUTHENTICATE</button>
            {mfaError && <div style={{color: '#e74c3c', marginTop: '15px', fontSize: '12px', fontWeight: 'bold'}}>⚠️ ACCESS DENIED</div>}
          </div>
        </div>
      )}

      <div style={{...containerStyle, filter: !isMfaVerified ? "blur(35px)" : "none"}}>
        
        {/* SIDEBAR (new items added at bottom) */}
        <div style={{ width: 260, background: '#1e272e', color: 'white', padding: 25, display:'flex', flexDirection:'column', borderRight: '1px solid #333', overflowY: 'auto' }}>
          <h2 style={{color: '#3498db', margin: '0 0 5px 0'}}>SkillPal OS</h2>
          <small style={{color: '#7f8c8d', marginBottom: '30px'}}>SECURE WORKSTATION</small>
          
          {/* existing nav — untouched */}
          <p onClick={()=>setActiveApp("home")} style={navStyle(activeApp === "home")}>🏠 Dashboard</p>
          <p onClick={()=>setActiveApp("nmap")} style={navStyle(activeApp === "nmap")}>📡 Network Auditor</p>
          <p onClick={()=>setActiveApp("files")} style={navStyle(activeApp === "files")}>📂 File Manager</p>
          <p onClick={()=>setActiveApp("mail")} style={navStyle(activeApp === "mail")}>📧 Secure Mail</p>
          <p onClick={()=>setActiveApp("usb")} style={navStyle(activeApp === "usb")}>🔌 Port Manager</p>
          <p onClick={()=>setActiveApp("trash")} style={navStyle(activeApp === "trash")}>🗑️ Archive Bin</p>
          <p onClick={()=>setActiveApp("browser")} style={navStyle(activeApp === "browser")}>🌍 Web Proxy</p>
          
          <div style={{height:1, background:'#444', margin:'20px 0'}}></div>
          
          <p onClick={()=>!riskData.isQuarantined && setActiveApp("vault")} style={{...navStyle(activeApp === "vault"), opacity: riskData.isQuarantined?0.3:1}}>🔑 Credential Vault</p>
          <p onClick={()=>!riskData.isQuarantined && setActiveApp("security")} style={{...navStyle(activeApp === "security"), opacity: riskData.isQuarantined?0.3:1}}>🛡️ Admin Controls</p>

          {/* NEW nav items */}
          <div style={{height:1, background:'#444', margin:'20px 0'}}></div>
          <small style={{color:'#7f8c8d', fontSize:'10px', letterSpacing:'2px', marginBottom:'10px'}}>SYSTEM</small>
          <p onClick={()=>setActiveApp("processes")} style={navStyle(activeApp === "processes")}>⚙️ Process Manager</p>
          <p onClick={()=>setActiveApp("loginhistory")} style={navStyle(activeApp === "loginhistory")}>🕐 Login History</p>
          <p onClick={()=>setActiveApp("sysmonitor")} style={navStyle(activeApp === "sysmonitor")}>📊 System Monitor</p>
        </div>

        {/* MAIN PANEL */}
        <div style={{ flex: 1, padding: 40, background: '#0f1215', overflowY:'auto', color: '#ecf0f1' }}>
           
          {/* TOP STAT CARDS (existing ones + new session card) */}
          <div style={{display:'flex', gap:20, marginBottom:30, flexWrap:'wrap'}}>
            <div style={statCardStyle}>
              <small>AUTHORIZED ZONE</small><br/><b>{location}</b>
            </div>
            <div style={{...statCardStyle, borderTop: `2px solid ${riskData.riskScore > 50 ? '#e74c3c':'#2ecc71'}`}}>
              <small>SYSTEM RISK LEVEL</small><br/>
              <b style={{color: riskData.riskScore > 50 ? '#e74c3c':'#2ecc71', fontSize: '20px'}}>{riskData.riskScore}%</b>
            </div>
            {/* NEW stat cards */}
            <div style={{...statCardStyle, borderTop: '2px solid #9b59b6'}}>
              <small>SESSION ID</small><br/><b style={{fontSize:'12px', fontFamily:'monospace'}}>{sessionId}</b>
            </div>
            <div style={{...statCardStyle, borderTop: '2px solid #f39c12'}}>
              <small>ACTIONS LOGGED</small><br/><b style={{fontSize:'20px', color:'#f39c12'}}>{activityCount}</b>
            </div>
          </div>

          {statusMsg && <div style={statusBannerStyle}>{statusMsg}</div>}

          {/* ── EXISTING MODULES (completely unchanged) ───────────────────── */}

          {activeApp === "nmap" && (
            <div style={{background: '#1e272e', padding: '25px', borderRadius: '10px'}}>
              <h2>📡 Network Auditor (Nmap Live)</h2>
              <div style={{display: 'flex', gap: 10, margin: '20px 0'}}>
                <input type="text" value={nmapTarget} onChange={(e)=>setNmapTarget(e.target.value)} style={inputBoxStyle} />
                <button onClick={handleNmapScan} disabled={isScanning} style={{...actionBtnStyle, width: '150px'}}>{isScanning ? "SCANNING..." : "RUN SCAN"}</button>
              </div>
              <div style={{background: '#000', color: '#00ff00', padding: '20px', borderRadius: '5px', height: '350px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', border: '1px solid #333', whiteSpace: 'pre-wrap'}}>
                {nmapOutput || "SYSTEM READY. ENTER TARGET TO BEGIN."}
              </div>
              <InfoDisplay />
            </div>
          )}

          {activeApp === "mail" && (
            <div style={{background: '#1e272e', padding: '25px', borderRadius: '10px'}}>
              <h2>📧 Secure Mail</h2>

              {/* NEW: Inbox */}
              <div style={{marginBottom:'30px'}}>
                <h3 style={{color:'#3498db', fontSize:'13px', letterSpacing:'2px'}}>📥 INBOX</h3>
                {inboxEmails.map(email => (
                  <div key={email.id} onClick={() => setInboxOpen(inboxOpen === email.id ? null : email.id)}
                    style={{background:'#0f1215', border:'1px solid #333', borderRadius:'6px', padding:'12px 16px', marginBottom:'8px', cursor:'pointer', borderLeft: `3px solid ${email.from.includes('alert') ? '#ff4757' : '#3498db'}`}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                      <span style={{color:'#fff', fontWeight:'bold', fontSize:'13px'}}>{email.subject}</span>
                      <span style={{color:'#7f8c8d', fontSize:'11px'}}>{email.time}</span>
                    </div>
                    <div style={{color:'#7f8c8d', fontSize:'12px'}}>{email.from}</div>
                    {inboxOpen === email.id && (
                      <div style={{marginTop:'12px', padding:'12px', background:'#1a2332', borderRadius:'4px', color:'#bdc3c7', fontSize:'13px', lineHeight:'1.6'}}>
                        {email.body}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* existing compose area — untouched */}
              <h3 style={{color:'#3498db', fontSize:'13px', letterSpacing:'2px'}}>📤 COMPOSE</h3>
              <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Email body..." style={{...inputBoxStyle, height: '100px'}} />
              <button onClick={handleSendEmail} style={{...actionBtnStyle, marginTop: '20px'}}>EXFILTRATE DATA</button>
              <InfoDisplay />
            </div>
          )}

          {activeApp === "home" && (
            <div>
              {/* NEW: Rich home dashboard */}
              <div style={{background:'#1e272e', padding:'30px', borderRadius:'10px', marginBottom:'20px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'20px'}}>
                  <div>
                    <h1 style={{margin:'0 0 6px 0'}}>Workstation Overview</h1>
                    <p style={{color: '#bdc3c7', margin:0}}>Your activity is monitored by Sentinel AI.</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'monospace', fontSize:'28px', color:'#3498db'}}>{currentTime.toLocaleTimeString()}</div>
                    <div style={{color:'#7f8c8d', fontSize:'12px'}}>{currentTime.toDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Threat level banner */}
              <div style={{background:'#1e272e', border:`1px solid ${threat.color}`, borderLeft:`4px solid ${threat.color}`, borderRadius:'8px', padding:'20px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontSize:'12px', color:'#7f8c8d', marginBottom:'4px', letterSpacing:'2px'}}>CURRENT THREAT LEVEL</div>
                  <div style={{fontSize:'28px', fontWeight:'900', color: threat.color}}>{threat.label}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'12px', color:'#7f8c8d', marginBottom:'8px'}}>RISK METER</div>
                  <div style={{width:'200px', height:'10px', background:'#333', borderRadius:'5px', overflow:'hidden'}}>
                    <div style={{width:`${riskData.riskScore}%`, height:'100%', background: threat.color, transition:'width 0.5s ease', borderRadius:'5px'}}/>
                  </div>
                  <div style={{color: threat.color, fontSize:'13px', marginTop:'6px', fontWeight:'bold'}}>{riskData.riskScore}% Risk Score</div>
                </div>
              </div>

              {/* Quick stats grid */}
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'20px'}}>
                {[
                  { label:'ACTIVE PROCESSES', val: processes.filter(p => !killedProcesses.includes(p.pid)).length, color:'#3498db', icon:'⚙️' },
                  { label:'SUSPICIOUS PROCESSES', val: processes.filter(p => !p.safe && !killedProcesses.includes(p.pid)).length, color:'#ff4757', icon:'🚨' },
                  { label:'UNREAD EMAILS', val: inboxEmails.length, color:'#9b59b6', icon:'📧' },
                ].map((item, i) => (
                  <div key={i} style={{background:'#1e272e', padding:'20px', borderRadius:'8px', border:`1px solid #333`, borderTop:`2px solid ${item.color}`}}>
                    <div style={{fontSize:'22px', marginBottom:'6px'}}>{item.icon}</div>
                    <div style={{fontSize:'28px', fontWeight:'900', color: item.color}}>{item.val}</div>
                    <div style={{fontSize:'11px', color:'#7f8c8d', letterSpacing:'1px'}}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent alerts */}
              <div style={{background:'#1e272e', padding:'20px', borderRadius:'10px'}}>
                <h3 style={{color:'#ff4757', fontSize:'13px', letterSpacing:'2px', marginTop:0}}>🚨 RECENT SENTINEL ALERTS</h3>
                {[
                  { msg:'Clipboard activity intercepted', time:'Just now', color:'#ffa502' },
                  { msg:'Geolocation verified — Hyderabad, India', time:'Session start', color:'#2ecc71' },
                  { msg:'Step-up MFA completed successfully', time:'Session start', color:'#2ecc71' },
                  { msg:'2 suspicious processes detected in memory', time:'Background scan', color:'#ff4757' },
                ].map((alert, i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px dashed #333', fontSize:'13px'}}>
                    <span style={{color: alert.color}}>● {alert.msg}</span>
                    <span style={{color:'#7f8c8d', fontSize:'11px'}}>{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* existing files module — more rows added */}
          {activeApp === "files" && (
            <div style={{background: '#1e272e', padding: '25px', borderRadius: '10px'}}>
              <h2>📂 Restricted Files</h2>
              <table width="100%" cellPadding={15} style={{textAlign: 'left', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{color: '#7f8c8d', borderBottom: '1px solid #333'}}>
                    <th>Name</th><th>Size</th><th>Classification</th><th>Last Accessed</th><th>Risk</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {restrictedFiles.map((file, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #333'}}>
                      <td style={{fontFamily:'monospace', fontSize:'13px'}}>{file.name}</td>
                      <td style={{color:'#7f8c8d', fontSize:'12px'}}>{file.size}</td>
                      <td><span style={{background: file.label==='CONFIDENTIAL'?'rgba(255,71,87,0.15)': file.label==='RESTRICTED'?'rgba(255,165,2,0.15)':'rgba(52,152,219,0.15)', color: file.label==='CONFIDENTIAL'?'#ff4757':file.label==='RESTRICTED'?'#ffa502':'#3498db', padding:'3px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'bold'}}>{file.label}</span></td>
                      <td style={{color:'#7f8c8d', fontSize:'12px'}}>{file.accessed}</td>
                      <td style={{color: file.risk==='CRITICAL'?'#ff4757':'#ffa502', fontWeight:'bold', fontSize:'12px'}}>{file.risk}</td>
                      <td><button onClick={()=>handleFileDownload({name:file.name})} style={actionBtnStyle}>Download</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <InfoDisplay />
            </div>
          )}

          {/* existing vault — more entries added */}
          {activeApp === "vault" && (
            <div style={{background: '#1e272e', padding: '25px', borderRadius: '10px'}}>
              <h2>🔑 Hash Vault</h2>
              <p style={{color:'#7f8c8d', fontSize:'12px', marginBottom:'24px'}}>⚠️ All access to this vault is logged and monitored by Sentinel AI.</p>
              {vaultEntries.map((entry, i) => (
                <div key={i} style={vaultItemStyle}>
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <span style={{fontSize:'22px'}}>{entry.icon}</span>
                    <div>
                      <div style={{fontWeight:'bold', fontSize:'14px'}}>{entry.label}</div>
                      <div style={{color:'#7f8c8d', fontSize:'11px'}}>Last accessed: {i === 0 ? 'Never' : `${i * 2}d ago`}</div>
                    </div>
                  </div>
                  <button onClick={()=>handleRevealPassword(entry.service)} style={actionBtnStyle}>DECRYPT</button>
                </div>
              ))}
              <InfoDisplay />
            </div>
          )}

          {/* existing unchanged modules */}
          {activeApp === "usb" && (
            <div>
              {/* Port Scan Detection Alert */}
              <div style={{background:'rgba(255,71,87,0.08)', border:'1px solid #ff4757', borderLeft:'4px solid #ff4757', borderRadius:'8px', padding:'16px 20px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{color:'#ff4757', fontWeight:'bold', fontSize:'13px', letterSpacing:'1px'}}>🚨 SENTINEL ALERT — INBOUND PORT SCAN DETECTED</div>
                  <div style={{color:'#bdc3c7', fontSize:'12px', marginTop:'4px'}}>Source: 192.168.1.201 scanned this machine 14 minutes ago. 42 ports probed.</div>
                </div>
                <span style={{background:'rgba(255,71,87,0.15)', color:'#ff4757', border:'1px solid #ff4757', padding:'4px 14px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', whiteSpace:'nowrap'}}>INVESTIGATE</span>
              </div>

              {/* Connected USB Devices */}
              <div style={{background:'#1e272e', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}>
                <h3 style={{color:'#3498db', fontSize:'13px', letterSpacing:'2px', marginTop:0}}>🔌 DETECTED USB DEVICES</h3>
                <p style={{color:'#7f8c8d', fontSize:'12px', marginBottom:'16px'}}>Devices physically connected to this workstation. Mounting triggers a Sentinel AI security event.</p>
                {[
                  { id:'DISK_X86_VOL_09', type:'USB Flash Drive', size:'64 GB', vendor:'SanDisk', status:'UNMOUNTED', risk:'HIGH' },
                  { id:'HID_KBD_001', type:'USB Keyboard', size:'—', vendor:'Logitech', status:'ACTIVE', risk:'LOW' },
                  { id:'USB_HUB_4PORT', type:'USB Hub', size:'—', vendor:'Anker', status:'ACTIVE', risk:'MEDIUM' },
                ].map((dev, i) => (
                  <div key={i} style={{background:'#0f1215', border:`1px solid ${dev.risk==='HIGH'?'rgba(255,71,87,0.3)':'#333'}`, borderRadius:'8px', padding:'16px', marginBottom:'10px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:'16px', alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:'11px', color:'#7f8c8d', marginBottom:'3px'}}>DEVICE ID</div>
                      <div style={{fontFamily:'monospace', fontSize:'12px', color:'#3498db'}}>{dev.id}</div>
                    </div>
                    <div>
                      <div style={{fontSize:'11px', color:'#7f8c8d', marginBottom:'3px'}}>TYPE</div>
                      <div style={{fontSize:'13px'}}>{dev.type}</div>
                    </div>
                    <div>
                      <div style={{fontSize:'11px', color:'#7f8c8d', marginBottom:'3px'}}>VENDOR / SIZE</div>
                      <div style={{fontSize:'13px', color:'#bdc3c7'}}>{dev.vendor} {dev.size !== '—' ? `· ${dev.size}` : ''}</div>
                    </div>
                    <span style={{
                      padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', textAlign:'center',
                      background: dev.risk==='HIGH'?'rgba(255,71,87,0.15)': dev.risk==='MEDIUM'?'rgba(255,165,2,0.15)':'rgba(46,204,113,0.1)',
                      color: dev.risk==='HIGH'?'#ff4757': dev.risk==='MEDIUM'?'#ffa502':'#2ecc71',
                      border:`1px solid ${dev.risk==='HIGH'?'#ff4757': dev.risk==='MEDIUM'?'#ffa502':'#2ecc71'}`
                    }}>{dev.risk} RISK</span>
                    <div style={{fontSize:'11px', color:'#7f8c8d'}}>{dev.status}</div>
                  </div>
                ))}

                {/* Mount button — existing handler untouched */}
                <div style={{textAlign:'center', marginTop:'20px'}}>
                  <button onClick={handleUsbMount} style={{...actionBtnStyle, background:'#c0392b', width:'250px', padding:'12px'}}>
                    ⚡ FORCE MOUNT USB DRIVE
                  </button>
                  <div style={{color:'#7f8c8d', fontSize:'11px', marginTop:'8px'}}>⚠️ This action will be logged as a critical security violation</div>
                </div>
                <InfoDisplay />
              </div>

              {/* Open Ports */}
              <div style={{background:'#1e272e', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}>
                <h3 style={{color:'#ffa502', fontSize:'13px', letterSpacing:'2px', marginTop:0}}>🔓 OPEN PORTS ON THIS MACHINE</h3>
                <table width="100%" cellPadding={10} style={{textAlign:'left', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{color:'#7f8c8d', borderBottom:'1px solid #333', fontSize:'11px', letterSpacing:'1px'}}>
                      <th>PORT</th><th>PROTOCOL</th><th>SERVICE</th><th>STATE</th><th>RISK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { port:22, proto:'TCP', service:'SSH', state:'OPEN', risk:'HIGH' },
                      { port:80, proto:'TCP', service:'HTTP', state:'OPEN', risk:'MEDIUM' },
                      { port:443, proto:'TCP', service:'HTTPS', state:'OPEN', risk:'LOW' },
                      { port:3306, proto:'TCP', service:'MySQL', state:'OPEN', risk:'CRITICAL' },
                      { port:8080, proto:'TCP', service:'Spring Boot API', state:'OPEN', risk:'MEDIUM' },
                      { port:4444, proto:'TCP', service:'Unknown / Suspicious', state:'OPEN', risk:'CRITICAL' },
                      { port:3389, proto:'TCP', service:'RDP', state:'FILTERED', risk:'HIGH' },
                    ].map((p, i) => (
                      <tr key={i} style={{borderBottom:'1px solid #222'}}>
                        <td style={{fontFamily:'monospace', fontWeight:'bold', color:'#3498db'}}>{p.port}</td>
                        <td style={{color:'#7f8c8d', fontSize:'12px'}}>{p.proto}</td>
                        <td style={{fontSize:'13px', color: p.service.includes('Suspicious')?'#ff4757':'#ecf0f1', fontWeight: p.service.includes('Suspicious')?'bold':'normal'}}>
                          {p.service.includes('Suspicious') && '⚠️ '}{p.service}
                        </td>
                        <td><span style={{fontFamily:'monospace', fontSize:'12px', color: p.state==='OPEN'?'#ff4757':'#ffa502'}}>{p.state}</span></td>
                        <td>
                          <span style={{
                            padding:'3px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'bold',
                            background: p.risk==='CRITICAL'?'rgba(255,71,87,0.2)': p.risk==='HIGH'?'rgba(255,165,2,0.15)': p.risk==='MEDIUM'?'rgba(52,152,219,0.15)':'rgba(46,204,113,0.1)',
                            color: p.risk==='CRITICAL'?'#ff4757': p.risk==='HIGH'?'#ffa502': p.risk==='MEDIUM'?'#3498db':'#2ecc71'
                          }}>{p.risk}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Blocked Port Attempts */}
              <div style={{background:'#1e272e', padding:'20px', borderRadius:'10px'}}>
                <h3 style={{color:'#ff4757', fontSize:'13px', letterSpacing:'2px', marginTop:0}}>🛑 BLOCKED PORT ATTEMPTS</h3>
                <p style={{color:'#7f8c8d', fontSize:'12px', marginBottom:'16px'}}>Firewall blocked these unauthorized connection attempts in the last 24 hours.</p>
                {[
                  { time:'02:41 AM', src:'185.220.101.47', port:4444, reason:'Reverse Shell Attempt' },
                  { time:'02:38 AM', src:'185.220.101.47', port:1337, reason:'Known C2 Port' },
                  { time:'Yesterday', src:'103.21.58.200', port:23, reason:'Telnet — Unencrypted' },
                  { time:'Yesterday', src:'192.168.1.201', port:3306, reason:'Unauthorized DB Access' },
                ].map((entry, i) => (
                  <div key={i} style={{display:'grid', gridTemplateColumns:'80px 140px 60px 1fr', gap:'16px', alignItems:'center', padding:'10px 0', borderBottom:'1px dashed #333', fontSize:'13px'}}>
                    <span style={{color:'#7f8c8d', fontSize:'11px', fontFamily:'monospace'}}>{entry.time}</span>
                    <span style={{fontFamily:'monospace', color:'#ff4757', fontSize:'12px'}}>{entry.src}</span>
                    <span style={{fontFamily:'monospace', color:'#ffa502', fontWeight:'bold'}}>:{entry.port}</span>
                    <span style={{color:'#bdc3c7'}}>{entry.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeApp === "trash" && (
            <div style={{background: '#1e272e', padding: '25px', borderRadius: '10px'}}>
              <h2>🗑️ Archive Bin</h2>
              {deletedFiles.map(f => (
                <div key={f.id} style={vaultItemStyle}>
                  <div><strong>{f.name}</strong><br/><small style={{color:'#7f8c8d'}}>{f.date}</small></div>
                  <button onClick={() => handleRestore(f.name)} style={{...actionBtnStyle, background:'#27ae60'}}>RESTORE</button>
                </div>
              ))}
              <InfoDisplay />
            </div>
          )}

          {activeApp === "security" && (
            <div style={{textAlign: 'center', background: '#1e272e', padding: '50px', borderRadius: '10px'}}>
               <button onClick={handleDisableFirewall} style={{...actionBtnStyle, background: '#c0392b', width: '250px'}}>TERMINATE FIREWALL</button>
               <InfoDisplay />
            </div>
          )}

          {activeApp === "browser" && (
            <div>
              {/* Proxy Server Info */}
              <div style={{background:'#1e272e', padding:'20px', borderRadius:'10px', marginBottom:'20px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px'}}>
                {[
                  { label:'PROXY GATEWAY', val:'10.0.0.1', icon:'🌐' },
                  { label:'ENCRYPTION', val:'TLS 1.3', icon:'🔒' },
                  { label:'EXIT NODE', val:'Mumbai, IN', icon:'📍' },
                  { label:'STATUS', val:'ACTIVE', icon:'✅' },
                ].map((item, i) => (
                  <div key={i} style={{background:'#0f1215', padding:'14px', borderRadius:'8px', border:'1px solid #333', textAlign:'center'}}>
                    <div style={{fontSize:'20px', marginBottom:'6px'}}>{item.icon}</div>
                    <div style={{fontWeight:'bold', color:'#3498db', fontSize:'14px', fontFamily:'monospace'}}>{item.val}</div>
                    <div style={{fontSize:'10px', color:'#7f8c8d', marginTop:'4px', letterSpacing:'1px'}}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* URL Request Bar — existing logic untouched */}
              <div style={{background:'#1e272e', padding:'25px', borderRadius:'10px', marginBottom:'20px'}}>
                <h2 style={{marginTop:0}}>🌍 Web Proxy</h2>
                <div style={{ display: 'flex', gap: 10, margin: '20px 0' }}>
                  <input type="text" value={browserUrl} onChange={(e) => setBrowserUrl(e.target.value)} placeholder="Enter URL..." style={inputBoxStyle} />
                  <button onClick={handleBrowse} style={actionBtnStyle}>REQUEST</button>
                </div>

                {/* Threat check result shown after browse */}
                {viewData && (
                  <div style={{marginBottom:'16px', padding:'12px 16px', background:'rgba(255,165,2,0.08)', border:'1px solid #ffa502', borderRadius:'6px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <span style={{color:'#ffa502', fontWeight:'bold', fontSize:'12px', letterSpacing:'1px'}}>🔍 THREAT INTELLIGENCE CHECK</span>
                      <div style={{color:'#ecf0f1', fontSize:'13px', marginTop:'4px'}}>{browserUrl || 'Last URL'}</div>
                    </div>
                    <span style={{background:'rgba(255,165,2,0.15)', color:'#ffa502', border:'1px solid #ffa502', padding:'4px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:'bold'}}>
                      ⚠️ SUSPICIOUS
                    </span>
                  </div>
                )}
                <InfoDisplay />
              </div>

              {/* Browsing History */}
              <div style={{background:'#1e272e', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}>
                <h3 style={{color:'#3498db', fontSize:'13px', letterSpacing:'2px', marginTop:0}}>🕐 PROXY REQUEST HISTORY</h3>
                {[
                  { url:'pastebin.com/raw/xK92mN', time:'11:42 AM', threat:'MALICIOUS', color:'#ff4757' },
                  { url:'mega.nz/folder/internal-docs', time:'11:38 AM', threat:'HIGH RISK', color:'#ff4757' },
                  { url:'mail.competitor-corp.com', time:'11:21 AM', threat:'SUSPICIOUS', color:'#ffa502' },
                  { url:'github.com/private-repo', time:'10:55 AM', threat:'MONITORED', color:'#ffa502' },
                  { url:'google.com', time:'10:30 AM', threat:'SAFE', color:'#2ecc71' },
                ].map((entry, i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px dashed #333'}}>
                    <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                      <span style={{color:'#7f8c8d', fontSize:'11px', fontFamily:'monospace'}}>{entry.time}</span>
                      <span style={{fontFamily:'monospace', fontSize:'13px', color:'#bdc3c7'}}>{entry.url}</span>
                    </div>
                    <span style={{background:`rgba(${entry.color === '#ff4757' ? '255,71,87' : entry.color === '#ffa502' ? '255,165,2' : '46,204,113'},0.12)`, color: entry.color, border:`1px solid ${entry.color}`, padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', whiteSpace:'nowrap'}}>
                      {entry.threat}
                    </span>
                  </div>
                ))}
              </div>

              {/* Blocked Sites */}
              <div style={{background:'#1e272e', padding:'20px', borderRadius:'10px'}}>
                <h3 style={{color:'#ff4757', fontSize:'13px', letterSpacing:'2px', marginTop:0}}>🚫 CORPORATE POLICY — BLOCKED SITES</h3>
                <p style={{color:'#7f8c8d', fontSize:'12px', marginBottom:'16px'}}>Access to these domains is blocked by your organization's DLP and internet policy.</p>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px'}}>
                  {[
                    { site:'youtube.com', reason:'Media Streaming' },
                    { site:'reddit.com', reason:'Social Media' },
                    { site:'torrent-*.com', reason:'P2P / Piracy' },
                    { site:'mega.nz', reason:'Unauthorized Cloud' },
                    { site:'pastebin.com', reason:'Data Exfil Risk' },
                    { site:'*.onion', reason:'Dark Web' },
                    { site:'whatsapp.com', reason:'Messaging App' },
                    { site:'dropbox.com', reason:'Unauthorized Cloud' },
                    { site:'vpn-*.net', reason:'VPN Bypass' },
                  ].map((item, i) => (
                    <div key={i} style={{background:'#0f1215', border:'1px solid rgba(255,71,87,0.2)', borderRadius:'6px', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontFamily:'monospace', fontSize:'12px', color:'#ecf0f1'}}>{item.site}</span>
                      <span style={{fontSize:'10px', color:'#ff4757', marginLeft:'8px', whiteSpace:'nowrap'}}>{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── NEW MODULES ──────────────────────────────────────────────── */}

          {activeApp === "processes" && (
            <div style={{background: '#1e272e', padding: '25px', borderRadius: '10px'}}>
              <h2>⚙️ Process Manager</h2>
              <p style={{color:'#7f8c8d', fontSize:'12px', marginBottom:'20px'}}>
                Killing a suspicious process is logged as a security event by Sentinel AI.
              </p>
              <table width="100%" cellPadding={12} style={{textAlign:'left', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{color:'#7f8c8d', borderBottom:'1px solid #333', fontSize:'12px', letterSpacing:'1px'}}>
                    <th>PID</th><th>PROCESS NAME</th><th>CPU</th><th>MEMORY</th><th>STATUS</th><th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map(proc => {
                    const killed = killedProcesses.includes(proc.pid);
                    return (
                      <tr key={proc.pid} style={{borderBottom:'1px solid #222', opacity: killed ? 0.35 : 1}}>
                        <td style={{fontFamily:'monospace', color:'#7f8c8d'}}>{proc.pid}</td>
                        <td style={{fontFamily:'monospace', color: proc.safe ? '#ecf0f1' : '#ff4757', fontWeight: proc.safe ? 'normal' : 'bold'}}>
                          {!proc.safe && '⚠️ '}{proc.name}
                        </td>
                        <td style={{color:'#3498db'}}>{proc.cpu}</td>
                        <td style={{color:'#9b59b6'}}>{proc.mem}</td>
                        <td>
                          <span style={{
                            padding:'3px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'bold',
                            background: proc.status==='HIDDEN'?'rgba(255,71,87,0.2)': proc.status==='SUSPICIOUS'?'rgba(255,165,2,0.2)':'rgba(46,204,113,0.1)',
                            color: proc.status==='HIDDEN'?'#ff4757': proc.status==='SUSPICIOUS'?'#ffa502':'#2ecc71'
                          }}>
                            {killed ? 'KILLED' : proc.status}
                          </span>
                        </td>
                        <td>
                          {!killed ? (
                            <button
                              onClick={() => handleKillProcess(proc)}
                              style={{...actionBtnStyle, background: proc.safe ? '#2c3e50' : '#c0392b', fontSize:'12px', padding:'6px 12px'}}
                            >
                              {proc.safe ? 'TERMINATE' : 'KILL ⚡'}
                            </button>
                          ) : (
                            <span style={{color:'#7f8c8d', fontSize:'12px'}}>Terminated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeApp === "loginhistory" && (
            <div style={{background: '#1e272e', padding: '25px', borderRadius: '10px'}}>
              <h2>🕐 Login History</h2>
              <p style={{color:'#7f8c8d', fontSize:'12px', marginBottom:'20px'}}>
                All login attempts are recorded. Suspicious logins are automatically flagged by Sentinel AI.
              </p>
              {loginHistory.map((entry, i) => (
                <div key={i} style={{
                  background:'#0f1215', border:'1px solid #333',
                  borderLeft:`4px solid ${entry.status==='SUSPICIOUS'?'#ff4757':'#2ecc71'}`,
                  borderRadius:'6px', padding:'16px 20px', marginBottom:'12px',
                  display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:'16px', alignItems:'center'
                }}>
                  <div>
                    <div style={{fontSize:'11px', color:'#7f8c8d', marginBottom:'4px'}}>TIME</div>
                    <div style={{fontSize:'13px', fontFamily:'monospace'}}>{entry.time}</div>
                  </div>
                  <div>
                    <div style={{fontSize:'11px', color:'#7f8c8d', marginBottom:'4px'}}>IP ADDRESS</div>
                    <div style={{fontSize:'13px', fontFamily:'monospace', color:'#3498db'}}>{entry.ip}</div>
                  </div>
                  <div>
                    <div style={{fontSize:'11px', color:'#7f8c8d', marginBottom:'4px'}}>LOCATION</div>
                    <div style={{fontSize:'13px'}}>{entry.location}</div>
                  </div>
                  <div>
                    <div style={{fontSize:'11px', color:'#7f8c8d', marginBottom:'4px'}}>DEVICE</div>
                    <div style={{fontSize:'12px', color:'#bdc3c7'}}>{entry.device}</div>
                  </div>
                  <span style={{
                    padding:'5px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', whiteSpace:'nowrap',
                    background: entry.status==='SUSPICIOUS'?'rgba(255,71,87,0.15)':'rgba(46,204,113,0.1)',
                    color: entry.status==='SUSPICIOUS'?'#ff4757':'#2ecc71',
                    border:`1px solid ${entry.status==='SUSPICIOUS'?'#ff4757':'#2ecc71'}`
                  }}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeApp === "sysmonitor" && (
            <div>
              <div style={{background:'#1e272e', padding:'25px', borderRadius:'10px', marginBottom:'20px'}}>
                <h2 style={{marginTop:0}}>📊 System Monitor</h2>
                <p style={{color:'#7f8c8d', fontSize:'12px', margin:'0 0 24px 0'}}>
                  Live system resource usage. Sentinel AI flags abnormal CPU/memory spikes as potential data exfiltration signals.
                </p>
                {[
                  { label:'CPU USAGE', val: 34, color:'#3498db', detail:'4 cores / 3.2 GHz' },
                  { label:'MEMORY', val: 67, color:'#9b59b6', detail:'10.7 GB / 16 GB used' },
                  { label:'DISK I/O', val: 22, color:'#2ecc71', detail:'Read: 120 MB/s | Write: 45 MB/s' },
                  { label:'NETWORK OUT', val: 55, color:'#ff4757', detail:'↑ 2.3 MB/s — flagged by DLP' },
                  { label:'NETWORK IN', val: 18, color:'#ffa502', detail:'↓ 0.8 MB/s' },
                ].map((item, i) => (
                  <div key={i} style={{marginBottom:'20px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px'}}>
                      <span style={{fontSize:'12px', color:'#7f8c8d', letterSpacing:'1px'}}>{item.label}</span>
                      <span style={{fontSize:'12px', color: item.color, fontWeight:'bold'}}>{item.val}%</span>
                    </div>
                    <div style={{height:'8px', background:'#333', borderRadius:'4px', overflow:'hidden', marginBottom:'4px'}}>
                      <div style={{width:`${item.val}%`, height:'100%', background: item.color, borderRadius:'4px', transition:'width 1s ease'}}/>
                    </div>
                    <div style={{fontSize:'11px', color:'#555'}}>{item.detail}</div>
                  </div>
                ))}
              </div>

              {/* Running services */}
              <div style={{background:'#1e272e', padding:'25px', borderRadius:'10px'}}>
                <h3 style={{color:'#3498db', fontSize:'13px', letterSpacing:'2px', marginTop:0}}>🔧 ACTIVE SERVICES</h3>
                {[
                  { name:'sentinel_core.service', status:'ACTIVE', uptime:'2h 14m' },
                  { name:'zero_trust_gateway.service', status:'ACTIVE', uptime:'2h 14m' },
                  { name:'dlp_engine.service', status:'ACTIVE', uptime:'2h 14m' },
                  { name:'firewall.service', status:'ACTIVE', uptime:'2h 14m' },
                  { name:'audit_logger.service', status:'ACTIVE', uptime:'2h 14m' },
                ].map((svc, i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px dashed #333'}}>
                    <span style={{fontFamily:'monospace', fontSize:'13px', color:'#ecf0f1'}}>{svc.name}</span>
                    <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
                      <span style={{color:'#7f8c8d', fontSize:'12px'}}>↑ {svc.uptime}</span>
                      <span style={{background:'rgba(46,204,113,0.1)', color:'#2ecc71', border:'1px solid #2ecc71', padding:'2px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold'}}>{svc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── STYLES (all original, nothing removed) ────────────────────────────────────
const quarantineTerminalStyle = { height: '100vh', width: '100vw', background: '#000', color: '#ff4757', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', position: 'fixed', top: 0, left: 0, zIndex: 9999, textAlign: 'center', padding: '20px' };
const forensicBoxStyle = { border: '2px solid #ff4757', padding: '30px', margin: '20px 0', background: '#1a0000', width: '90%', maxWidth: '750px', textAlign: 'left', boxShadow: '0 0 40px rgba(255, 71, 87, 0.2)' };
const modalOverlayStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 7, 10, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, backdropFilter: 'blur(10px)' };
const modalBoxStyle = { background: '#1e272e', padding: '40px', borderRadius: '15px', textAlign: 'center', width: '380px', border: '1px solid #3498db' };
const modalInputStyle = { fontSize: '24px', padding: '12px', textAlign: 'center', width: '100%', background: '#0f1215', border: '1px solid #333', color: '#3498db', borderRadius: '8px', marginBottom: '20px', letterSpacing: '8px', outline: 'none' };
const modalButtonStyle = { padding: '15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' };
const containerStyle = { display: 'flex', height: '100vh' };
const statCardStyle = { background:'#1e272e', padding:'20px', borderRadius:'8px', flex:1, borderTop:'2px solid #3498db' };
const statusBannerStyle = { padding:'15px', background:'#2c3e50', borderLeft:'4px solid #3498db', marginBottom:'25px', color:'#ecf0f1', fontSize: '14px', fontWeight: 'bold' };
const navStyle = (active) => ({ cursor: 'pointer', padding: '12px 15px', color: active ? '#3498db' : '#bdc3c7', background: active ? 'rgba(52, 152, 219, 0.1)' : 'transparent', borderRadius: '8px', marginBottom: '5px' });
const actionBtnStyle = { background:'#3498db', color:'white', border:'none', padding:'8px 16px', borderRadius:'5px', cursor:'pointer', fontWeight: 'bold' };
const inputBoxStyle = { width: '100%', padding: '12px', background: '#0f1215', border: '1px solid #333', color: '#ecf0f1', borderRadius: '6px' };
const vaultItemStyle = { display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom:'15px', background: '#2c3e50', padding: '15px', borderRadius: '8px' };

export default UserDashboard;