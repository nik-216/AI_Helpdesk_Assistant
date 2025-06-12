import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './pages/auth/AuthContext';
import SignUp from './pages/auth/SignUp';
import SignIn from './pages/auth/SignIn';
import Home from './pages/admin/Home';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<SignIn />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;