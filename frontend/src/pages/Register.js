import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    student_id: '',
    email: '',
    password: '',
    name: '',
    hostel: '',
    room_number: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await auth.register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Student ID</label>
            <input
              type="text"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Hostel</label>
            <input
              type="text"
              value={formData.hostel}
              onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Room Number</label>
            <input
              type="text"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Register
          </button>
        </form>
        <Link to="/login" className="link">
          Already have an account? Login
        </Link>
      </div>
    </div>
  );
}

export default Register;
