import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SkillAnalysis from './pages/SkillAnalysis';
import CourseRecommendations from './pages/CourseRecommendations';
import BestFitCandidates from './pages/BestFitCandidates';
import Chat from './pages/Chat';
import History from './pages/History';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/skill-analysis" element={<ProtectedRoute><SkillAnalysis /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><CourseRecommendations /></ProtectedRoute>} />
        <Route path="/best-fit" element={<ProtectedRoute><BestFitCandidates /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:sessionId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
