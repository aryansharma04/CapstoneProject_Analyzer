import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineAcademicCap, HiOutlineChatAlt2, HiOutlineUserGroup } from 'react-icons/hi';

const features = [
  { icon: <HiOutlineLightningBolt size={28} />, title: 'AI Skill Gap Analysis', desc: 'Upload your resume & job description to discover exactly which skills you need to land the role.', color: 'var(--accent-blue)' },
  { icon: <HiOutlineAcademicCap size={28} />, title: 'Course Recommendations', desc: 'Get curated YouTube, Coursera & Udemy courses tailored to bridge your skill gaps.', color: 'var(--accent-emerald)' },
  { icon: <HiOutlineChatAlt2 size={28} />, title: 'AI Resume Chat', desc: 'Chat with AI about your resume, get feedback, and prepare for interviews with smart questions.', color: 'var(--accent-purple)' },
  { icon: <HiOutlineUserGroup size={28} />, title: 'HR Best-Fit Matching', desc: 'HR teams can bulk-upload resumes and instantly find the best candidates for any role.', color: 'var(--accent-amber)' },
];

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title animate-in">
            Bridge The Gap Between<br />Your Skills & <span>Dream Job</span>
          </h1>
          <p className="hero-subtitle animate-in animate-in-delay-1">
            AI-powered resume analysis that identifies your skill gaps, recommends personalized courses, and helps you land your dream role faster.
          </p>
          <div className="hero-actions animate-in animate-in-delay-2">
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free →</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
          </div>
        </div>
      </section>

      <section className="page" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Everything You Need to <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Level Up</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
          Whether you&apos;re a candidate preparing for your next role or an HR professional finding the perfect match.
        </p>
        <div className="grid grid-4">
          {features.map((f, i) => (
            <div key={i} className={`glass-card animate-in animate-in-delay-${i % 4}`} style={{ padding: '2rem' }}>
              <div style={{ color: f.color, marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
