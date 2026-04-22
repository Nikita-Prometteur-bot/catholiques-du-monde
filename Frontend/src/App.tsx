import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = localStorage.getItem('adminAuth');
  if (!auth || auth !== 'true') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default App;
