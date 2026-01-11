import { useState, useRef, useEffect } from 'react';

const translations = {
  tr: {
    titleWithMic: 'Kamera ve Mikrofon Testi',
    titleCameraOnly: 'Kamera Testi',
    subtitleWithMic: 'Lütfen kamera ve mikrofonunuzun düzgün çalıştığından emin olun.',
    subtitleCameraOnly: 'Lütfen kameranızın düzgün çalıştığından emin olun.',
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
    httpsRequired: 'Kamera erişimi için güvenli bağlantı (HTTPS) gereklidir. Lütfen sistem yöneticinize başvurun veya localhost üzerinden deneyin.',
    speakToTest: 'Mikrofonu test etmek için konuşun'
  },
  en: {
    titleWithMic: 'Camera and Microphone Test',
    titleCameraOnly: 'Camera Test',
    subtitleWithMic: 'Please make sure your camera and microphone are working properly.',
    subtitleCameraOnly: 'Please make sure your camera is working properly.',
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
    httpsRequired: 'Secure connection (HTTPS) is required for camera access. Please contact your system administrator or try from localhost.',
    speakToTest: 'Speak to test the microphone'
  }
};

const CameraTestScreen = ({ language = 'tr', onReady, onBack, voiceEnabled = true }) => {
  const t = translations[language] || translations.tr;
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    initCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Audio volume level analyzer (only if voice enabled)
  useEffect(() => {
    if (!stream || !micActive || !voiceEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const normalizedVolume = Math.min(100, (average / 128) * 100);
          setVolumeLevel(normalizedVolume);
        }
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.error('Audio analyzer error:', err);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stream, micActive]);

  // Separate effect to attach stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.log('Video play error:', e));
    }
  }, [stream]);

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
        audio: voiceEnabled // Only request audio if voice is enabled
      });
      
      setStream(mediaStream);
      
      // Check tracks
      const videoTracks = mediaStream.getVideoTracks();
      const audioTracks = mediaStream.getAudioTracks();
      
      setCameraActive(videoTracks.length > 0 && videoTracks[0].readyState === 'live');
      // Only check mic if voice is enabled
      if (voiceEnabled) {
        setMicActive(audioTracks.length > 0 && audioTracks[0].readyState === 'live');
      } else {
        setMicActive(false);
      }
      
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
        <h2 className="camera-test-title">{voiceEnabled ? t.titleWithMic : t.titleCameraOnly}</h2>
        <p className="camera-test-subtitle">{voiceEnabled ? t.subtitleWithMic : t.subtitleCameraOnly}</p>
        
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
          {/* Only show microphone status if voice is enabled */}
          {voiceEnabled && (
            <div className="camera-status-item">
              <div className={`camera-status-dot ${micActive ? 'active' : error ? 'error' : ''}`} />
              <span>{t.microphone}: {micActive ? t.active : t.inactive}</span>
            </div>
          )}
        </div>
        
        {/* Volume Level Indicator - only if voice enabled */}
        {voiceEnabled && micActive && (
          <div className="volume-meter-container">
            <span className="volume-meter-label">{t.speakToTest}</span>
            <div className="volume-meter">
              <div 
                className="volume-meter-fill" 
                style={{ width: `${volumeLevel}%` }}
              />
            </div>
          </div>
        )}
        
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


