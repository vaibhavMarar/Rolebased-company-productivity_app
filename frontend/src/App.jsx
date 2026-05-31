import { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { api } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // Verify token on app load
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = api.getToken();
        if (token) {
          // Verify token with backend
          const result = await api.verifyToken();
          if (result.valid) {
            setIsAuthenticated(true);
            setUser(result.user || api.getUser());
          } else {
            // Check if it's a 404 error (endpoint not available)
            if (result.warning && result.warning.includes('not available')) {
              // Endpoint not available, but token exists - allow user to continue
              // They should restart the server for full functionality
              console.warn('Token verification endpoint not available. Please restart the server.');
              setIsAuthenticated(true);
              setUser(api.getUser());
            } else {
              // Token is invalid, clear auth
              api.clearAuth();
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        // On error, check if we have a token - if yes, allow user to continue
        // They might need to restart the server
        const token = api.getToken();
        if (token) {
          console.warn('Could not verify token, but token exists. Continuing with existing session.');
          setIsAuthenticated(true);
          setUser(api.getUser());
        } else {
          api.clearAuth();
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();

    // Listen for auth logout events (from API service)
    const handleAuthLogout = (event) => {
      console.log('Auth logout event:', event.detail);
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData || api.getUser());
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="app">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            color: '#e0e0e0'
          }}>
            <div>Loading...</div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        {isAuthenticated ? (
          user?.role === 'admin' ? (
            <AdminDashboard onLogout={handleLogout} user={user} />
          ) : (
            <EmployeeDashboard onLogout={handleLogout} user={user} />
          )
        ) : showRegister ? (
          <Register 
            onRegister={handleLogin} 
            onSwitchToLogin={() => setShowRegister(false)} 
          />
        ) : (
          <Login 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setShowRegister(true)} 
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;

