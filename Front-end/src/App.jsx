import { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import client from './apolloClient';
import authService from './services/authService';
import './App.css';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import PublicCareers from './pages/PublicCareers';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n'; // i18n konfigürasyonunu yükle

// Apollo Client artık tek bir yerde yapılandırıldı (src/apolloClient.js)

function App() {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPublicCareers, setShowPublicCareers] = useState(false);

  // Check if URL is for public careers page
  useEffect(() => {
    if (window.location.pathname === '/careers' || window.location.pathname === '/kariyer') {
      setShowPublicCareers(true);
      setLoading(false);
      return;
    }
  }, []);

  // Sayfa yüklendiğinde oturum kontrolü
  useEffect(() => {
    if (showPublicCareers) return; // Skip auth check for public page
    
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
          setIsLoggedIn(true);
        } catch (error) {
          // Token geçersizse temizle
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [showPublicCareers]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>{t('common.loading')}</div>
      </div>
    );
  }

  // Show public careers page without authentication
  if (showPublicCareers) {
    return <PublicCareers />;
  }

  return (
    <ApolloProvider client={client}>
      <div className="App">
        {!isLoggedIn ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <ErrorBoundary>
            <Dashboard currentUser={currentUser} onLogout={handleLogout} />
          </ErrorBoundary>
        )}
      </div>
    </ApolloProvider>
  );
}

export default App;
