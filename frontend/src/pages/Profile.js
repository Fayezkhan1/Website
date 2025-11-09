import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleBack = () => {
    if (user.role === 'resident') {
      navigate('/student-dashboard');
    } else if (user.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (user.role === 'worker') {
      navigate('/worker-dashboard');
    }
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
        <h1>My Profile</h1>
        <div>
          <button onClick={handleBack} style={{ marginRight: '10px' }}>Back to Dashboard</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: 'white'
              }}>
                {user.role === 'resident' ? '🎓' : user.role === 'admin' ? '👔' : '🔧'}
              </div>
              <h2 style={{ margin: '0.5rem 0', color: '#333' }}>{user.name}</h2>
              <p style={{ color: '#666', textTransform: 'capitalize' }}>
                {user.role === 'resident' ? 'Student' : user.role}
                {user.admin_role && ` - ${user.admin_role}`}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
              <div className="profile-field">
                <label>Student/Employee ID</label>
                <p>{user.student_id}</p>
              </div>

              <div className="profile-field">
                <label>Email</label>
                <p>{user.email}</p>
              </div>

              {user.hostel && (
                <div className="profile-field">
                  <label>Hostel</label>
                  <p>{user.hostel}</p>
                </div>
              )}

              {user.room_number && (
                <div className="profile-field">
                  <label>Room Number</label>
                  <p>{user.room_number}</p>
                </div>
              )}

              <div className="profile-field">
                <label>Account Type</label>
                <p style={{ textTransform: 'capitalize' }}>
                  {user.role === 'resident' ? 'Student' : user.role}
                </p>
              </div>

              {user.admin_role && (
                <div className="profile-field">
                  <label>Admin Role</label>
                  <p style={{ textTransform: 'capitalize' }}>{user.admin_role}</p>
                </div>
              )}

              <div className="profile-field">
                <label>Member Since</label>
                <p>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleBack}
                style={{ width: 'auto', marginRight: '1rem' }}
              >
                Back to Dashboard
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleLogout}
                style={{ width: 'auto', background: '#e74c3c' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
