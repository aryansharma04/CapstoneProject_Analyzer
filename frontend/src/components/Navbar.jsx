import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HiOutlineLogout } from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  if (!user && ['/', '/login', '/register'].includes(location.pathname)) {
    return (
      <nav className="navbar">
        <Link to="/" className="navbar-brand">⚡ SkillBridge</Link>
        <div className="navbar-links">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>
    );
  }

  if (!user) return null;

  const isHR = user.profile?.role === 'hr';

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">⚡ SkillBridge</Link>
      <div className="navbar-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        {isHR ? (
          <>
            <Link to="/best-fit" className={isActive('/best-fit')}>Best Fit</Link>
            <Link to="/chat" className={isActive('/chat')}>Chat</Link>
          </>
        ) : (
          <>
            <Link to="/skill-analysis" className={isActive('/skill-analysis')}>Skill Analysis</Link>
            <Link to="/courses" className={isActive('/courses')}>Courses</Link>
            <Link to="/chat" className={isActive('/chat')}>Chat</Link>
          </>
        )}
        <Link to="/history" className={isActive('/history')}>History</Link>
      </div>
      <div className="nav-user">
        <div className="nav-avatar">{user.first_name?.[0] || user.username[0].toUpperCase()}</div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.first_name || user.username}</div>
          <div className="nav-role">{user.profile?.role}</div>
        </div>
        <button onClick={logout} className="btn btn-sm" style={{ padding: '0.3rem', background: 'none', color: 'var(--text-muted)' }} title="Logout">
          <HiOutlineLogout size={18} />
        </button>
      </div>
    </nav>
  );
}
