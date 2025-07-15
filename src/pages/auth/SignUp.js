import React, { useState } from 'react';
import { useAuth } from './authContext';
import { useNavigate } from 'react-router-dom';
import './auth.css'

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signup(name, email, password);
      navigate('/home');
    } catch (err) {
      setError('Failed to create an account');
    }
  };

  return (
    <div className='container'>
      <h2>Sign Up</h2>
      {error && <p className='error'>{error}</p>}
      <form onSubmit={handleSubmit} className='form'>
        <div className='formGroup'>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className='input'
          />
        </div>
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
        <button type="submit" className='button'>Sign Up</button>
      </form>
      <p>
        Already have an account? <span className='link' onClick={() => navigate('/signin')}>Sign In</span>
      </p>
    </div>
  );
};

export default SignUp;