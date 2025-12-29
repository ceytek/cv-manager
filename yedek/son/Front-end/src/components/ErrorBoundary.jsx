import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Optional: send to monitoring
    // console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          Bir şeyler yanlış gitti. Lütfen sayfayı yenileyin.
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
