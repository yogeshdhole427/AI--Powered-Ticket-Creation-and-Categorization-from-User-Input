import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import DevAuth from './pages/DevAuth';
import DevDashboard from './pages/DevDashboard';
import Landing from './pages/Landing';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dev-auth" element={<DevAuth />} />
        {/* ADD THIS ROUTE TO FIX THE 404 WARNING */}
        <Route path="/user-dashboard" element={<UserDashboard />} /> 
        <Route path="/dev-dashboard" element={<DevDashboard />} />
      </Routes>
    </Router>
  );
}
export default App;