import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatSessions, getSkillGapHistory, deleteChatSession } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineChatAlt2, HiOutlineChartBar, HiOutlineTrash, HiOutlineArrowRight } from 'react-icons/hi';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chats');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getChatSessions(), getSkillGapHistory()])
      .then(([s, a]) => {
        setSessions(s.data);
        setAnalyses(a.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    try {
      await deleteChatSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      toast.success('Chat deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📜 History</h1>
        <p className="page-subtitle">Access your previous chat sessions and skill gap reports.</p>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>
          Chat Sessions
        </div>
        <div className={`tab ${activeTab === 'analyses' ? 'active' : ''}`} onClick={() => setActiveTab('analyses')}>
          Skill Gap Reports
        </div>
      </div>

      <div className="animate-in">
        {activeTab === 'chats' ? (
          <div className="grid grid-1">
            {sessions.map(s => (
              <div key={s.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ color: 'var(--accent-purple)' }}><HiOutlineChatAlt2 size={24} /></div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{s.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {s.message_count} messages • {new Date(s.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/chat/${s.id}`)}>
                    Open <HiOutlineArrowRight />
                  </button>
                  <button className="btn btn-sm" style={{ color: 'var(--accent-rose)', background: 'var(--bg-glass)' }} onClick={() => handleDeleteSession(s.id)}>
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="empty-state">
                <HiOutlineChatAlt2 className="empty-icon" />
                <p>No chat history found.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-1">
            {analyses.map(a => (
              <div key={a.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ color: 'var(--accent-emerald)' }}><HiOutlineChartBar size={24} /></div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{a.resume_name} vs {a.jd_title}</h4>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span className="badge badge-emerald">Match: {a.match_score}%</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/skill-analysis', { state: { result: a } })}>
                  View Report <HiOutlineArrowRight />
                </button>
              </div>
            ))}
            {analyses.length === 0 && (
              <div className="empty-state">
                <HiOutlineChartBar className="empty-icon" />
                <p>No skill gap reports found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
