import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    student_id: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Attempting login...');
      const response = await auth.login(formData);
      console.log('Login response:', response.data);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect based on role
      const role = response.data.user.role;
      console.log('User role:', role);
      
      if (role === 'resident') {
        console.log('Navigating to /student-dashboard');
        navigate('/student-dashboard');
      } else if (role === 'admin') {
        console.log('Navigating to /admin-dashboard');
        navigate('/admin-dashboard');
      } else if (role === 'worker') {
        console.log('Navigating to /worker-dashboard');
        navigate('/worker-dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>VNIT Grievance System</h2>
        <h3>Login</h3>
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
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
        <Link to="/register" className="link">
          Don't have an account? Register
        </Link>
      </div>
    </div>
  );
}

export default Login;
