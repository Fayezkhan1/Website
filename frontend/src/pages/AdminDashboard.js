import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../api';

function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [complaintsList, setComplaintsList] = useState([]);
  const [stats, setStats] = useState({});
  const [adminRole, setAdminRole] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [assignData, setAssignData] = useState({ worker_id: '', deadline_days: 2 });
  const [activeTab, setActiveTab] = useState('complaints');
  const [complaintsView, setComplaintsView] = useState('all'); // all, pending, in_progress, completed
  const [workerPerformance, setWorkerPerformance] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [supervisorView, setSupervisorView] = useState('overview'); // overview, workers, assignments
  const [emergencyComplaints, setEmergencyComplaints] = useState([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);
  const [newEmergencies, setNewEmergencies] = useState([]);
  const [lastEmergencyCount, setLastEmergencyCount] = useState(0);

  useEffect(() => {
    console.log('AdminDashboard mounted, user:', user);
    loadData();
    loadWorkers();
    loadEmergencyComplaints();
    
    // Auto-refresh emergency complaints every 30 seconds
    const interval = setInterval(() => {
      loadEmergencyComplaints();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await admin.getAllComplaints();
      // Sort complaints: Emergency first, then by upvote_count
      const sortedComplaints = (response.data.complaints || []).sort((a, b) => {
        // Emergency complaints always come first
        if (a.is_emergency && !b.is_emergency) return -1;
        if (!a.is_emergency && b.is_emergency) return 1;
        // Then sort by upvote count
        return (b.upvote_count || 0) - (a.upvote_count || 0);
      });
      setComplaintsList(sortedComplaints);
      setAdminRole(response.data.admin_role);

      const statsResponse = await admin.getDashboard();
      setStats(statsResponse.data.stats);
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  const loadWorkers = async () => {
    try {
      const response = await admin.getWorkers();
      setWorkers(response.data.workers);
    } catch (err) {
      console.error('Failed to load workers', err);
    }
  };

  const loadWorkerPerformance = async () => {
    try {
      const response = await admin.getWorkerPerformance();
      setWorkerPerformance(response.data.workers);
    } catch (err) {
      console.error('Failed to load worker performance', err);
    }
  };

  const loadWorkerDetails = async (workerId) => {
    try {
      const response = await admin.getWorkerDetails(workerId);
      setSelectedWorker(response.data);
    } catch (err) {
      console.error('Failed to load worker details', err);
    }
  };

  const loadEmergencyComplaints = async () => {
    try {
      const response = await admin.getEmergencyComplaints();
      setEmergencyComplaints(response.data.complaints || []);
    } catch (err) {
      console.error('Failed to load emergency complaints', err);
    }
  };

  const handleResolveEmergency = async (complaintId) => {
    try {
      await admin.resolveEmergency(complaintId, { resolution_notes: 'Resolved by admin' });
      alert('Emergency complaint resolved successfully!');
      loadData(); // Reload all complaints
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve emergency complaint');
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.round(rating));
  };

  const getPendingComplaints = () => {
    return complaintsList.filter(c => ['pending', 'validated'].includes(c.status));
  };

  const getInProgressComplaints = () => {
    return complaintsList.filter(c => ['assigned', 'in_progress'].includes(c.status));
  };

  const getCompletedComplaints = () => {
    return complaintsList.filter(c => ['completed', 'resolved'].includes(c.status));
  };

  const getFilteredComplaints = () => {
    switch (complaintsView) {
      case 'pending':
        return getPendingComplaints();
      case 'in_progress':
        return getInProgressComplaints();
      case 'completed':
        return getCompletedComplaints();
      default:
        return complaintsList;
    }
  };

  const getUnassignedComplaints = () => {
    return complaintsList.filter(c => c.status === 'validated' && !c.assigned_to);
  };

  const getAssignedComplaints = () => {
    return complaintsList.filter(c => c.status === 'assigned' && c.assigned_to);
  };

  const getWorkerWorkload = () => {
    const workload = {};
    workers.forEach(worker => {
      workload[worker.id] = {
        name: worker.name,
        assigned: 0,
        in_progress: 0,
        completed: 0
      };
    });

    complaintsList.forEach(complaint => {
      if (complaint.assigned_to && workload[complaint.assigned_to]) {
        if (complaint.status === 'assigned') {
          workload[complaint.assigned_to].assigned++;
        } else if (complaint.status === 'in_progress') {
          workload[complaint.assigned_to].in_progress++;
        } else if (complaint.status === 'completed') {
          workload[complaint.assigned_to].completed++;
        }
      }
    });

    return Object.entries(workload).map(([id, data]) => ({
      id,
      ...data,
      total: data.assigned + data.in_progress
    }));
  };

  const handleValidate = async (complaintId, priority) => {
    try {
      await admin.validate(complaintId, { priority });
      alert('Complaint validated successfully!');
      loadData();
      setSelectedComplaint(null);
    } catch (err) {
      alert('Failed to validate complaint: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAssign = async (complaintId) => {
    try {
      await admin.assign(complaintId, assignData);
      alert('Complaint assigned successfully!');
      loadData();
      setSelectedComplaint(null);
      setAssignData({ worker_id: '', deadline_days: 2 });
    } catch (err) {
      alert('Failed to assign complaint: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getRelevantComplaints = () => {
    if (adminRole === 'validator') {
      return complaintsList.filter(c => c.status === 'pending');
    } else if (adminRole === 'supervisor') {
      return complaintsList.filter(c => ['validated', 'assigned', 'in_progress'].includes(c.status));
    } else if (adminRole === 'warden' || adminRole === 'dean') {
      return complaintsList.filter(c => c.status === 'escalated');
    }
    return complaintsList;
  };

  const relevantComplaints = getRelevantComplaints();

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
        <h1>Admin Dashboard</h1>
        <div>
          <span style={{ marginRight: '20px' }}>
            {user.name} ({adminRole || 'admin'})
          </span>
          <button onClick={() => navigate('/profile')} style={{ marginRight: '10px' }}>Profile</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'emergency' ? 'tab-active' : ''}
          onClick={() => setActiveTab('emergency')}
          style={{ background: activeTab === 'emergency' ? '#e74c3c' : '', color: activeTab === 'emergency' ? 'white' : '' }}
        >
          🚨 Emergency
        </button>
        <button 
          className={activeTab === 'complaints' ? 'tab-active' : ''}
          onClick={() => setActiveTab('complaints')}
        >
          Complaints
        </button>
        <button 
          className={activeTab === 'workers' ? 'tab-active' : ''}
          onClick={() => {
            setActiveTab('workers');
            loadWorkerPerformance();
          }}
        >
          Worker Performance
        </button>
      </div>

      <div className="dashboard">
        {activeTab === 'complaints' && (
          <>
            <div className="stats">
          {adminRole === 'validator' && (
            <div className="stat-card">
              <h3>Pending Validation</h3>
              <div className="number">{stats.pending_validation || 0}</div>
            </div>
          )}
          {adminRole === 'supervisor' && (
            <>
              <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setSupervisorView('assignments')}>
                <h3>Pending Assignment</h3>
                <div className="number">{getUnassignedComplaints().length}</div>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>Validated, not assigned</p>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setSupervisorView('progress')}>
                <h3>In Progress</h3>
                <div className="number">{getAssignedComplaints().length}</div>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>Assigned to workers</p>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setSupervisorView('workers')}>
                <h3>Active Workers</h3>
                <div className="number">{workers.length}</div>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>View workload</p>
              </div>
            </>
          )}
          {(adminRole === 'warden' || adminRole === 'dean') && (
            <div className="stat-card">
              <h3>Escalated Complaints</h3>
              <div className="number">{stats.escalated_complaints || 0}</div>
            </div>
          )}
        </div>

        {/* Supervisor Special Views */}
        {adminRole === 'supervisor' && (
          <div className="supervisor-view-tabs">
            <button 
              className={supervisorView === 'overview' ? 'view-tab-active' : ''}
              onClick={() => setSupervisorView('overview')}
            >
              📋 Overview
            </button>
            <button 
              className={supervisorView === 'workers' ? 'view-tab-active' : ''}
              onClick={() => setSupervisorView('workers')}
            >
              👷 Worker Workload
            </button>
            <button 
              className={supervisorView === 'assignments' ? 'view-tab-active' : ''}
              onClick={() => setSupervisorView('assignments')}
            >
              ⚡ Quick Assign ({getUnassignedComplaints().length})
            </button>
            <button 
              className={supervisorView === 'progress' ? 'view-tab-active' : ''}
              onClick={() => setSupervisorView('progress')}
            >
              🔄 In Progress ({getAssignedComplaints().length})
            </button>
          </div>
        )}

        {/* Complaints View Tabs */}
        {supervisorView === 'overview' && (
          <>
            <div className="complaints-view-tabs">
              <button 
                className={complaintsView === 'all' ? 'view-tab-active' : ''}
                onClick={() => setComplaintsView('all')}
              >
                All ({complaintsList.length})
              </button>
              <button 
                className={complaintsView === 'pending' ? 'view-tab-active' : ''}
                onClick={() => setComplaintsView('pending')}
              >
                Pending ({getPendingComplaints().length})
              </button>
              <button 
                className={complaintsView === 'in_progress' ? 'view-tab-active' : ''}
                onClick={() => setComplaintsView('in_progress')}
              >
                In Progress ({getInProgressComplaints().length})
              </button>
              <button 
                className={complaintsView === 'completed' ? 'view-tab-active' : ''}
                onClick={() => setComplaintsView('completed')}
              >
                Completed ({getCompletedComplaints().length})
              </button>
            </div>

            <div className="complaints-list">
          <h3>
            {complaintsView === 'all' && 'All Complaints'}
            {complaintsView === 'pending' && 'Pending Complaints'}
            {complaintsView === 'in_progress' && 'In Progress Complaints'}
            {complaintsView === 'completed' && 'Completed Complaints'}
          </h3>
          {getFilteredComplaints().length === 0 ? (
            <p>No complaints in this category.</p>
          ) : (
            getFilteredComplaints().map((complaint) => (
              <div key={complaint.id} className="complaint-card" style={{ 
                borderLeft: complaint.is_emergency && complaint.status === 'emergency' ? '5px solid #e74c3c' :
                           (complaint.upvote_count || 0) >= 5 ? '4px solid #e74c3c' : 
                           (complaint.upvote_count || 0) >= 3 ? '4px solid #f39c12' : '1px solid #eee',
                background: complaint.is_emergency && complaint.status === 'emergency' ? '#fff5f5' : 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h4 style={{ flex: 1 }}>{complaint.title}</h4>
                  {(complaint.upvote_count || 0) > 0 && (
                    <div style={{ 
                      background: (complaint.upvote_count || 0) >= 5 ? '#e74c3c' : 
                                 (complaint.upvote_count || 0) >= 3 ? '#f39c12' : '#667eea',
                      color: 'white',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      marginLeft: '1rem'
                    }}>
                      👥 {complaint.upvote_count} {complaint.upvote_count === 1 ? 'person' : 'people'}
                    </div>
                  )}
                </div>
                
                {/* Student Information */}
                {complaint.student_name && (
                  <div style={{ 
                    background: '#f0f8ff', 
                    padding: '0.8rem', 
                    borderRadius: '5px', 
                    marginBottom: '1rem',
                    borderLeft: '3px solid #667eea'
                  }}>
                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#333' }}>
                      <strong>👤 Student:</strong> {complaint.student_name}
                      {complaint.student_id && ` (ID: ${complaint.student_id})`}
                    </p>
                  </div>
                )}
                
                <p>{complaint.description}</p>
                <p><strong>Category:</strong> {complaint.category}</p>
                <p><strong>Location:</strong> {complaint.location}</p>
                <div>
                  <span className={`badge badge-${complaint.status}`}>{complaint.status}</span>
                  <span className={`badge badge-${complaint.priority}`}>{complaint.priority}</span>
                  {complaint.is_emergency && <span className="badge badge-high">EMERGENCY</span>}
                </div>
                <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                  Filed: {new Date(complaint.created_at).toLocaleString()}
                </p>

                {/* Progress Photo */}
                {complaint.progress_photo_url && (
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>📸 Progress Photo (Before Work):</strong></p>
                    <img 
                      src={complaint.progress_photo_url} 
                      alt="Progress" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        borderRadius: '8px', 
                        marginTop: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(complaint.progress_photo_url, '_blank')}
                    />
                  </div>
                )}

                {/* Completion Photo */}
                {complaint.completion_photo_url && (
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>✅ Completion Photo (After Work):</strong></p>
                    <img 
                      src={complaint.completion_photo_url} 
                      alt="Completed" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        borderRadius: '8px', 
                        marginTop: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(complaint.completion_photo_url, '_blank')}
                    />
                  </div>
                )}

                {/* Worker Rating */}
                {complaint.worker_rating && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    background: '#f0f8ff', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #667eea'
                  }}>
                    <strong>Student Rating:</strong> {renderStars(complaint.worker_rating)} ({complaint.worker_rating}/5)
                    {complaint.rated_at && (
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                        Rated on: {new Date(complaint.rated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Emergency Resolution - Available to ALL admins */}
                {complaint.is_emergency && complaint.status === 'emergency' && (
                  <div style={{ marginTop: '15px' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: 'auto', background: '#27ae60' }}
                      onClick={() => {
                        if (window.confirm('Mark this emergency as resolved?')) {
                          handleResolveEmergency(complaint.id);
                        }
                      }}
                    >
                      ✓ Mark as Resolved
                    </button>
                  </div>
                )}

                {/* Validator Actions */}
                {adminRole === 'validator' && complaint.status === 'pending' && !complaint.is_emergency && (
                  <div style={{ marginTop: '15px' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: 'auto', marginRight: '10px' }}
                      onClick={() => handleValidate(complaint.id, 'medium')}
                    >
                      Validate (Medium Priority)
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: 'auto', marginRight: '10px', background: '#e74c3c' }}
                      onClick={() => handleValidate(complaint.id, 'high')}
                    >
                      Validate (High Priority)
                    </button>
                  </div>
                )}

                {/* Supervisor Actions */}
                {adminRole === 'supervisor' && complaint.status === 'in_progress' && (
                  <div style={{ marginTop: '15px' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: 'auto' }}
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      Assign to Worker
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
          </>
        )}

        {/* Supervisor Worker Workload View */}
        {adminRole === 'supervisor' && supervisorView === 'workers' && (
          <div className="supervisor-workload-section">
            <h2>Worker Workload Overview</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Monitor worker assignments and balance workload</p>
            
            <div className="workers-workload-grid">
              {getWorkerWorkload().sort((a, b) => b.total - a.total).map((worker) => (
                <div key={worker.id} className="workload-card">
                  <h3>{worker.name}</h3>
                  
                  <div className="workload-stats">
                    <div className="workload-stat">
                      <div className="workload-number" style={{ color: '#f39c12' }}>{worker.assigned}</div>
                      <div className="workload-label">Assigned</div>
                    </div>
                    <div className="workload-stat">
                      <div className="workload-number" style={{ color: '#3498db' }}>{worker.in_progress}</div>
                      <div className="workload-label">In Progress</div>
                    </div>
                    <div className="workload-stat">
                      <div className="workload-number" style={{ color: '#27ae60' }}>{worker.completed}</div>
                      <div className="workload-label">Completed</div>
                    </div>
                  </div>

                  <div className="workload-total">
                    <strong>Active Tasks:</strong> {worker.total}
                    {worker.total > 5 && <span style={{ color: '#e74c3c', marginLeft: '10px' }}>⚠️ High Load</span>}
                    {worker.total === 0 && <span style={{ color: '#27ae60', marginLeft: '10px' }}>✓ Available</span>}
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ marginTop: '15px', width: '100%' }}
                    onClick={() => {
                      setSupervisorView('overview');
                      setComplaintsView('in_progress');
                    }}
                  >
                    View Tasks
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supervisor Quick Assign View */}
        {adminRole === 'supervisor' && supervisorView === 'assignments' && (
          <div className="supervisor-assign-section">
            <h2>Quick Assignment</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Assign {getUnassignedComplaints().length} pending complaint(s) to workers
            </p>

            {getUnassignedComplaints().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: '10px' }}>
                <h3 style={{ color: '#27ae60' }}>✓ All Caught Up!</h3>
                <p style={{ color: '#666' }}>No complaints waiting for assignment</p>
              </div>
            ) : (
              <div className="quick-assign-list">
                {getUnassignedComplaints().map((complaint) => (
                  <div key={complaint.id} className="quick-assign-card">
                    <div className="assign-card-header">
                      <h4>{complaint.title}</h4>
                      <span className={`badge badge-${complaint.priority}`}>{complaint.priority}</span>
                    </div>
                    
                    <p style={{ color: '#666', margin: '10px 0' }}>{complaint.description}</p>
                    <p><strong>Location:</strong> {complaint.location}</p>
                    <p><strong>Category:</strong> {complaint.category}</p>
                    
                    {complaint.upvote_count > 0 && (
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '8px', 
                        background: '#fff3cd', 
                        borderRadius: '5px',
                        color: '#856404'
                      }}>
                        👥 {complaint.upvote_count} {complaint.upvote_count === 1 ? 'person' : 'people'} reported this
                      </div>
                    )}

                    <div className="assign-worker-select" style={{ marginTop: '15px' }}>
                      <select 
                        className="form-control"
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedComplaint(complaint);
                            setAssignData({ ...assignData, worker_id: e.target.value });
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">Select Worker...</option>
                        {getWorkerWorkload()
                          .sort((a, b) => a.total - b.total)
                          .map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name} ({worker.total} active tasks)
                              {worker.total === 0 && ' - Available'}
                              {worker.total > 5 && ' - High Load'}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          </>
        )}

      {/* Assignment Modal */}
      {selectedComplaint && activeTab === 'complaints' && (
        <div className="modal" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Complaint to Worker</h3>
            <p><strong>{selectedComplaint.title}</strong></p>
            <div className="form-group">
              <label>Select Worker</label>
              <select
                value={assignData.worker_id}
                onChange={(e) => setAssignData({ ...assignData, worker_id: e.target.value })}
              >
                <option value="">-- Select Worker --</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} ({worker.student_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Deadline (days)</label>
              <input
                type="number"
                value={assignData.deadline_days}
                onChange={(e) => setAssignData({ ...assignData, deadline_days: e.target.value })}
                min="1"
                max="30"
              />
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => handleAssign(selectedComplaint.id)}
              disabled={!assignData.worker_id}
            >
              Assign
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setSelectedComplaint(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

        {/* Supervisor In Progress View */}
        {adminRole === 'supervisor' && supervisorView === 'progress' && (
          <div className="supervisor-progress-section">
            <h2>In Progress Complaints</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              {getAssignedComplaints().length} complaint(s) currently assigned to workers
            </p>

            {getAssignedComplaints().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: '10px' }}>
                <h3 style={{ color: '#999' }}>No complaints in progress</h3>
                <p style={{ color: '#999' }}>Assigned complaints will appear here</p>
              </div>
            ) : (
              <div className="complaints-list">
                {getAssignedComplaints().map((complaint) => {
                  const worker = workers.find(w => w.id === complaint.assigned_to);
                  
                  return (
                    <div key={complaint.id} className="complaint-card" style={{ borderLeft: '4px solid #f39c12' }}>
                      <h4>{complaint.title}</h4>
                      
                      {/* Student Information */}
                      {complaint.student_name && (
                        <div style={{ 
                          background: '#fff9e6', 
                          padding: '0.8rem', 
                          borderRadius: '5px', 
                          marginBottom: '1rem',
                          borderLeft: '3px solid #f39c12'
                        }}>
                          <p style={{ margin: '0', fontSize: '0.9rem', color: '#333' }}>
                            <strong>👤 Student:</strong> {complaint.student_name}
                            {complaint.student_id && ` (ID: ${complaint.student_id})`}
                          </p>
                        </div>
                      )}
                      
                      <p>{complaint.description}</p>
                      <p><strong>Category:</strong> {complaint.category}</p>
                      <p><strong>Location:</strong> {complaint.location}</p>
                      
                      <div style={{ 
                        marginTop: '15px', 
                        padding: '15px', 
                        background: '#fff8e1', 
                        borderRadius: '8px',
                        border: '1px solid #f39c12'
                      }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#f39c12' }}>
                          👷 Assigned Worker
                        </p>
                        <p style={{ margin: '5px 0' }}>
                          <strong>Name:</strong> {worker ? worker.name : 'Unknown'}
                        </p>
                        {worker && (
                          <p style={{ margin: '5px 0' }}>
                            <strong>ID:</strong> {worker.student_id}
                          </p>
                        )}
                        <p style={{ margin: '5px 0' }}>
                          <strong>Assigned:</strong> {new Date(complaint.updated_at).toLocaleString()}
                        </p>
                      </div>

                      {complaint.progress_photo_url && (
                        <div style={{ marginTop: '15px' }}>
                          <p><strong>📸 Progress Photo:</strong></p>
                          <img 
                            src={complaint.progress_photo_url} 
                            alt="Progress" 
                            style={{ 
                              maxWidth: '300px', 
                              borderRadius: '8px', 
                              marginTop: '5px',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(complaint.progress_photo_url, '_blank')}
                          />
                          <p style={{ fontSize: '12px', color: '#27ae60', marginTop: '5px' }}>
                            ✓ Worker has started working
                          </p>
                        </div>
                      )}

                      <div style={{ marginTop: '15px' }}>
                        <span className="badge badge-assigned">Assigned</span>
                        <span className={`badge badge-${complaint.priority}`}>{complaint.priority} priority</span>
                      </div>

                      <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                        Filed: {new Date(complaint.created_at).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'emergency' && (
          <div>
            <h2 style={{ color: '#e74c3c', marginBottom: '2rem' }}>🚨 Emergency Complaints</h2>
            
            <div className="complaints-list">
              {complaintsList.filter(c => c.is_emergency && c.status === 'emergency').length === 0 ? (
                <div style={{ 
                  padding: '3rem', 
                  textAlign: 'center', 
                  background: '#f0fff4', 
                  borderRadius: '8px',
                  border: '2px solid #27ae60'
                }}>
                  <p style={{ fontSize: '1.5rem', color: '#27ae60', margin: 0 }}>
                    ✅ No active emergencies
                  </p>
                </div>
              ) : (
                complaintsList.filter(c => c.is_emergency && c.status === 'emergency').map((complaint) => (
                  <div 
                    key={complaint.id} 
                    className="complaint-card" 
                    style={{ 
                      borderLeft: '5px solid #e74c3c',
                      background: '#fff5f5'
                    }}
                  >
                    <h4 style={{ color: '#e74c3c' }}>🚨 {complaint.title}</h4>
                    
                    {/* Student Information */}
                    {complaint.student_name && (
                      <div style={{ 
                        background: '#fff5f5', 
                        padding: '0.8rem', 
                        borderRadius: '5px', 
                        marginBottom: '1rem',
                        borderLeft: '3px solid #e74c3c'
                      }}>
                        <p style={{ margin: '0', fontSize: '0.9rem', color: '#333' }}>
                          <strong>👤 Student:</strong> {complaint.student_name}
                          {complaint.student_id && ` (ID: ${complaint.student_id})`}
                        </p>
                      </div>
                    )}
                    
                    <p>{complaint.description}</p>
                    <p><strong>Category:</strong> {complaint.category}</p>
                    <p><strong>Location:</strong> {complaint.location}</p>
                    <div>
                      <span className="badge badge-emergency" style={{ background: '#e74c3c', color: 'white' }}>EMERGENCY</span>
                    </div>
                    
                    {complaint.image_url && (
                      <div style={{ marginTop: '15px' }}>
                        <p><strong>Photo:</strong></p>
                        <img 
                          src={complaint.image_url} 
                          alt="Emergency" 
                          style={{ 
                            maxWidth: '300px', 
                            borderRadius: '8px', 
                            marginTop: '5px',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(complaint.image_url, '_blank')}
                        />
                      </div>
                    )}
                    
                    <p style={{ marginTop: '15px', fontSize: '12px', color: '#e74c3c', fontWeight: 'bold' }}>
                      ⏰ Submitted: {new Date(complaint.created_at).toLocaleString()}
                    </p>
                    
                    <button 
                      className="btn btn-primary"
                      style={{ 
                        background: '#27ae60',
                        marginTop: '15px',
                        width: 'auto'
                      }}
                      onClick={() => {
                        if (window.confirm('Mark this emergency as resolved?')) {
                          handleResolveEmergency(complaint.id);
                        }
                      }}
                    >
                      ✓ Mark as Resolved
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <h3 style={{ color: '#27ae60', marginTop: '3rem', marginBottom: '1rem' }}>✅ Resolved Emergencies</h3>
            <div className="complaints-list">
              {complaintsList.filter(c => c.is_emergency && c.status === 'resolved').length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
                  No resolved emergencies yet
                </p>
              ) : (
                complaintsList.filter(c => c.is_emergency && c.status === 'resolved').map((complaint) => (
                  <div 
                    key={complaint.id} 
                    className="complaint-card" 
                    style={{ 
                      borderLeft: '5px solid #27ae60',
                      background: '#f0fff4',
                      opacity: 0.8
                    }}
                  >
                    <h4>{complaint.title}</h4>
                    
                    {/* Student Information */}
                    {complaint.student_name && (
                      <div style={{ 
                        background: '#f0f8ff', 
                        padding: '0.8rem', 
                        borderRadius: '5px', 
                        marginBottom: '1rem',
                        borderLeft: '3px solid #667eea'
                      }}>
                        <p style={{ margin: '0', fontSize: '0.9rem', color: '#333' }}>
                          <strong>👤 Student:</strong> {complaint.student_name}
                          {complaint.student_id && ` (ID: ${complaint.student_id})`}
                        </p>
                      </div>
                    )}
                    
                    <p>{complaint.description}</p>
                    <p><strong>Location:</strong> {complaint.location}</p>
                    <div>
                      <span className="badge" style={{ background: '#27ae60', color: 'white' }}>RESOLVED</span>
                    </div>
                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                      Submitted: {new Date(complaint.created_at).toLocaleString()}
                    </p>
                    {complaint.resolved_at && (
                      <p style={{ fontSize: '12px', color: '#27ae60', fontWeight: 'bold' }}>
                        ✓ Resolved: {new Date(complaint.resolved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="worker-performance-section">
            <h2>Worker Performance Dashboard</h2>
            
            {selectedWorker ? (
              <div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedWorker(null)}
                  style={{ marginBottom: '20px' }}
                >
                  ← Back to All Workers
                </button>
                
                <div className="worker-detail-card">
                  <h3>{selectedWorker.worker.name}</h3>
                  <p><strong>Email:</strong> {selectedWorker.worker.email}</p>
                  <p><strong>Student ID:</strong> {selectedWorker.worker.student_id}</p>
                  
                  <div className="profile-stats" style={{ marginTop: '20px' }}>
                    <div className="stat-card">
                      <h3>{renderStars(selectedWorker.worker.average_rating || 0)}</h3>
                      <p>Average Rating</p>
                      <p className="stat-number">{(selectedWorker.worker.average_rating || 0).toFixed(2)}/5.0</p>
                    </div>
                    <div className="stat-card">
                      <h3>{selectedWorker.worker.total_ratings || 0}</h3>
                      <p>Total Ratings</p>
                    </div>
                    <div className="stat-card">
                      <h3>{selectedWorker.stats.completed}</h3>
                      <p>Completed Tasks</p>
                    </div>
                    <div className="stat-card">
                      <h3>{selectedWorker.stats.in_progress}</h3>
                      <p>In Progress</p>
                    </div>
                  </div>

                  <h4 style={{ marginTop: '30px' }}>Recent Ratings</h4>
                  <div className="ratings-list">
                    {selectedWorker.ratings && selectedWorker.ratings.length > 0 ? (
                      selectedWorker.ratings.slice(0, 10).map((rating, index) => (
                        <div key={index} className="rating-card">
                          <div className="rating-header">
                            <span className="rating-stars">{renderStars(rating.rating)}</span>
                            <span className="rating-date">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {rating.feedback && (
                            <p className="rating-feedback">"{rating.feedback}"</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No ratings yet.</p>
                    )}
                  </div>

                  <h4 style={{ marginTop: '30px' }}>All Assigned Tasks</h4>
                  <div className="complaints-list">
                    {selectedWorker.tasks && selectedWorker.tasks.map((task) => (
                      <div key={task.id} className="complaint-card">
                        <h4>{task.title}</h4>
                        <p>{task.description}</p>
                        <p><strong>Location:</strong> {task.location}</p>
                        <div>
                          <span className={`badge badge-${task.status}`}>{task.status}</span>
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        </div>
                        {task.worker_rating && (
                          <div style={{ marginTop: '10px', padding: '8px', background: '#f0f8ff', borderRadius: '5px' }}>
                            <strong>Rating:</strong> {renderStars(task.worker_rating)} ({task.worker_rating}/5)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="workers-grid">
                {workerPerformance.length === 0 ? (
                  <p>No workers found.</p>
                ) : (
                  workerPerformance.map((worker) => (
                    <div 
                      key={worker.id} 
                      className="worker-card"
                      onClick={() => loadWorkerDetails(worker.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h3>{worker.name}</h3>
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>{worker.email}</p>
                      
                      <div style={{ margin: '15px 0' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                          {renderStars(worker.average_rating || 0)}
                        </div>
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>
                          {(worker.average_rating || 0).toFixed(2)}/5.0
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#999' }}>
                          {worker.total_ratings} {worker.total_ratings === 1 ? 'rating' : 'ratings'}
                        </p>
                      </div>

                      <div className="worker-stats">
                        <div>
                          <strong>{worker.completed_tasks}</strong>
                          <p>Completed</p>
                        </div>
                        <div>
                          <strong>{worker.in_progress_tasks}</strong>
                          <p>In Progress</p>
                        </div>
                        <div>
                          <strong>{worker.assigned_tasks}</strong>
                          <p>Total Assigned</p>
                        </div>
                      </div>

                      <button 
                        className="btn btn-primary" 
                        style={{ marginTop: '15px', width: '100%' }}
                      >
                        View Details
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showEmergencyModal && selectedEmergency && (
        <div className="modal" onClick={() => setShowEmergencyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#27ae60' }}>✓ Resolve Emergency Complaint</h3>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>{selectedEmergency.title}</h4>
              <p><strong>Student:</strong> {selectedEmergency.student_name}</p>
              <p><strong>Location:</strong> {selectedEmergency.location}</p>
              <p style={{ marginTop: '0.5rem' }}>{selectedEmergency.description}</p>
            </div>

            <div className="form-group">
              <label>Resolution Notes (Optional)</label>
              <textarea
                rows="4"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the emergency was resolved..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ background: '#27ae60', flex: 1 }}
                onClick={() => handleResolveEmergency(selectedEmergency.id)}
              >
                ✓ Confirm Resolution
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => {
                  setShowEmergencyModal(false);
                  setSelectedEmergency(null);
                  setResolutionNotes('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
