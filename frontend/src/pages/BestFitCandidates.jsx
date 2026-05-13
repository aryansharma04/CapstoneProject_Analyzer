import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJDs, getBestFitCandidates, createChatSession } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineChevronRight, HiOutlineChatAlt2 } from 'react-icons/hi';

export default function BestFitCandidates() {
  const [jds, setJDs] = useState([]);
  const [selectedJD, setSelectedJD] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getJDs().then(res => setJDs(res.data));
  }, []);

  const handleMatch = async () => {
    if (!selectedJD) return toast.error('Select a JD first');
    setLoading(true);
    try {
      const res = await getBestFitCandidates({ jd_id: selectedJD });
      setResults(res.data);
      toast.success('Found best matches!');
    } catch (err) {
      toast.error('Matching failed');
    }
    setLoading(false);
  };

  const handleStartChat = async (candidate) => {
    try {
      const res = await createChatSession({
        resume_id: candidate.id,
        jd_id: results.jd.id,
        session_type: 'single'
      });
      navigate(`/chat/${res.data.id}`);
    } catch (err) {
      toast.error('Failed to start chat');
    }
  };

  const handleGroupChat = async () => {
    try {
      const res = await createChatSession({
        jd_id: results.jd.id,
        session_type: 'group',
        title: `Group Chat: ${results.jd.title}`
      });
      navigate(`/chat/${res.data.id}`);
    } catch (err) {
      toast.error('Failed to start group chat');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🏆 Best Fit Candidates</h1>
        <p className="page-subtitle">Instantly find and rank the most suitable candidates for your open roles.</p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Select Job Description</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select className="form-select" value={selectedJD} onChange={e => setSelectedJD(e.target.value)} style={{ flex: 1 }}>
              <option value="">Choose a job description...</option>
              {jds.map(jd => <option key={jd.id} value={jd.id}>{jd.title}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleMatch} disabled={loading}>
              {loading ? <div className="spinner" /> : 'Find Top Candidates'}
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Results for {results.jd.title}</h2>
            <button className="btn btn-success" onClick={handleGroupChat}>
              <HiOutlineChatAlt2 size={20} /> Chat with All Best-Fit
            </button>
          </div>

          <div className="grid grid-1">
            {results.best_fit.map((candidate, i) => (
              <div key={candidate.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                    <HiOutlineUser size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{candidate.candidate_name}</h4>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <span className="badge badge-emerald">Match: {candidate.score}%</span>
                      <a href={candidate.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent-blue)' }}>View Resume</a>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => handleStartChat(candidate)}>
                    Chat <HiOutlineChevronRight />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {results.best_fit.length === 0 && (
            <div className="glass-card empty-state">
              <p>No candidates met the minimum matching threshold.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
