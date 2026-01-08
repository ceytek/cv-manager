import { useState, useRef, useEffect } from 'react';

const translations = {
  tr: {
    title: 'Kamera ve Mikrofon Testi',
    subtitle: 'Lütfen kamera ve mikrofonunuzun düzgün çalıştığından emin olun.',
    cameraPermission: 'Kamera izni gerekli. Lütfen tarayıcınızdan kamera erişimine izin verin.',
    camera: 'Kamera',
    microphone: 'Mikrofon',
    active: 'Aktif',
    inactive: 'Pasif',
    back: 'Geri',
    ready: 'Hazırım, Devam Et',
    waiting: 'Kamera bekleniyor...',
    checkingPermissions: 'İzinler kontrol ediliyor...',
    permissionDenied: 'Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.',
    notFound: 'Kamera bulunamadı. Lütfen bir kamera bağlı olduğundan emin olun.',
    httpsRequired: 'Kamera erişimi için güvenli bağlantı (HTTPS) gereklidir. Lütfen sistem yöneticinize başvurun veya localhost üzerinden deneyin.'
  },
  en: {
    title: 'Camera and Microphone Test',
    subtitle: 'Please make sure your camera and microphone are working properly.',
    cameraPermission: 'Camera permission required. Please allow camera access in your browser.',
    camera: 'Camera',
    microphone: 'Microphone',
    active: 'Active',
    inactive: 'Inactive',
    back: 'Back',
    ready: 'I\'m Ready, Continue',
    waiting: 'Waiting for camera...',
    checkingPermissions: 'Checking permissions...',
    permissionDenied: 'Camera permission denied. Please allow access in browser settings.',
    notFound: 'Camera not found. Please make sure a camera is connected.',
    httpsRequired: 'Secure connection (HTTPS) is required for camera access. Please contact your system administrator or try from localhost.'
  }
};

const CameraTestScreen = ({ language = 'tr', onReady, onBack }) => {
  const t = translations[language] || translations.tr;
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initCamera = async () => {
    setLoading(true);
    setError(null);
    
    // Check if mediaDevices is available (requires HTTPS or localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(t.httpsRequired);
      setLoading(false);
      return;
    }
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Check tracks
      const videoTracks = mediaStream.getVideoTracks();
      const audioTracks = mediaStream.getAudioTracks();
      
      setCameraActive(videoTracks.length > 0 && videoTracks[0].readyState === 'live');
      setMicActive(audioTracks.length > 0 && audioTracks[0].readyState === 'live');
      
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError(t.permissionDenied);
      } else if (err.name === 'NotFoundError') {
        setError(t.notFound);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReadyClick = () => {
    if (stream && cameraActive) {
      onReady(stream);
    }
  };

  return (
    <div className="camera-test-screen">
      <div className="camera-test-card">
        <h2 className="camera-test-title">{t.title}</h2>
        <p className="camera-test-subtitle">{t.subtitle}</p>
        
        <div className="camera-preview">
          {loading ? (
            <div className="camera-preview-placeholder">
              <div className="loading-spinner" />
              <span>{t.checkingPermissions}</span>
            </div>
          ) : error ? (
            <div className="camera-preview-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <span style={{ color: '#ef4444', textAlign: 'center', padding: '0 20px' }}>{error}</span>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ transform: 'scaleX(-1)' }}
            />
          )}
        </div>
        
        <div className="camera-status">
          <div className="camera-status-item">
            <div className={`camera-status-dot ${cameraActive ? 'active' : error ? 'error' : ''}`} />
            <span>{t.camera}: {cameraActive ? t.active : t.inactive}</span>
          </div>
          <div className="camera-status-item">
            <div className={`camera-status-dot ${micActive ? 'active' : error ? 'error' : ''}`} />
            <span>{t.microphone}: {micActive ? t.active : t.inactive}</span>
          </div>
        </div>
        
        <div className="camera-test-buttons">
          <button className="camera-test-back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t.back}
          </button>
          <button 
            className="camera-test-ready-btn" 
            onClick={handleReadyClick}
            disabled={!cameraActive || loading}
          >
            {t.ready}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraTestScreen;


