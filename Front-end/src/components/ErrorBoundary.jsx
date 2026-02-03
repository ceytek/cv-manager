import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorKey: 0 };
  }

  static getDerivedStateFromError(error) {
    // insertBefore hatası gibi DOM hatalarını ignore et - bunlar genellikle zararsız
    if (error?.message?.includes('insertBefore') || 
        error?.message?.includes('removeChild') ||
        error?.message?.includes('appendChild')) {
      console.warn('DOM manipulation error (ignored):', error.message);
      return null; // State değiştirme, ignore et
    }
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // DOM manipulation hataları için auto-recover dene
    if (error?.message?.includes('insertBefore') || 
        error?.message?.includes('removeChild') ||
        error?.message?.includes('appendChild')) {
      // Bir sonraki tick'te state'i resetle
      setTimeout(() => {
        this.setState(prev => ({ hasError: false, errorKey: prev.errorKey + 1 }));
      }, 0);
      return;
    }
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, errorKey: prev.errorKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p>Bir şeyler yanlış gitti.</p>
          <button 
            onClick={this.handleRetry}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              background: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Tekrar Dene
          </button>
        </div>
      );
    }
    return <React.Fragment key={this.state.errorKey}>{this.props.children}</React.Fragment>;
  }
}

export default ErrorBoundary;
