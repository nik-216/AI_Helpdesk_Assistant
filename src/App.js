import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './pages/auth/authContext';

import SignUp from './pages/auth/signUp';
import SignIn from './pages/auth/signIn';
import Home from './pages/home/home'

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;