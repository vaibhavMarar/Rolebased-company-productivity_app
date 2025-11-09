import { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import WeeklyCalendar from './components/WeeklyCalendar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <ErrorBoundary>
      <div className="app">
        {isAuthenticated ? (
          <WeeklyCalendar onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;

