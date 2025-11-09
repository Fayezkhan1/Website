import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState(null);
  const [credentials, setCredentials] = useState({
    student_id: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentHostelIndex, setCurrentHostelIndex] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(true);
  const [closingPanel, setClosingPanel] = useState(null);

  const hostels = [
    { name: 'C.V Raman', image: '/cv-raman.jpg' },
    { name: 'J.C Bose', image: '/jc-bose.jpg' },
    { name: 'Kalpana Chawla', image: '/kalpana-chawla.jpg' },
    { name: 'Aryabhatta', image: '/aryabhatta.jpg' },
    { name: 'A.P.J Abdul Kalam', image: '/apj-kalam.jpg' },
    { name: 'Dr. Anandi Gopal Joshi', image: '/anandi-joshi.jpg' },
    { name: 'Homi J. Bhabha', image: '/homi-bhabha.jpg' },
    { name: 'V.G Bhide', image: '/vg-bhide.jpg' },
    { name: 'S. Ramanujan', image: '/ramanujan.jpg' }
  ];

  // Resume autoplay after 1 second of inactivity
  useEffect(() => {
    if (isAutoplaying) return;
    
    const resumeTimer = setTimeout(() => {
      setIsAutoplaying(true);
    }, 1000);
    
    return () => clearTimeout(resumeTimer);
  }, [isAutoplaying, currentHostelIndex]);

  // Auto-scroll hostels every 3 seconds (only when autoplaying)
  useEffect(() => {
    if (!isAutoplaying) return;
    
    const interval = setInterval(() => {
      setCurrentHostelIndex((prevIndex) => (prevIndex + 1) % hostels.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hostels.length, isAutoplaying]);

  const nextHostel = () => {
    setIsAutoplaying(false);
    setCurrentHostelIndex((prevIndex) => (prevIndex + 1) % hostels.length);
  };

  const prevHostel = () => {
    setIsAutoplaying(false);
    setCurrentHostelIndex((prevIndex) => (prevIndex - 1 + hostels.length) % hostels.length);
  };

  const handleLogin = async (e, role) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Verify role matches the panel
      if (role === 'student' && user.role !== 'resident') {
        setError('Invalid credentials for student panel');
        setLoading(false);
        return;
      }
      if (role === 'admin' && user.role !== 'admin') {
        setError('Invalid credentials for admin panel');
        setLoading(false);
        return;
      }
      if (role === 'worker' && user.role !== 'worker') {
        setError('Invalid credentials for worker panel');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Navigate based on role
      if (user.role === 'resident') {
        navigate('/student-dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'worker') {
        navigate('/worker-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-logo">
            <img src="/vnit-logo.png" alt="VNIT Logo" className="logo-img" />
            <div className="nav-title-container">
              <div className="nav-title-hindi">विश्वेश्वरय्या राष्ट्रीय प्रौद्योगिकी संस्थान, नागपुर</div>
              <div className="nav-title-english">Visvesvaraya National Institute of Technology, Nagpur</div>
              <div className="nav-subtitle">Hostel Grievance Management System</div>
            </div>
          </div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('photos')} className="nav-link">Hostels</button>
            <button onClick={() => scrollToSection('about')} className="nav-link">About</button>
            <button onClick={() => scrollToSection('contact')} className="nav-link">Contact</button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Login Panels */}
      <section id="portal-login" className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to VNIT Hostel Portal</h1>
          <p className="hero-subtitle">Select your role to login</p>
          
          <div className="login-panels">
            {/* Student Panel */}
            <div className={`login-panel ${activePanel === 'student' ? 'active' : ''} ${closingPanel === 'student' ? 'closing' : ''}`}>
              <div className="panel-header" onClick={() => {
                if (activePanel === 'student') {
                  setClosingPanel('student');
                  setTimeout(() => {
                    setActivePanel(null);
                    setClosingPanel(null);
                  }, 600);
                } else {
                  setActivePanel('student');
                }
              }}>
                <div className="panel-icon student-icon">🎓</div>
                <h2>Student Portal</h2>
              </div>
              {activePanel === 'student' && (
                <form onSubmit={(e) => handleLogin(e, 'student')} className={`login-form ${closingPanel === 'student' ? 'closing' : ''}`}>
                  <input
                    type="text"
                    placeholder="Student ID"
                    value={credentials.student_id}
                    onChange={(e) => setCredentials({...credentials, student_id: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                  />
                  {error && <div className="error-message">{error}</div>}
                  <button type="submit" disabled={loading} className="login-btn">
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                  <button type="button" onClick={() => navigate('/register')} className="register-link">
                    New Student? Register Here
                  </button>
                </form>
              )}
            </div>

            {/* Admin Panel */}
            <div className={`login-panel ${activePanel === 'admin' ? 'active' : ''} ${closingPanel === 'admin' ? 'closing' : ''}`}>
              <div className="panel-header" onClick={() => {
                if (activePanel === 'admin') {
                  setClosingPanel('admin');
                  setTimeout(() => {
                    setActivePanel(null);
                    setClosingPanel(null);
                  }, 600);
                } else {
                  setActivePanel('admin');
                }
              }}>
                <div className="panel-icon admin-icon">👔</div>
                <h2>Admin Portal</h2>
              </div>
              {activePanel === 'admin' && (
                <form onSubmit={(e) => handleLogin(e, 'admin')} className={`login-form ${closingPanel === 'admin' ? 'closing' : ''}`}>
                  <input
                    type="text"
                    placeholder="Admin ID"
                    value={credentials.student_id}
                    onChange={(e) => setCredentials({...credentials, student_id: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                  />
                  {error && <div className="error-message">{error}</div>}
                  <button type="submit" disabled={loading} className="login-btn">
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              )}
            </div>

            {/* Worker Panel */}
            <div className={`login-panel ${activePanel === 'worker' ? 'active' : ''} ${closingPanel === 'worker' ? 'closing' : ''}`}>
              <div className="panel-header" onClick={() => {
                if (activePanel === 'worker') {
                  setClosingPanel('worker');
                  setTimeout(() => {
                    setActivePanel(null);
                    setClosingPanel(null);
                  }, 600);
                } else {
                  setActivePanel('worker');
                }
              }}>
                <div className="panel-icon worker-icon">🔧</div>
                <h2>Worker Portal</h2>
              </div>
              {activePanel === 'worker' && (
                <form onSubmit={(e) => handleLogin(e, 'worker')} className={`login-form ${closingPanel === 'worker' ? 'closing' : ''}`}>
                  <input
                    type="text"
                    placeholder="Worker ID"
                    value={credentials.student_id}
                    onChange={(e) => setCredentials({...credentials, student_id: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                  />
                  {error && <div className="error-message">{error}</div>}
                  <button type="submit" disabled={loading} className="login-btn">
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Photos Section */}
      <section id="photos" className="photos-section">
        <h2 className="section-title">Our Hostels</h2>
        <div className="hostel-carousel">
          <button className="carousel-btn prev-btn" onClick={prevHostel}>
            ‹
          </button>
          <div className="hostel-display">
            <img src={hostels[currentHostelIndex].image} alt={hostels[currentHostelIndex].name} />
          </div>
          <button className="carousel-btn next-btn" onClick={nextHostel}>
            ›
          </button>
        </div>
        <div className="hostel-indicators">
          {hostels.map((_, index) => (
            <span
              key={index}
              className={`indicator ${index === currentHostelIndex ? 'active' : ''}`}
              onClick={() => {
                setIsAutoplaying(false);
                setCurrentHostelIndex(index);
              }}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <h2 className="section-title">About VNIT Hostel Grievance System</h2>
        <div className="about-content">
          <div className="about-card">
            <h3>🎯 Our Mission</h3>
            <p>
              To provide a seamless and efficient platform for students to report and track 
              hostel-related grievances, ensuring quick resolution and improved living conditions.
            </p>
          </div>
          <div className="about-card">
            <h3>⚡ Quick Resolution</h3>
            <p>
              Our system features automatic priority detection for emergencies, multi-tier 
              admin hierarchy for efficient task assignment, and real-time tracking of complaint status.
            </p>
          </div>
          <div className="about-card">
            <h3>🔒 Secure & Transparent</h3>
            <p>
              Role-based access control ensures data security, while complete audit trails 
              maintain transparency. Students can track their complaints from filing to resolution.
            </p>
          </div>
          <div className="about-card">
            <h3>📊 Smart Management</h3>
            <p>
              Automated escalation for overdue tasks, frequency-based priority adjustment, 
              and comprehensive analytics help administrators manage hostel operations effectively.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <h2 className="section-title">Contact Us</h2>
        <div className="contact-info">
          <p>📧 Email: hostel@vnit.ac.in</p>
          <p>📞 Phone: +91-712-2801-000</p>
          <p>📍 Address: VNIT Campus, South Ambazari Road, Nagpur - 440010</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 VNIT Nagpur. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
