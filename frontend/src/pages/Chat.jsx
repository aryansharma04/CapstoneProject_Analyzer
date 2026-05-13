import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatSession, sendChatMessage, getResumes, getJDs, createChatSession, getInterviewQuestions } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineQuestionMarkCircle, HiOutlinePlus } from 'react-icons/hi';

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(!!sessionId);
  const scrollRef = useRef();

  // For starting a new chat if no sessionId
  const [resumes, setResumes] = useState([]);
  const [jds, setJDs] = useState([]);
  const [newChatData, setNewChatData] = useState({ resume_id: '', jd_id: '', session_type: 'single' });

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    } else {
      Promise.all([getResumes(), getJDs()]).then(([r, j]) => {
        setResumes(r.data);
        setJDs(j.data);
      });
    }
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchSession = async () => {
    try {
      const res = await getChatSession(sessionId);
      setSession(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      toast.error('Session not found');
      navigate('/chat');
    }
    setLoading(false);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || sending) return;

    const userMsg = { role: 'user', content: message, created_at: new Date().toISOString() };
    setMessages([...messages, userMsg]);
    setMessage('');
    setSending(true);

    try {
      const res = await sendChatMessage(sessionId, { message: userMsg.content });
      setMessages(prev => [...prev, res.data.ai_message]);
    } catch (err) {
      toast.error('Failed to get AI response');
    }
    setSending(false);
  };

  const handleStartNewChat = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createChatSession(newChatData);
      navigate(`/chat/${res.data.id}`);
    } catch (err) {
      toast.error('Failed to create chat');
    }
    setLoading(false);
  };

  const handleSmartFeature = async (type) => {
    if (sending) return;
    setSending(true);
    let prompt = '';
    if (type === 'interview') {
      prompt = 'Generate 5 challenging interview questions based on the resume and job description.';
    } else if (type === 'feedback') {
      prompt = 'Provide critical feedback on the resume based on the job description requirements.';
    }

    const userMsg = { role: 'user', content: prompt, created_at: new Date().toISOString() };
    setMessages([...messages, userMsg]);

    try {
      const res = await sendChatMessage(sessionId, { message: prompt });
      setMessages(prev => [...prev, res.data.ai_message]);
    } catch (err) {
      toast.error('AI failed to respond');
    }
    setSending(false);
  };

  if (!sessionId) {
    return (
      <div className="page" style={{ maxWidth: '800px' }}>
        <div className="page-header">
          <h1 className="page-title">💬 AI Chat Assistant</h1>
          <p className="page-subtitle">Start a new conversation to discuss resumes and job requirements.</p>
        </div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleStartNewChat}>
            <div className="form-group">
              <label className="form-label">Chat Mode</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button type="button" className={`btn ${newChatData.session_type === 'single' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setNewChatData({ ...newChatData, session_type: 'single' })}>
                  Single Resume
                </button>
                <button type="button" className={`btn ${newChatData.session_type === 'group' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setNewChatData({ ...newChatData, session_type: 'group' })}>
                  Group Chat (All Resumes)
                </button>
              </div>
            </div>
            {newChatData.session_type === 'single' && (
              <div className="form-group">
                <label className="form-label">Select Resume</label>
                <select className="form-select" required value={newChatData.resume_id} onChange={e => setNewChatData({ ...newChatData, resume_id: e.target.value })}>
                  <option value="">Choose a resume...</option>
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.candidate_name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Select Job Description (Optional)</label>
              <select className="form-select" value={newChatData.jd_id} onChange={e => setNewChatData({ ...newChatData, jd_id: e.target.value })}>
                <option value="">General chat (no JD)...</option>
                {jds.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <div className="spinner" /> : 'Start Chatting'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div className="page" style={{ padding: 0, height: 'calc(100vh - 64px)' }}>
      <div className="chat-container">
        <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{session?.title}</h2>
            <div className="nav-role">{session?.session_type === 'group' ? 'Multi-resume Context' : 'Single Resume Context'}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleSmartFeature('interview')}>
              <HiOutlineSparkles size={16} /> Interview Questions
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleSmartFeature('feedback')}>
              <HiOutlineQuestionMarkCircle size={16} /> Get Feedback
            </button>
          </div>
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
              <h3>Hello! I&apos;m your AI Assistant.</h3>
              <p>Ask me anything about the {session?.session_type === 'group' ? 'resumes' : 'resume'} and requirements.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              <div style={{ fontSize: '0.65rem', marginTop: '0.4rem', opacity: 0.6, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {sending && (
            <div className="chat-bubble assistant" style={{ display: 'flex', gap: '4px' }}>
              <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
              <span style={{ fontSize: '0.8rem' }}>AI is thinking...</span>
            </div>
          )}
        </div>

        <form className="chat-input-area" onSubmit={handleSend}>
          <textarea className="form-input" placeholder="Type your message..." rows={1} value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
          <button className="btn btn-primary" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)' }} disabled={!message.trim() || sending}>
            <HiOutlinePaperAirplane size={20} style={{ transform: 'rotate(90deg)' }} />
          </button>
        </form>
      </div>
    </div>
  );
}
