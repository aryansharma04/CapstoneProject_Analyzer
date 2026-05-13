import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCourseRecommendations } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineExternalLink, HiOutlinePlay, HiOutlineBookOpen, HiOutlineAcademicCap } from 'react-icons/hi';

export default function CourseRecommendations() {
  const location = useLocation();
  const [skills, setSkills] = useState(location.state?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (skills.length > 0) {
      fetchCourses();
    }
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getCourseRecommendations({ skills });
      setCourses(res.data.courses || []);
    } catch (err) {
      toast.error('Failed to get recommendations');
    }
    setLoading(false);
  };

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return <HiOutlinePlay size={20} />;
      case 'coursera': return <HiOutlineAcademicCap size={20} />;
      default: return <HiOutlineBookOpen size={20} />;
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📚 Personalized Course Recommendations</h1>
        <p className="page-subtitle">Based on your missing skills, here are the best resources to help you level up.</p>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>Skills to target:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {skills.map((s, i) => (
            <span key={i} className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {s} <button onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>×</button>
            </span>
          ))}
          {skills.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Add some skills to get recommendations...</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="form-input" placeholder="Add a skill (e.g. Docker)" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} />
          <button className="btn btn-secondary" onClick={addSkill}>Add</button>
          <button className="btn btn-primary" onClick={fetchCourses} disabled={loading || skills.length === 0}>
            {loading ? <div className="spinner" /> : 'Get Recommendations'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }} /><p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Curating the best courses for you...</p></div>
      ) : (
        <div className="grid grid-3">
          {courses.map((course, i) => (
            <div key={i} className="course-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="course-thumbnail">
                <div style={{ position: 'absolute', zIndex: 1 }}>{getPlatformIcon(course.platform)}</div>
                <div style={{ opacity: 0.1, fontSize: '5rem', position: 'absolute' }}>{course.skill[0].toUpperCase()}</div>
              </div>
              <div className="course-body">
                <div className="course-platform" style={{ color: course.platform.toLowerCase() === 'youtube' ? 'var(--accent-rose)' : 'var(--accent-blue)' }}>
                  {course.platform}
                </div>
                <h3 className="course-title">{course.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', height: '2.5rem', overflow: 'hidden' }}>{course.description}</p>
                <div className="course-meta">
                  <span className="course-rating">⭐ {course.rating}</span>
                  <span>• {course.duration}</span>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-purple">{course.level}</span>
                  <a href={course.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    View Course <HiOutlineExternalLink />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && courses.length === 0 && skills.length > 0 && (
        <div className="glass-card empty-state">
          <p>No courses found. Try adjusting your skills.</p>
        </div>
      )}
    </div>
  );
}
