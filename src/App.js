import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* This is the default page (localhost:3000) */}
        <Route path="/" element={<Login />} /> 
        
        {/* This is your Signup page (localhost:3000/signup) */}
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/user" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;