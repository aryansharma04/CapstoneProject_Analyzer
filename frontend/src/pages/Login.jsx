import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi, getMe } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(form);
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      const meRes = await getMe();
      loginUser(meRes.data, { access: res.data.access, refresh: res.data.refresh });
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue to SkillBridge</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Enter username" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter password" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <div className="spinner" /> : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">Don&apos;t have an account? <Link to="/register">Create one</Link></p>
      </div>
    </div>
  );
}
