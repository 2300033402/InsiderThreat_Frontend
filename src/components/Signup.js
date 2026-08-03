import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await api.post("/api/signup", { username, password });
      alert("Signup successful! Use Security PIN: 1234 on login.");
      navigate("/"); 
    } catch (err) {
      alert("Signup failed: MySQL Error or Username taken.");
    }
  };

  return (
    <div style={{ padding: 50, fontFamily: 'sans-serif' }}>
      <h2>Zero Trust Registration</h2>
      <p>Create an account. Age and other metadata will be auto-generated.</p>
      <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} style={{padding:10, marginBottom:10}} /><br/>
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={{padding:10, marginBottom:10}} /><br/>
      <button onClick={handleSignup} style={{padding:10, background: '#3498db', color: 'white', border: 'none'}}>Register Account</button>
      <br/><br/>
      <button onClick={() => navigate("/")} style={{background: 'none', border: 'none', color: 'blue', cursor: 'pointer'}}>Back to Login</button>
    </div>
  );
}

export default Signup;