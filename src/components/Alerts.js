import React from "react";

function Alerts({ risks }) {
  const alerts = risks.filter(r => r.status === "INSIDER THREAT");

  return (
    <div style={{ marginBottom: 30 }}>
      <h3>Security Alerts</h3>
      {alerts.length === 0 && <p>No active threats</p>}
      {alerts.map(a => (
        <div
          key={a.userId}
          style={{
            border: "2px solid red",
            padding: 10,
            marginBottom: 10
          }}
        >
          🚨 Insider Threat Detected for User {a.userId} (Risk: {a.score})
        </div>
      ))}
    </div>
  );
}

export default Alerts;
