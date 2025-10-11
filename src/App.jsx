import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Entries from "./pages/Entries";
import SavingsGoals from "./pages/SavingsGoals";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/entries" element={<Entries />} />
        <Route path="/savings-goals" element={<SavingsGoals/>}/>
      </Routes>
    </Router>
  );
}

export default App;
