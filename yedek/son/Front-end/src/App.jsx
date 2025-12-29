import { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import client from './apolloClient';
import publicClient from './publicApolloClient';
import authService from './services/authService';
import './App.css';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import PublicCareers from './pages/PublicCareers';
import InterviewPage from './pages/interview/InterviewPage';
import LikertPage from './pages/likert/LikertPage';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n'; // i18n konfigürasyonunu yükle

// Apollo Client: Main client for authenticated users, Public client for interview/likert pages

function App() {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publicPage, setPublicPage] = useState(null); // 'careers' | 'interview' | 'likert' | null

  // Check if URL is for public pages
  useEffect(() => {
    const path = window.location.pathname;
    
    if (path === '/careers' || path === '/kariyer') {
      setPublicPage('careers');
      setLoading(false);
      return;
    }
    
    if (path.startsWith('/interview/')) {
      setPublicPage('interview');
      setLoading(false);
      return;
    }
    
    if (path.startsWith('/likert/')) {
      setPublicPage('likert');
      setLoading(false);
      return;
    }
  }, []);

  // Sayfa yüklendiğinde oturum kontrolü
  useEffect(() => {
    if (publicPage) return; // Skip auth check for public pages
    
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
  }, [publicPage]);

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

  // Show public pages without authentication
  if (publicPage === 'careers') {
    return <PublicCareers />;
  }
  
  if (publicPage === 'interview') {
    const token = window.location.pathname.split('/interview/')[1];
    return (
      <ApolloProvider client={publicClient}>
        <InterviewPage token={token} />
      </ApolloProvider>
    );
  }
  
  if (publicPage === 'likert') {
    const token = window.location.pathname.split('/likert/')[1];
    return (
      <ApolloProvider client={publicClient}>
        <LikertPage token={token} />
      </ApolloProvider>
    );
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
