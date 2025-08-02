import React from 'react';
import { useAuth } from './contexts/AuthContextMinimal';
import { LoginMinimal } from './components/LoginMinimal';

const AppMinimal: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginMinimal />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #eee'
      }}>
        <h1>Lead Manager Dashboard</h1>
        <div>
          <span>Welcome, {user?.name}</span>
          <button 
            onClick={logout}
            style={{ 
              marginLeft: '10px',
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>
      
      <main>
        <h2>Application Working!</h2>
        <p>This minimal version is working. We can now add back features gradually.</p>
        <div style={{ 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          padding: '12px',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <strong>✅ Success:</strong> Authentication system is working with minimal context.
        </div>
      </main>
    </div>
  );
};

export default AppMinimal;