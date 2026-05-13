import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'candidate' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerApi(form);
      loginUser(res.data.user, res.data.tokens);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const msg = Object.values(errors).flat().join(', ');
        toast.error(msg);
      } else {
        toast.error('Registration failed');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join SkillBridge and accelerate your career</p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button type="button" className={`btn ${form.role === 'candidate' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setForm({ ...form, role: 'candidate' })}>
              🎯 Candidate
            </button>
            <button type="button" className={`btn ${form.role === 'hr' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setForm({ ...form, role: 'hr' })}>
              👔 HR
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="John" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Doe" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="johndoe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <div className="spinner" /> : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
