import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { 
  PieChart, Pie, Cell, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import "./AdminDashboard.css"; 

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ usb: 0, files: 0, dlp: 0, pass: 0, sec: 0, copy: 0 });
  const [zeroTrustEnabled, setZeroTrustEnabled] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(-10);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustMsg, setAdjustMsg] = useState("");

  const fetchData = async () => {
    try {
      const [uRes, lRes, zRes] = await Promise.all([
        api.get("/api/admin/all-users"),
        api.get("/api/admin/audit-logs"),
        api.get("/api/admin/zero-trust-status")
      ]);

      setUsers(uRes.data || []);
      setLogs(lRes.data || []);
      setZeroTrustEnabled(zRes.data.status);

      const currentLogs = lRes.data || [];
      setStats({
        usb: currentLogs.filter(l => l.actionType?.includes("HARDWARE")).length,
        files: currentLogs.filter(l => l.actionType?.includes("DATA_THEFT")).length,
        dlp: currentLogs.filter(l => l.actionType?.includes("DLP") || l.actionType?.includes("AI")).length,
        pass: currentLogs.filter(l => l.actionType?.includes("CREDENTIAL")).length,
        sec: currentLogs.filter(l => l.actionType?.includes("SECURITY")).length,
        copy: currentLogs.filter(l => l.actionType?.includes("COPY") || l.actionType?.includes("PASTE")).length,
      });
    } catch (e) { console.error("Fetch Error", e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const pieData = useMemo(() => [
    { name: 'Hardware', value: stats.usb, color: '#ff4757' },
    { name: 'Data Exfil', value: stats.files, color: '#ffa502' },
    { name: 'AI & DLP', value: stats.dlp, color: '#ff6b81' },
    { name: 'Auth Leak', value: stats.pass, color: '#a29bfe' },
    { name: 'Security', value: stats.sec, color: '#e1b12c' },
  ].filter(d => d.value > 0), [stats]);

  const barData = useMemo(() => 
    users.map(u => ({ name: u.username, score: u.riskScore }))
         .sort((a, b) => b.score - a.score)
         .slice(0, 5)
  , [users]);

  const getLogColor = (type) => {
    if(type.includes("BLOCK") || type.includes("CRITICAL") || type.includes("AI")) return "#ff4757"; 
    if(type.includes("WARNING")) return "#ffa502"; 
    return "#2ed573"; 
  };

  // ── RISK REMEDIATION HANDLER ──────────────────────────────────────────────
  const handleRiskAdjust = async () => {
    if (!selectedUser) {
      setAdjustMsg("⚠️ Please select a user first.");
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustMsg("⚠️ Reason is required.");
      return;
    }
    try {
      const res = await api.post("/api/admin/adjust-risk", {
        userId: selectedUser.id,
        amount: adjustAmount,
        reason: adjustReason,
        adminUsername: "root"
      });
      const { oldScore, newScore, username } = res.data;
      setAdjustMsg(`✅ ${username}'s risk: ${oldScore.toFixed(0)}% → ${newScore.toFixed(0)}%`);
      setAdjustReason("");
      fetchData();
    } catch (err) {
      setAdjustMsg("❌ Adjustment failed. Check backend.");
    }
  };

  // ── RETURN / JSX ──────────────────────────────────────────────────────────
  return (
    <div className="dashboardContainer">

      {/* HEADER */}
      <div className="header">
        <div className="brandArea">
          <h1 className="mainTitle">SURVEILLANCE <span style={{color: '#3498db'}}>CORE</span></h1>
          <div className="statusBadge"><div className="pulseDot"></div> SYSTEM INTEGRITY: OPTIMAL</div>
        </div>
        <button
          onClick={() => api.post("/api/admin/toggle-zero-trust", {enabled: !zeroTrustEnabled})}
          className={zeroTrustEnabled ? "btnOn" : "btnOff"}
        >
          {zeroTrustEnabled ? "🛡️ ZERO TRUST: ACTIVE" : "⚠️ ZERO TRUST: OFF"}
        </button>
      </div>

      {/* STATS */}
      <div className="statGrid">
        <StatCard label="USB VIOLATIONS" count={stats.usb} color="#ff4757" icon="🔌" />
        <StatCard label="DATA EXFIL" count={stats.files} color="#ffa502" icon="📂" />
        <StatCard label="AI & DLP BLOCKS" count={stats.dlp} color="#ff6b81" icon="🚫" />
        <StatCard label="AUTH LEAKS" count={stats.pass} color="#a29bfe" icon="🔑" />
        <StatCard label="SEC TAMPER" count={stats.sec} color="#e1b12c" icon="🛡️" />
        <StatCard label="CLIPBOARD" count={stats.copy} color="#70a1ff" icon="📋" />
      </div>

      {/* ── RISK REMEDIATION PANEL ─────────────────────────────────────────── */}
      <div style={{
        background: '#1e272e',
        border: '1px solid #2ecc71',
        borderLeft: '4px solid #2ecc71',
        borderRadius: '10px',
        padding: '24px',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#2ecc71', marginTop: 0, fontSize: '14px', letterSpacing: '2px' }}>
          🛡️ RISK REMEDIATION — ADMIN OVERRIDE
        </h3>
        <p style={{ color: '#7f8c8d', fontSize: '12px', marginBottom: '20px' }}>
          Manually adjust a user's risk score when an action was authorized or reviewed.
          All adjustments are permanently logged in the audit trail.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>

          {/* User selector */}
          <div>
            <label style={{ color: '#bdc3c7', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
              SELECT USER
            </label>
            <select
              value={selectedUser?.id || ""}
              onChange={(e) => {
                const user = users.find(u => u.id === parseInt(e.target.value));
                setSelectedUser(user || null);
                setAdjustMsg("");
              }}
              style={{
                width: '100%', padding: '10px', background: '#0f1215',
                border: '1px solid #333', color: '#ecf0f1', borderRadius: '6px'
              }}
            >
              <option value="">-- Select User --</option>
              {users
                .filter(u => u.role !== "ADMIN")
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username} — Risk: {u.riskScore?.toFixed(0)}%
                  </option>
                ))
              }
            </select>
          </div>

          {/* Adjustment slider */}
          <div>
            <label style={{ color: '#bdc3c7', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
              ADJUST AMOUNT: <span style={{ color: adjustAmount < 0 ? '#2ecc71' : '#ff4757' }}>
                {adjustAmount > 0 ? `+${adjustAmount}` : adjustAmount}
              </span>
            </label>
            <input
              type="range"
              min="-100" max="100" step="5"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: adjustAmount < 0 ? '#2ecc71' : '#ff4757' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#7f8c8d' }}>
              <span>-100 (Clear)</span>
              <span>0</span>
              <span>+100 (Max)</span>
            </div>
          </div>

          {/* Reason input */}
          <div>
            <label style={{ color: '#bdc3c7', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
              REASON (REQUIRED)
            </label>
            <input
              type="text"
              placeholder="e.g. Authorized by manager"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              style={{
                width: '100%', padding: '10px', background: '#0f1215',
                border: '1px solid #333', color: '#ecf0f1', borderRadius: '6px'
              }}
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleRiskAdjust}
            style={{
              padding: '10px 20px',
              background: adjustAmount < 0 ? '#27ae60' : '#c0392b',
              color: 'white', border: 'none', borderRadius: '6px',
              cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap'
            }}
          >
            {adjustAmount < 0 ? '✅ CLEAR RISK' : '⚠️ RAISE RISK'}
          </button>
        </div>

        {/* Feedback message */}
        {adjustMsg && (
          <div style={{
            marginTop: '14px', padding: '10px 16px',
            background: adjustMsg.startsWith('✅') ? 'rgba(46,204,113,0.1)' : 'rgba(255,71,87,0.1)',
            border: `1px solid ${adjustMsg.startsWith('✅') ? '#2ecc71' : '#ff4757'}`,
            borderRadius: '6px', color: adjustMsg.startsWith('✅') ? '#2ecc71' : '#ff4757',
            fontSize: '13px'
          }}>
            {adjustMsg}
          </div>
        )}
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        
        <div style={{ background: '#1e272e', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <h3 style={{ color: '#3498db', marginTop: 0, fontSize: '14px', letterSpacing: '1px' }}>📊 THREAT VECTOR DISTRIBUTION</h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e272e', border: '1px solid #333', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#1e272e', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <h3 style={{ color: '#ff4757', marginTop: 0, fontSize: '14px', letterSpacing: '1px' }}>⚠️ TOP 5 HIGH-RISK TARGETS</h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#7f8c8d" />
                <YAxis stroke="#7f8c8d" />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e272e', border: '1px solid #333' }} />
                <Bar dataKey="score" fill="#ff4757" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* MAIN LAYOUT */}
      <div className="mainLayout">

        {/* LEFT PANEL */}
        <div className="panelLeft">
          <div className="panelHeader">🎯 TARGET RISK ANALYSIS</div>
          <table className="table">
            <thead>
              <tr className="tableHeaderRow">
                <th className="th">USER</th>
                <th className="th">THREAT SCORE</th>
                <th className="th">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="tr">
                  <td className="tdUsername">{u.username}</td>
                  <td className="td">
                    <div className="riskBarContainer">
                      <div
                        style={{ width: `${u.riskScore}%`, backgroundColor: u.riskScore > 70 ? '#ff4757' : '#2ed573' }}
                        className="riskBar"
                      />
                    </div>
                    <span className="riskText">{u.riskScore}%</span>
                  </td>
                  <td className="td">{u.riskScore >= 90 ? "QUARANTINED" : "ACTIVE"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT PANEL */}
        <div className="panelRight">
          <div className="panelHeader">📜 FORENSIC AUDIT STREAM</div>
          <div className="logContainer">
            {logs.map(l => (
              <div key={l.id} className="logItem" style={{borderLeft: `3px solid ${getLogColor(l.actionType)}`}}>
                <div className="logMeta">
                  <span className="logTime">{new Date(l.timestamp).toLocaleTimeString()}</span>
                  <span style={{color: getLogColor(l.actionType), fontWeight: 'bold'}}>{l.actionType}</span>
                </div>
                <div className="logDetail">
                  <span style={{color: '#3498db'}}>{l.username}</span> {l.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const StatCard = ({ label, count, color, icon }) => (
  <div className="statCard">
    <div className="statCardBar" style={{background: color}}></div>
    <div className="statIcon">{icon}</div>
    <div className="statCount">{count}</div>
    <div className="statLabel">{label}</div>
  </div>
);

export default AdminDashboard;