import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResumes, getJDs, analyzeSkillGap } from '../services/api';
import toast from 'react-hot-toast';

export default function SkillAnalysis() {
  const [resumes, setResumes] = useState([]);
  const [jds, setJDs] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [selectedJD, setSelectedJD] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getResumes(), getJDs()]).then(([r, j]) => {
      setResumes(r.data);
      setJDs(j.data);
    });
  }, []);

  const handleAnalyze = async () => {
    if (!selectedResume || !selectedJD) return toast.error('Select both resume and JD');
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeSkillGap({ resume_id: selectedResume, jd_id: selectedJD });
      setResult(res.data);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🎯 Skill Gap Analysis</h1>
        <p className="page-subtitle">Select your resume and a job description to discover your skill gaps</p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select Resume</label>
            <select className="form-select" value={selectedResume} onChange={e => setSelectedResume(e.target.value)}>
              <option value="">Choose a resume...</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.candidate_name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select Job Description</label>
            <select className="form-select" value={selectedJD} onChange={e => setSelectedJD(e.target.value)}>
              <option value="">Choose a JD...</option>
              {jds.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleAnalyze} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? <><div className="spinner" /> Analyzing with AI...</> : '⚡ Analyze Skill Gap'}
        </button>
      </div>

      {result && (
        <div className="animate-in">
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: `conic-gradient(${result.match_score >= 70 ? 'var(--accent-emerald)' : result.match_score >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)'} ${result.match_score * 3.6}deg, var(--bg-glass) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                  {result.match_score}%
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Match Score</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.summary}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: 'var(--accent-emerald)', marginBottom: '1rem', fontWeight: 700 }}>✅ Matching Skills ({result.matching_skills?.length || 0})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {result.matching_skills?.map((s, i) => <span key={i} className="badge badge-emerald">{s}</span>)}
                {!result.matching_skills?.length && <p style={{ color: 'var(--text-muted)' }}>None identified</p>}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: 'var(--accent-rose)', marginBottom: '1rem', fontWeight: 700 }}>❌ Missing Skills ({result.missing_skills?.length || 0})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {result.missing_skills?.map((s, i) => <span key={i} className="badge badge-rose">{s}</span>)}
                {!result.missing_skills?.length && <p style={{ color: 'var(--text-muted)' }}>None — great match!</p>}
              </div>
            </div>
          </div>

          {result.missing_skills?.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-success btn-lg" onClick={() => navigate('/courses', { state: { skills: result.missing_skills } })}>
                📚 Get Course Recommendations for Missing Skills
              </button>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (resumes.length === 0 || jds.length === 0) && (
        <div className="glass-card empty-state">
          <div className="empty-icon">📄</div>
          <p className="empty-text">{resumes.length === 0 ? 'Upload a resume first from your Dashboard' : 'No job descriptions available. Add one from your Dashboard.'}</p>
        </div>
      )}
    </div>
  );
}
