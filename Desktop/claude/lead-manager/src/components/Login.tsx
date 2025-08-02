import React, { useState } from 'react';
import { Chrome, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoImage from '../assets/logo.png';

export const Login: React.FC = () => {
  const { loginWithGoogle, loginAsTestUser } = useAuth();
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);


  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.message.includes('go-forth.com')) {
        setError('Only Go-Forth team members can access this application. Please use your @go-forth.com email address.');
      } else if (err.message.includes('popup_closed')) {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
      console.error('Google sign-in error:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setError('');
    setIsTestLoading(true);

    try {
      await loginAsTestUser();
    } catch (err: any) {
      setError('Test login failed. Please try again.');
      console.error('Test login error:', err);
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <div className="logo">
            <img src={logoImage} alt="Sales-Forth Logo" width="40" height="40" />
          </div>
        </div>
        
        <h1 className="login-title">Lead Manager</h1>
        <p className="login-subtitle">Go-Forth Team Portal</p>

        <div className="login-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="button"
            className="google-signin-button primary"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <Chrome size={20} />
            <span>{isGoogleLoading ? 'Signing in with Google...' : 'Sign in with Google'}</span>
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button 
            type="button"
            className="test-login-button secondary"
            onClick={handleTestLogin}
            disabled={isTestLoading}
          >
            <span>{isTestLoading ? 'Logging in as Test User...' : 'Login as Test User (Dev)'}</span>
          </button>
        </div>

        <div className="login-footer">
          <p className="demo-note">
            Use your <strong>@go-forth.com</strong> Google account to sign in
          </p>
          <p className="test-note">
            Test login provides admin access for development purposes
          </p>
        </div>
      </div>
    </div>
  );
};