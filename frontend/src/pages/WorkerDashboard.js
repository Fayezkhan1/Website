import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { worker } from '../api';
import './WorkerDashboard.css';

function WorkerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressPhoto, setProgressPhoto] = useState(null);
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTasks();
    loadProfile();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await worker.getTasks();
      setTasks(response.data.tasks);
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await worker.getProfile();
      setProfile(response.data);
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const handlePhotoCapture = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'progress') {
          setProgressPhoto(reader.result);
        } else {
          setCompletionPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProgressPhoto = async (taskId) => {
    if (!progressPhoto) {
      alert('Please capture a photo first');
      return;
    }

    setUploading(true);
    try {
      await worker.uploadProgressPhoto(taskId, progressPhoto);
      alert('Progress photo uploaded! Task marked as in progress.');
      setProgressPhoto(null);
      setSelectedTask(null);
      loadTasks();
    } catch (err) {
      alert('Failed to upload photo: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadCompletionPhoto = async (taskId) => {
    if (!completionPhoto) {
      alert('Please capture a photo first');
      return;
    }

    setUploading(true);
    try {
      await worker.uploadCompletionPhoto(taskId, completionPhoto);
      alert('Task completed! Photo uploaded successfully.');
      setCompletionPhoto(null);
      setSelectedTask(null);
      loadTasks();
      loadProfile(); // Refresh profile to update completed tasks count
    } catch (err) {
      alert('Failed to upload photo: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.round(rating));
  };

  // Filter tasks by status
  const pendingTasks = tasks.filter(task => task.status === 'assigned');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'resolved');

  const renderTaskCard = (task) => (
    <div key={task.id} className="complaint-card">
      <h4>{task.title}</h4>
      <p>{task.description}</p>
      <p><strong>Category:</strong> {task.category}</p>
      <p><strong>Location:</strong> {task.location}</p>
      <div>
        <span className={`badge badge-${task.status}`}>{task.status}</span>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
      </div>

      {task.progress_photo_url && (
        <div className="photo-preview">
          <p><strong>Progress Photo:</strong></p>
          <img 
            src={task.progress_photo_url} 
            alt="Progress" 
            onClick={() => window.open(task.progress_photo_url, '_blank')}
            style={{ cursor: 'pointer' }}
          />
        </div>
      )}

      {task.completion_photo_url && (
        <div className="photo-preview">
          <p><strong>Completion Photo:</strong></p>
          <img 
            src={task.completion_photo_url} 
            alt="Completed" 
            onClick={() => window.open(task.completion_photo_url, '_blank')}
            style={{ cursor: 'pointer' }}
          />
        </div>
      )}

      {task.worker_rating && (
        <div className="rating-display">
          <strong>Student Rating:</strong> {renderStars(task.worker_rating)} ({task.worker_rating}/5)
          {task.worker_feedback && <p style={{ fontStyle: 'italic', marginTop: '5px' }}>"{task.worker_feedback}"</p>}
        </div>
      )}

      <div style={{ marginTop: '15px' }}>
        {task.status === 'assigned' && (
          <button 
            className="btn btn-primary" 
            onClick={() => setSelectedTask({ id: task.id, action: 'progress' })}
          >
            Upload Progress Photo & Start Work
          </button>
        )}
        {task.status === 'in_progress' && !task.completion_photo_url && (
          <button 
            className="btn btn-success" 
            onClick={() => setSelectedTask({ id: task.id, action: 'complete' })}
          >
            Upload Completion Photo & Mark Complete
          </button>
        )}
      </div>
    </div>
  );

  if (!user || !user.name) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="worker-container">
      <div className="navbar">
        <h1>Worker Dashboard</h1>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="worker-tabs">
        <button 
          className={activeTab === 'pending' ? 'tab-active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending to Start ({pendingTasks.length})
        </button>
        <button 
          className={activeTab === 'inprogress' ? 'tab-active' : ''}
          onClick={() => setActiveTab('inprogress')}
        >
          In Progress ({inProgressTasks.length})
        </button>
        <button 
          className={activeTab === 'completed' ? 'tab-active' : ''}
          onClick={() => setActiveTab('completed')}
        >
          Finished ({completedTasks.length})
        </button>
        <button 
          className={activeTab === 'profile' ? 'tab-active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          My Profile & Ratings
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="dashboard">
          <h2>Tasks Pending to Start</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            These tasks have been assigned to you. Upload a progress photo to start working.
          </p>

          <div className="complaints-list">
            {pendingTasks.length === 0 ? (
              <p>No pending tasks. Great job!</p>
            ) : (
              pendingTasks.map(renderTaskCard)
            )}
          </div>
        </div>
      )}

      {activeTab === 'inprogress' && (
        <div className="dashboard">
          <h2>Tasks In Progress</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            You're currently working on these tasks. Upload a completion photo when done.
          </p>

          <div className="complaints-list">
            {inProgressTasks.length === 0 ? (
              <p>No tasks in progress. Start a pending task to see it here.</p>
            ) : (
              inProgressTasks.map(renderTaskCard)
            )}
          </div>
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="dashboard">
          <h2>Finished Tasks</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Your completed work history and ratings from students.
          </p>

          <div className="complaints-list">
            {completedTasks.length === 0 ? (
              <p>No completed tasks yet. Complete your first task to see it here!</p>
            ) : (
              completedTasks.map(renderTaskCard)
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && profile && (
        <div className="dashboard">
          <div className="profile-section">
            <h2>My Profile</h2>
            <div className="profile-stats">
              <div className="stat-card">
                <h3>{renderStars(profile.profile.average_rating || 0)}</h3>
                <p>Average Rating</p>
                <p className="stat-number">{(profile.profile.average_rating || 0).toFixed(2)}/5.0</p>
              </div>
              <div className="stat-card">
                <h3>{profile.profile.total_ratings || 0}</h3>
                <p>Total Ratings</p>
              </div>
              <div className="stat-card">
                <h3>{profile.profile.completed_tasks || 0}</h3>
                <p>Completed Tasks</p>
              </div>
            </div>

            <h3>Recent Ratings</h3>
            <div className="ratings-list">
              {profile.ratings && profile.ratings.length > 0 ? (
                profile.ratings.map((rating, index) => (
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
                <p>No ratings yet. Complete tasks to receive ratings!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {selectedTask.action === 'progress' 
                ? 'Upload Progress Photo' 
                : 'Upload Completion Photo'}
            </h3>
            <p>
              {selectedTask.action === 'progress'
                ? 'Take a photo showing the problem/issue before you start working.'
                : 'Take a photo showing the completed work.'}
            </p>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhotoCapture(e, selectedTask.action === 'progress' ? 'progress' : 'completion')}
              style={{ marginBottom: '15px' }}
            />

            {(selectedTask.action === 'progress' ? progressPhoto : completionPhoto) && (
              <div className="photo-preview">
                <img 
                  src={selectedTask.action === 'progress' ? progressPhoto : completionPhoto} 
                  alt="Preview" 
                />
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (selectedTask.action === 'progress') {
                    handleUploadProgressPhoto(selectedTask.id);
                  } else {
                    handleUploadCompletionPhoto(selectedTask.id);
                  }
                }}
                disabled={uploading || (selectedTask.action === 'progress' ? !progressPhoto : !completionPhoto)}
              >
                {uploading ? 'Uploading...' : 'Upload & Submit'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedTask(null)}
                disabled={uploading}
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

export default WorkerDashboard;
