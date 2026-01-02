const ErrorScreen = ({ message, details, language = 'tr' }) => {
  return (
    <div className="error-screen">
      <div className="error-card">
        <div className="error-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="error-title">{message}</h2>
        {details && <p className="error-message">{details}</p>}
      </div>
    </div>
  );
};

export default ErrorScreen;


