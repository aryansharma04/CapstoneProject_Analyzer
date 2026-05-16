import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboard, uploadResume, createJD, bulkUploadResumes, deleteResume, deleteJD, bulkDeleteResumes, bulkDeleteJDs } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText, HiOutlineBriefcase, HiOutlineChatAlt2, HiOutlineChartBar, HiOutlineUpload, HiOutlineTrash } from 'react-icons/hi';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isHR = user?.profile?.role === 'hr';

  const fetchDashboard = () => {
    setLoading(true);
    getDashboard().then(r => setData(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <div className="page"><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.first_name || user?.username} 👋</h1>
        <p className="page-subtitle">{isHR ? 'Manage candidates and find the best fit for your roles.' : 'Analyze your skills and prepare for your dream job.'}</p>
      </div>

      {isHR ? <HRDashboard data={data} onRefresh={fetchDashboard} /> : <CandidateDashboard data={data} onRefresh={fetchDashboard} />}
    </div>
  );
}

function CandidateDashboard({ data, onRefresh }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [jdForm, setJdForm] = useState({ title: '', text_content: '' });
  const [jdLoading, setJdLoading] = useState(false);
  const [deletingResume, setDeletingResume] = useState(null);
  const [deletingJD, setDeletingJD] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await uploadResume(fd);
      toast.success('Resume uploaded!');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };

  const handleJD = async (e) => {
    e.preventDefault();
    if (!jdForm.title || !jdForm.text_content) return toast.error('Fill all fields');
    setJdLoading(true);
    try {
      await createJD(jdForm);
      toast.success('JD saved!');
      setJdForm({ title: '', text_content: '' });
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
    setJdLoading(false);
  };

  const handleDeleteResume = async (id, name) => {
    if (!confirm(`Delete resume "${name}"? This cannot be undone.`)) return;
    setDeletingResume(id);
    try {
      await deleteResume(id);
      toast.success('Resume deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete resume');
    }
    setDeletingResume(null);
  };

  const handleDeleteJD = async (id, title) => {
    if (!confirm(`Delete JD "${title}"? This cannot be undone.`)) return;
    setDeletingJD(id);
    try {
      await deleteJD(id);
      toast.success('JD deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete JD');
    }
    setDeletingJD(null);
  };

  const stats = [
    { icon: <HiOutlineDocumentText size={24} />, label: 'My Resumes', value: data?.my_resumes?.length || 0, color: 'var(--accent-blue)' },
    { icon: <HiOutlineChartBar size={24} />, label: 'Analyses Done', value: data?.total_analyses || 0, color: 'var(--accent-emerald)' },
    { icon: <HiOutlineChatAlt2 size={24} />, label: 'Chat Sessions', value: data?.total_chats || 0, color: 'var(--accent-purple)' },
    { icon: <HiOutlineBriefcase size={24} />, label: 'Available JDs', value: data?.available_jds?.length || 0, color: 'var(--accent-amber)' },
  ];

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>📄 Upload Resume</h3>
          <div className="upload-zone" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".pdf" hidden onChange={handleUpload} />
            <div className="upload-icon"><HiOutlineUpload size={48} /></div>
            <p className="upload-text">{uploading ? 'Uploading...' : <>Click to upload <strong>PDF resume</strong></>}</p>
          </div>

          {/* My Resumes List with Delete */}
          {data?.my_resumes?.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>My Resumes</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.my_resumes.map(r => (
                  <div key={r.id} className="list-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', transition: 'var(--transition)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <HiOutlineDocumentText size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.candidate_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>{new Date(r.uploaded_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDeleteResume(r.id, r.candidate_name)}
                        disabled={deletingResume === r.id}
                        className="btn-icon-delete"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem',
                          borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)',
                          transition: 'var(--transition)', display: 'flex', alignItems: 'center'
                        }}
                        title="Delete resume"
                      >
                        {deletingResume === r.id ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <HiOutlineTrash size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>📋 Add Job Description</h3>
          <form onSubmit={handleJD}>
            <div className="form-group">
              <input className="form-input" placeholder="Job Title (e.g. Frontend Developer)" value={jdForm.title} onChange={e => setJdForm({ ...jdForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <textarea className="form-textarea" placeholder="Paste job description here..." rows={4} value={jdForm.text_content} onChange={e => setJdForm({ ...jdForm, text_content: e.target.value })} />
            </div>
            <button className="btn btn-primary" disabled={jdLoading}>{jdLoading ? 'Saving...' : 'Save JD'}</button>
          </form>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>🚀 Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/skill-analysis" className="btn btn-secondary" style={{ justifyContent: 'center' }}>🎯 Analyze Skill Gap</Link>
            <Link to="/courses" className="btn btn-secondary" style={{ justifyContent: 'center' }}>📚 Browse Course Recommendations</Link>
            <Link to="/chat" className="btn btn-secondary" style={{ justifyContent: 'center' }}>💬 Start AI Chat</Link>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>📋 Available Job Descriptions</h3>
          {data?.available_jds?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.available_jds.map(jd => (
                <div key={jd.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <HiOutlineBriefcase size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{jd.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{new Date(jd.uploaded_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleDeleteJD(jd.id, jd.title)}
                      disabled={deletingJD === jd.id}
                      className="btn-icon-delete"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)',
                        transition: 'var(--transition)', display: 'flex', alignItems: 'center'
                      }}
                      title="Delete JD"
                    >
                      {deletingJD === jd.id ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <HiOutlineTrash size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="empty-text" style={{ padding: '1rem' }}>No JDs yet</p>}
        </div>
      </div>
    </>
  );
}

function HRDashboard({ data, onRefresh }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [jdForm, setJdForm] = useState({ title: '', text_content: '' });
  const [jdLoading, setJdLoading] = useState(false);
  const [deletingResume, setDeletingResume] = useState(null);
  const [deletingJD, setDeletingJD] = useState(null);
  const [deletingAllResumes, setDeletingAllResumes] = useState(false);
  const [deletingAllJDs, setDeletingAllJDs] = useState(false);

  const handleBulkUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('files', f));
    try {
      const res = await bulkUploadResumes(fd);
      toast.success(`Uploaded ${res.data.total_uploaded} resumes!`);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };

  const handleJD = async (e) => {
    e.preventDefault();
    if (!jdForm.title || !jdForm.text_content) return toast.error('Fill all fields');
    setJdLoading(true);
    try {
      await createJD(jdForm);
      toast.success('JD created!');
      setJdForm({ title: '', text_content: '' });
      onRefresh();
    } catch (err) { toast.error('Failed'); }
    setJdLoading(false);
  };

  const handleDeleteResume = async (id, name) => {
    if (!confirm(`Delete resume "${name}"? This cannot be undone.`)) return;
    setDeletingResume(id);
    try {
      await deleteResume(id);
      toast.success('Resume deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete resume');
    }
    setDeletingResume(null);
  };

  const handleDeleteJD = async (id, title) => {
    if (!confirm(`Delete JD "${title}"? This cannot be undone.`)) return;
    setDeletingJD(id);
    try {
      await deleteJD(id);
      toast.success('JD deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete JD');
    }
    setDeletingJD(null);
  };

  const handleDeleteAllResumes = async () => {
    if (!confirm(`Delete ALL ${data?.recent_resumes?.length || 0} resumes? This cannot be undone!`)) return;
    setDeletingAllResumes(true);
    try {
      const res = await bulkDeleteResumes();
      toast.success(`Deleted ${res.data.deleted} resumes`);
      onRefresh();
    } catch {
      toast.error('Failed to delete all resumes');
    }
    setDeletingAllResumes(false);
  };

  const handleDeleteAllJDs = async () => {
    if (!confirm(`Delete ALL ${data?.recent_jds?.length || 0} job descriptions? This cannot be undone!`)) return;
    setDeletingAllJDs(true);
    try {
      const res = await bulkDeleteJDs();
      toast.success(`Deleted ${res.data.deleted} JDs`);
      onRefresh();
    } catch {
      toast.error('Failed to delete all JDs');
    }
    setDeletingAllJDs(false);
  };

  const stats = [
    { icon: <HiOutlineDocumentText size={24} />, label: 'Total Resumes', value: data?.total_resumes || 0, color: 'var(--accent-blue)' },
    { icon: <HiOutlineBriefcase size={24} />, label: 'Job Descriptions', value: data?.total_jds || 0, color: 'var(--accent-emerald)' },
    { icon: <HiOutlineChatAlt2 size={24} />, label: 'Chat Sessions', value: data?.total_chats || 0, color: 'var(--accent-purple)' },
  ];

  return (
    <>
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>📁 Bulk Upload Resumes</h3>
          <div className="upload-zone" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".pdf" multiple hidden onChange={handleBulkUpload} />
            <div className="upload-icon"><HiOutlineUpload size={48} /></div>
            <p className="upload-text">{uploading ? 'Uploading...' : <>Click to upload <strong>multiple PDFs</strong></>}</p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>📋 Create Job Description</h3>
          <form onSubmit={handleJD}>
            <div className="form-group">
              <input className="form-input" placeholder="Job Title" value={jdForm.title} onChange={e => setJdForm({ ...jdForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <textarea className="form-textarea" placeholder="Paste JD here..." rows={4} value={jdForm.text_content} onChange={e => setJdForm({ ...jdForm, text_content: e.target.value })} />
            </div>
            <button className="btn btn-primary" disabled={jdLoading}>{jdLoading ? 'Saving...' : 'Create JD'}</button>
          </form>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>🚀 Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/best-fit" className="btn btn-secondary" style={{ justifyContent: 'center' }}>🏆 Find Best Fit Candidates</Link>
            <Link to="/chat" className="btn btn-secondary" style={{ justifyContent: 'center' }}>💬 Start AI Chat</Link>
            <Link to="/history" className="btn btn-secondary" style={{ justifyContent: 'center' }}>📜 View History</Link>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700 }}>📋 Job Descriptions</h3>
            {data?.recent_jds?.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={handleDeleteAllJDs} disabled={deletingAllJDs} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {deletingAllJDs ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <HiOutlineTrash size={14} />} Remove All
              </button>
            )}
          </div>
          {data?.recent_jds?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.recent_jds.map(jd => (
                <div key={jd.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <HiOutlineBriefcase size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{jd.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>{new Date(jd.uploaded_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleDeleteJD(jd.id, jd.title)}
                      disabled={deletingJD === jd.id}
                      className="btn-icon-delete"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)',
                        transition: 'var(--transition)', display: 'flex', alignItems: 'center'
                      }}
                      title="Delete JD"
                    >
                      {deletingJD === jd.id ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <HiOutlineTrash size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="empty-text" style={{ padding: '1rem' }}>No JDs yet</p>}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700 }}>📄 All Resumes</h3>
          {data?.recent_resumes?.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteAllResumes} disabled={deletingAllResumes} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {deletingAllResumes ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <HiOutlineTrash size={14} />} Remove All
            </button>
          )}
        </div>
        {data?.recent_resumes?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.recent_resumes.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <HiOutlineDocumentText size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.candidate_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{new Date(r.uploaded_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleDeleteResume(r.id, r.candidate_name)}
                    disabled={deletingResume === r.id}
                    className="btn-icon-delete"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)',
                      transition: 'var(--transition)', display: 'flex', alignItems: 'center'
                    }}
                    title="Delete resume"
                  >
                    {deletingResume === r.id ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <HiOutlineTrash size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="empty-text" style={{ padding: '1rem' }}>No resumes yet</p>}
      </div>
    </>
  );
}
