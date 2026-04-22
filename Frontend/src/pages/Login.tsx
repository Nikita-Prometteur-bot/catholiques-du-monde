import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(username, password);
    
    if (success) {
      navigate('/admin');
    } else {
      setError('Invalid credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card glass">
          <div className="login-header">
            <h1>Admin Login</h1>
            <p>Catholiques du Monde CMS</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label>Username</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Signing in...' : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Demo credentials: admin / admin123</p>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #ffffff 0%, #f0f2f5 100%);
          padding: 20px;
        }
        .login-container {
          width: 100%;
          max-width: 400px;
        }
        .login-card {
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
        }
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .login-header h1 {
          font-size: 1.8rem;
          color: var(--accent);
          margin-bottom: 8px;
        }
        .login-header p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .login-form .form-group {
          margin-bottom: 20px;
        }
        .login-form label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .input-wrapper {
          position: relative;
        }
        .input-wrapper .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .input-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 1px solid #ddd;
          border-radius: 10px;
          font-size: 1rem;
          font-family: inherit;
        }
        .input-wrapper input:focus {
          outline: none;
          border-color: var(--gold);
        }
        .error-message {
          background: #ffebee;
          color: #d32f2f;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 20px;
          text-align: center;
        }
        .login-footer {
          margin-top: 25px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
        }
        .login-footer p {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default Login;
