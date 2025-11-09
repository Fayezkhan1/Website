import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaints } from '../api';

function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [complaintsList, setComplaintsList] = useState([]);
  const [activeView, setActiveView] = useState('menu'); // menu, file, pending, resolved
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    area: '',        // Room or Common Area
    wing: '',        // For Room: ELECTRICAL, MAINTENANCE, NETWORK, OTHERS | For Common Area: Ground, TV-Hall, Games Area
    subArea: '',     // Not used anymore
    issue: '',       // Specific issue based on problem type/location
    description: '',
    location: '',
  });
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyConfirmed, setEmergencyConfirmed] = useState(false); // Track if user has made a choice
  const [locationComplaints, setLocationComplaints] = useState([]);
  const [showExistingComplaints, setShowExistingComplaints] = useState(false);
  const [ratingModal, setRatingModal] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const complaintStructure = {
    'Room': {
      'ELECTRICAL': ['Light Issues', 'Fan Issue', 'Switches Issue', 'Others'],
      'MAINTENANCE': ['Wall Related', 'Network Issue', 'Cupboards', 'Chairs & Table', 'Windows', 'Other'],
      'NETWORK': ['LAN Port', 'Internet Connection', 'Others'],
      'OTHERS': []
    },
    'Common Area': {
      'Ground': ['Cleaning Issue', 'Water Stoppage', 'Others'],
      'TV-Hall': ['Equipment Missing/Damaged', 'Chairs Issue', 'Lights Issue', 'Fans Issue', 'Others'],
      'Games Area': ['Equipment Missing/Damaged', 'Lights Issue', 'Fans Issue', 'Others'],
      'Left-Wing': {
        'Corridor': ['Lights Issue', 'Cleaning Issue', 'Washing Machine', 'Water Cooler', 'Others'],
        'Washroom': ['Water Leakage', 'Water Supply', 'Water Heater', 'Lights Issue', 'Shower Issue', 'Door Issue', 'Toilet Issue', 'Others']
      },
      'Right-Wing': {
        'Corridor': ['Lights Issue', 'Cleaning Issue', 'Washing Machine', 'Water Cooler', 'Others'],
        'Washroom': ['Water Leakage', 'Water Supply', 'Water Heater', 'Lights Issue', 'Shower Issue', 'Door Issue', 'Toilet Issue', 'Others']
      },
      'Extension': {
        'Corridor': ['Lights Issue', 'Cleaning Issue', 'Washing Machine', 'Water Cooler', 'Others'],
        'Washroom': ['Water Leakage', 'Water Supply', 'Water Heater', 'Lights Issue', 'Shower Issue', 'Door Issue', 'Toilet Issue', 'Others']
      }
    }
  };

  useEffect(() => {
    console.log('StudentDashboard mounted, user:', user);
    loadComplaints();
  }, []);

  // Load similar complaints when modal opens
  useEffect(() => {
    if (showModal && user.hostel) {
      handleLocationChange(user.hostel);
    }
  }, [showModal]);

  const loadComplaints = async () => {
    try {
      console.log('Loading complaints...');
      const response = await complaints.getAll();
      console.log('Complaints loaded:', response.data);
      setComplaintsList(response.data.complaints);
    } catch (err) {
      console.error('Failed to load complaints', err);
      console.error('Error details:', err.response?.data);
    }
  };

  const handleLocationChange = async (location) => {
    setFormData({ ...formData, location });
    
    if (location.trim().length > 2) {
      try {
        const response = await complaints.getByLocation({ location });
        setLocationComplaints(response.data.complaints || []);
        setShowExistingComplaints(response.data.complaints.length > 0);
      } catch (err) {
        console.error('Failed to fetch location complaints', err);
      }
    } else {
      setLocationComplaints([]);
      setShowExistingComplaints(false);
    }
  };

  const handleUpvote = async (complaintId) => {
    try {
      await complaints.upvote(complaintId);
      alert('Thank you! Your vote has been recorded.');
      // Reload the similar complaints to show updated count
      if (user.hostel) {
        handleLocationChange(user.hostel);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upvote');
    }
  };

  const handleRemoveUpvote = async (complaintId) => {
    try {
      await complaints.removeUpvote(complaintId);
      alert('Your vote has been removed.');
      // Reload the similar complaints to show updated count
      if (user.hostel) {
        handleLocationChange(user.hostel);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upvote');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that user has confirmed emergency status
    if (!emergencyConfirmed) {
      alert('Please confirm whether this is an emergency or not by checking/unchecking the emergency checkbox.');
      return;
    }
    
    try {
      let title;
      if (isEmergency) {
        // For emergency, create a simple title
        title = `🚨 EMERGENCY: ${user.hostel || 'Hostel'} - Room ${user.room_number || 'N/A'}`;
      } else {
        // For normal complaints, build detailed title
        if (formData.subArea) {
          title = `${formData.area} - ${formData.wing} - ${formData.subArea} - ${formData.issue}`;
        } else if (formData.issue) {
          title = `${formData.area} - ${formData.wing} - ${formData.issue}`;
        } else {
          title = `${formData.area} - ${formData.wing}`;
        }
      }
      
      // Automatically set location to "Hostel - Room Number"
      const autoLocation = `${user.hostel || 'Hostel'} - Room ${user.room_number || 'N/A'}`;
      
      const complaintData = {
        title: title,
        description: formData.description,
        category: formData.wing,
        location: autoLocation,
        hostel: user.hostel
      };
      
      // Use emergency endpoint if emergency is selected
      if (isEmergency) {
        await complaints.createEmergency(complaintData);
        alert('Emergency complaint submitted! Warden has been notified immediately.');
      } else {
        await complaints.create(complaintData);
        alert('Complaint filed successfully!');
      }
      
      setShowModal(false);
      setFormData({ area: '', wing: '', subArea: '', issue: '', description: '', location: '' });
      setIsEmergency(false);
      setEmergencyConfirmed(false);
      setLocationComplaints([]);
      setShowExistingComplaints(false);
      loadComplaints();
      setActiveView('pending');
    } catch (err) {
      console.error('Error creating complaint:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create complaint';
      alert(`Failed to create complaint: ${errorMsg}`);
    }
  };

  const handleEmergency = () => {
    setIsEmergency(true);
    setFormData({ 
      area: '',
      wing: '',
      subArea: '',
      issue: '',
      description: '',
      location: user.hostel || '' 
    });
    setShowModal(true);
    setShowExistingComplaints(false); // Don't show existing complaints for emergency
  };

  const handleAreaChange = (area) => {
    setFormData({ ...formData, area, wing: '', subArea: '', issue: '' });
  };

  const handleWingChange = (wing) => {
    setFormData({ ...formData, wing, subArea: '', issue: '' });
  };

  const getPendingComplaints = () => {
    return complaintsList.filter(c => ['pending', 'validated', 'assigned', 'in_progress'].includes(c.status));
  };

  const getResolvedComplaints = () => {
    return complaintsList.filter(c => ['completed', 'resolved'].includes(c.status));
  };

  const getRecentComplaints = () => {
    return complaintsList
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleRateWorker = async (complaintId) => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      await complaints.rateWorker(complaintId, rating, feedback);
      alert('Thank you for rating the worker!');
      setRatingModal(null);
      setRating(0);
      setFeedback('');
      loadComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit rating');
    }
  };

  const renderStars = (count) => {
    return '⭐'.repeat(count);
  };

  const renderProgressBar = (status) => {
    const stages = [
      { key: 'pending', label: 'Submitted', icon: '📝' },
      { key: 'validated', label: 'Validated', icon: '✓' },
      { key: 'assigned', label: 'Assigned', icon: '👷' },
      { key: 'completed', label: 'Completed', icon: '✅' }
    ];

    const statusMap = {
      'pending': 0,
      'validated': 1,
      'in_progress': 2,
      'assigned': 2,
      'completed': 3,
      'resolved': 3
    };

    const currentStage = statusMap[status] || 0;

    return (
      <div style={{ margin: '20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          {/* Progress line */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '4px',
            background: '#e0e0e0',
            zIndex: 0
          }}>
            <div style={{
              height: '100%',
              background: '#667eea',
              width: `${(currentStage / 3) * 100}%`,
              transition: 'width 0.3s ease'
            }}></div>
          </div>

          {/* Stage indicators */}
          {stages.map((stage, index) => {
            const isActive = index <= currentStage;
            const isCurrent = index === currentStage;
            
            return (
              <div key={stage.key} style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isActive ? '#667eea' : '#e0e0e0',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  border: isCurrent ? '3px solid #4a5fd9' : 'none',
                  boxShadow: isCurrent ? '0 0 10px rgba(102, 126, 234, 0.5)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {stage.icon}
                </div>
                <span style={{
                  marginTop: '8px',
                  fontSize: '0.85rem',
                  fontWeight: isCurrent ? 'bold' : 'normal',
                  color: isActive ? '#667eea' : '#999'
                }}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!user || !user.name) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
        <p>If this persists, please <button onClick={() => navigate('/')}>return to home</button></p>
      </div>
    );
  }

  return (
    <div>
      <div className="navbar">
        <h1>VNIT Grievance System</h1>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user.name}</span>
          <button onClick={() => navigate('/profile')} style={{ marginRight: '10px' }}>Profile</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard">
        {activeView === 'menu' && (
          <div className="student-menu">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>Student Dashboard</h2>
            <div className="menu-grid">
              <div className="menu-card" onClick={() => setShowModal(true)}>
                <div className="menu-icon">📝</div>
                <h3>File a Complaint</h3>
                <p>Submit new grievance</p>
              </div>
              
              <div className="menu-card" onClick={() => setActiveView('pending')}>
                <div className="menu-icon">⏳</div>
                <h3>View Pending</h3>
                <p>Ongoing complaints</p>
                {getPendingComplaints().length > 0 && <span className="badge-count">{getPendingComplaints().length}</span>}
              </div>
              
              <div className="menu-card" onClick={() => setActiveView('resolved')}>
                <div className="menu-icon">✅</div>
                <h3>View Resolved</h3>
                <p>Completed complaints</p>
                {getResolvedComplaints().length > 0 && <span className="badge-count">{getResolvedComplaints().length}</span>}
              </div>
              
              <div className="menu-card emergency-card" onClick={handleEmergency}>
                <div className="menu-icon">🚨</div>
                <h3>Emergency</h3>
                <p>Report urgent issue</p>
              </div>
            </div>

            <div className="recent-complaints">
              <h3>Recently Filed Complaints</h3>
              {getRecentComplaints().length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No complaints filed yet.</p>
              ) : (
                <div>
                  {getRecentComplaints().map((complaint) => (
                    <div key={complaint.id} className="complaint-card">
                      <h4>{complaint.title}</h4>
                      <p>{complaint.description}</p>
                      <p><strong>Category:</strong> {complaint.category}</p>
                      <p><strong>Location:</strong> {complaint.location}</p>
                      <div>
                        <span className={`badge badge-${complaint.status.replace('_', '-')}`}>{complaint.status.replace('_', ' ')}</span>
                        <span className={`badge badge-${complaint.priority}`}>{complaint.priority} priority</span>
                        {complaint.is_emergency && <span className="badge badge-high">EMERGENCY</span>}
                      </div>

                      {complaint.progress_photo_url && (
                        <div style={{ marginTop: '15px', padding: '10px', background: '#f0f8ff', borderRadius: '5px' }}>
                          <p style={{ fontSize: '14px', color: '#27ae60', margin: '0' }}>
                            📸 Worker has uploaded progress photo
                          </p>
                        </div>
                      )}

                      {complaint.completion_photo_url && (
                        <div style={{ marginTop: '15px', padding: '10px', background: '#f0fff4', borderRadius: '5px' }}>
                          <p style={{ fontSize: '14px', color: '#27ae60', margin: '0' }}>
                            ✅ Work completed! Click "View Resolved" to see photos and rate
                          </p>
                        </div>
                      )}

                      <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                        Filed: {new Date(complaint.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'pending' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2>Pending Complaints</h2>
              <button className="btn btn-secondary" onClick={() => setActiveView('menu')}>Back to Menu</button>
            </div>
            <div className="complaints-list">
              {getPendingComplaints().length === 0 ? (
                <p>No pending complaints.</p>
              ) : (
                getPendingComplaints().map((complaint) => (
                  <div key={complaint.id} className="complaint-card">
                    <h4>{complaint.title}</h4>
                    
                    {/* Progress Tracking Bar */}
                    {!complaint.is_emergency && renderProgressBar(complaint.status)}
                    
                    <p>{complaint.description}</p>
                    <p><strong>Category:</strong> {complaint.category}</p>
                    <p><strong>Location:</strong> {complaint.location}</p>
                    <div>
                      <span className={`badge badge-${complaint.status.replace('_', '-')}`}>{complaint.status.replace('_', ' ')}</span>
                      <span className={`badge badge-${complaint.priority}`}>{complaint.priority} priority</span>
                      {complaint.is_emergency && <span className="badge badge-high">EMERGENCY</span>}
                    </div>

                    {complaint.progress_photo_url && (
                      <div style={{ marginTop: '15px' }}>
                        <p><strong>📸 Progress Photo (Worker Started):</strong></p>
                        <img 
                          src={complaint.progress_photo_url} 
                          alt="Progress" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px', 
                            borderRadius: '8px', 
                            marginTop: '5px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(complaint.progress_photo_url, '_blank')}
                        />
                        <p style={{ fontSize: '12px', color: '#27ae60', marginTop: '5px' }}>
                          ✓ Worker has started working on this issue
                        </p>
                      </div>
                    )}

                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                      Filed: {new Date(complaint.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeView === 'resolved' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2>Resolved Complaints</h2>
              <button className="btn btn-secondary" onClick={() => setActiveView('menu')}>Back to Menu</button>
            </div>
            <div className="complaints-list">
              {getResolvedComplaints().length === 0 ? (
                <p>No resolved complaints.</p>
              ) : (
                getResolvedComplaints().map((complaint) => (
                  <div key={complaint.id} className="complaint-card">
                    <h4>{complaint.title}</h4>
                    <p>{complaint.description}</p>
                    <p><strong>Category:</strong> {complaint.category}</p>
                    <p><strong>Location:</strong> {complaint.location}</p>
                    <div>
                      <span className={`badge badge-${complaint.status.replace('_', '-')}`}>{complaint.status.replace('_', ' ')}</span>
                      <span className={`badge badge-${complaint.priority}`}>{complaint.priority} priority</span>
                    </div>
                    
                    {complaint.progress_photo_url && (
                      <div style={{ marginTop: '15px' }}>
                        <p><strong>Progress Photo:</strong></p>
                        <img src={complaint.progress_photo_url} alt="Progress" style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '5px' }} />
                      </div>
                    )}
                    
                    {complaint.completion_photo_url && (
                      <div style={{ marginTop: '15px' }}>
                        <p><strong>Completion Photo:</strong></p>
                        <img src={complaint.completion_photo_url} alt="Completed" style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '5px' }} />
                      </div>
                    )}
                    
                    {complaint.worker_rating ? (
                      <div style={{ marginTop: '15px', padding: '10px', background: '#f0f8ff', borderRadius: '5px' }}>
                        <strong>Your Rating:</strong> {renderStars(complaint.worker_rating)} ({complaint.worker_rating}/5)
                        {complaint.rated_at && (
                          <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                            Rated on: {new Date(complaint.rated_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : complaint.status === 'completed' && complaint.assigned_to && (
                      <button 
                        className="btn btn-primary" 
                        style={{ marginTop: '15px', width: 'auto' }}
                        onClick={() => setRatingModal(complaint.id)}
                      >
                        Rate Worker ⭐
                      </button>
                    )}
                    
                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                      Filed: {new Date(complaint.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeView === 'location-complaints' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2>✅ Complaint Filed! Other Issues at This Location:</h2>
              <button className="btn btn-primary" onClick={() => setActiveView('menu')}>Back to Dashboard</button>
            </div>
            <div className="complaints-list">
              {locationComplaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ fontSize: '1.2rem', color: '#666' }}>No other pending complaints at this location.</p>
                  <p style={{ color: '#999' }}>Your complaint is the first one reported here!</p>
                </div>
              ) : (
                <>
                  <p style={{ marginBottom: '1rem', color: '#666' }}>
                    Found {locationComplaints.length} other pending complaint(s) at this location:
                  </p>
                  {locationComplaints.map((complaint) => (
                    <div key={complaint.id} className="complaint-card" style={{ borderLeft: '4px solid #667eea' }}>
                      <h4>{complaint.title}</h4>
                      <p>{complaint.description}</p>
                      <p><strong>Category:</strong> {complaint.category}</p>
                      <div>
                        <span className={`badge badge-${complaint.status.replace('_', '-')}`}>{complaint.status.replace('_', ' ')}</span>
                        <span className={`badge badge-${complaint.priority}`}>{complaint.priority} priority</span>
                        {complaint.is_emergency && <span className="badge badge-high">EMERGENCY</span>}
                      </div>
                      <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                        Filed: {new Date(complaint.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{isEmergency ? '🚨 File Emergency Complaint' : 'File New Complaint'}</h3>
            <form onSubmit={handleSubmit}>
              
              {/* Emergency Checkbox - Show at top */}
              <div style={{ 
                background: isEmergency ? '#fee' : '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: isEmergency ? '2px solid #e74c3c' : '1px solid #e0e0e0'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => {
                      setIsEmergency(e.target.checked);
                      setEmergencyConfirmed(true); // User has made a choice
                      if (e.target.checked) {
                        // Clear form when switching to emergency
                        setFormData({ area: '', wing: '', subArea: '', issue: '', description: '', location: user.hostel || '' });
                        setShowExistingComplaints(false);
                      }
                    }}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      marginRight: '10px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontWeight: '600', color: isEmergency ? '#e74c3c' : '#333' }}>
                    🚨 This is an EMERGENCY
                  </span>
                </label>
                {!emergencyConfirmed && (
                  <p style={{ 
                    margin: '0.5rem 0 0 0', 
                    fontSize: '0.85rem', 
                    color: '#e74c3c',
                    fontWeight: '500'
                  }}>
                    * Please confirm if this is an emergency
                  </p>
                )}
                {isEmergency && (
                  <div style={{ 
                    marginTop: '0.8rem', 
                    padding: '0.8rem', 
                    background: 'white', 
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#e74c3c' }}>
                      ⚠️ Emergency complaints:
                    </p>
                    <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                      <li>Bypass normal validation process</li>
                      <li>Go directly to the Warden</li>
                      <li>Warden will be notified immediately</li>
                      <li>Use only for urgent issues requiring immediate attention</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Show simplified form for emergency, full form for normal */}
              {!isEmergency && (
                <>
                  <div className="form-group">
                    <label>Area *</label>
                    <select
                      value={formData.area}
                      onChange={(e) => handleAreaChange(e.target.value)}
                      required
                    >
                      <option value="">-- Select Area --</option>
                      <option value="Room">Room</option>
                      <option value="Common Area">Common Area</option>
                    </select>
                  </div>

                  {formData.area === 'Room' && (
                    <div className="form-group">
                      <label>Problem Type *</label>
                      <select
                    value={formData.wing}
                    onChange={(e) => handleWingChange(e.target.value)}
                    required
                  >
                    <option value="">-- Select Problem Type --</option>
                    {Object.keys(complaintStructure[formData.area] || {}).map(problemType => (
                      <option key={problemType} value={problemType}>{problemType}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.area === 'Common Area' && (
                <div className="form-group">
                  <label>Location *</label>
                  <select
                    value={formData.wing}
                    onChange={(e) => handleWingChange(e.target.value)}
                    required
                  >
                    <option value="">-- Select Location --</option>
                    {Object.keys(complaintStructure[formData.area] || {}).map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.area === 'Common Area' && formData.wing && typeof complaintStructure[formData.area][formData.wing] === 'object' && !Array.isArray(complaintStructure[formData.area][formData.wing]) && (
                <div className="form-group">
                  <label>Sub Area *</label>
                  <select
                    value={formData.subArea}
                    onChange={(e) => setFormData({ ...formData, subArea: e.target.value, issue: '' })}
                    required
                  >
                    <option value="">-- Select Sub Area --</option>
                    {Object.keys(complaintStructure[formData.area][formData.wing]).map(subArea => (
                      <option key={subArea} value={subArea}>{subArea}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.wing && (
                (Array.isArray(complaintStructure[formData.area][formData.wing]) && complaintStructure[formData.area][formData.wing].length > 0) ||
                (formData.subArea && complaintStructure[formData.area][formData.wing][formData.subArea])
              ) && (
                <div className="form-group">
                  <label>Specific Issue *</label>
                  <select
                    value={formData.issue}
                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                    required
                  >
                    <option value="">-- Select Specific Issue --</option>
                    {Array.isArray(complaintStructure[formData.area][formData.wing])
                      ? complaintStructure[formData.area][formData.wing].map(issue => (
                          <option key={issue} value={issue}>{issue}</option>
                        ))
                      : formData.subArea && complaintStructure[formData.area][formData.wing][formData.subArea]?.map(issue => (
                          <option key={issue} value={issue}>{issue}</option>
                        ))
                    }
                  </select>
                </div>
              )}

                  </>
                )}

              {/* Emergency-specific simple form */}
              {isEmergency && (
                <>
                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      value={`${user.hostel || 'Hostel'} - Room ${user.room_number || 'N/A'}`}
                      readOnly
                      style={{ 
                        background: '#f8f9fa', 
                        cursor: 'not-allowed',
                        fontWeight: '500',
                        color: '#333'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Emergency Description *</label>
                    <textarea
                      rows="6"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the emergency situation in detail..."
                      required
                      style={{ borderColor: '#e74c3c' }}
                    />
                  </div>
                </>
              )}

              {/* Normal complaint additional details */}
              {!isEmergency && (
                <>
                  <div className="form-group">
                    <label>Additional Details</label>
                    <textarea
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide additional details about the issue..."
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Your Hostel</label>
                      <input
                        type="text"
                        value={user.hostel || 'Not specified'}
                        readOnly
                        style={{ 
                          background: '#f8f9fa', 
                          cursor: 'not-allowed',
                          fontWeight: '500',
                          color: '#333'
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Your Room Number</label>
                      <input
                        type="text"
                        value={user.room_number || 'Not specified'}
                        readOnly
                        style={{ 
                          background: '#f8f9fa', 
                          cursor: 'not-allowed',
                          fontWeight: '500',
                          color: '#333'
                        }}
                      />
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                    📍 Location will be set as: {user.hostel || 'Hostel'} - Room {user.room_number || 'N/A'}
                  </p>
                </>
              )}

              {/* Existing complaints section - only show for normal complaints */}
              {!isEmergency && showExistingComplaints && locationComplaints.length > 0 && (
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#667eea' }}>
                    🔍 Existing Issues at This Location ({locationComplaints.length})
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    If you have the same issue, click "Me too!" instead of filing a new complaint:
                  </p>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {locationComplaints.map((complaint) => (
                      <div key={complaint.id} style={{ 
                        background: 'white', 
                        padding: '0.8rem', 
                        marginBottom: '0.5rem', 
                        borderRadius: '5px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '0.95rem' }}>{complaint.title}</strong>
                            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.3rem 0' }}>
                              {complaint.description.substring(0, 100)}...
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span className={`badge badge-${complaint.status.replace('_', '-')}`}>
                                {complaint.status.replace('_', ' ')}
                              </span>
                              <span style={{ fontSize: '0.85rem', color: '#999' }}>
                                👥 {complaint.upvote_count || 0} people
                              </span>
                            </div>
                          </div>
                          {complaint.user_upvoted ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveUpvote(complaint.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              ✓ Voted - Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpvote(complaint.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              👍 Me too!
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem', fontStyle: 'italic' }}>
                    Or scroll down to file a new complaint if your issue is different
                  </p>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ background: isEmergency ? '#e74c3c' : '' }}>
                {isEmergency ? '🚨 Submit Emergency' : 'Submit New Complaint'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setShowModal(false);
                setIsEmergency(false);
                setEmergencyConfirmed(false);
                setLocationComplaints([]);
                setShowExistingComplaints(false);
              }}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="modal" onClick={() => setRatingModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Rate Worker Performance</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              How satisfied are you with the work completed?
            </p>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      cursor: 'pointer',
                      color: star <= rating ? '#ffd700' : '#ddd',
                      transition: 'color 0.2s'
                    }}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <p style={{ color: '#666' }}>
                {rating === 0 && 'Click to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            <div className="form-group">
              <label>Feedback (Optional)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience..."
                rows="3"
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => handleRateWorker(ratingModal)}
              disabled={rating === 0}
            >
              Submit Rating
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setRatingModal(null);
                setRating(0);
                setFeedback('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
