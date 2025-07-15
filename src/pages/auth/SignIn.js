import React, { useState } from 'react';
import { useAuth } from './authContext';
import { useNavigate } from 'react-router-dom';
import './auth.css'; 

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signin(email, password);
      navigate('/home')
    } catch (err) {
      setError('Failed to sign in');
    }
  };

  return (
    <div className='container'>
      <h2>Sign In</h2>
      {error && <p className='error'>{error}</p>}
      <form onSubmit={handleSubmit} className='form'>
        <div className='formGroup'>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='input'
          />
        </div>
        <div className='formGroup'>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className='input'
          />
        </div>
        <button type="submit" className='button'>Sign In</button>
      </form>
      <p>
        Don't have an account? <span className='link' onClick={() => navigate('/signup')}>Sign Up</span>
      </p>
    </div>
  );
};

export default SignIn;