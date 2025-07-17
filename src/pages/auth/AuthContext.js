import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const signup = async (name, email, password) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/signup', { name, email, password });
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const signin = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/signin', { email, password });
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      navigate('/');
    } catch (error) {
      console.error('Signin error:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const signout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/signin');
  };

  return (
    <AuthContext.Provider value={{ user, token, signup, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);