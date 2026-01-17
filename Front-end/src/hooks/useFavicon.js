/**
 * useFavicon Hook
 * Dinamik olarak favicon'u günceller
 * Şirket logosu varsa onu kullanır, yoksa varsayılan favicon kullanılır
 */
import { useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const DEFAULT_FAVICON = '/vite.svg';
const DEFAULT_TITLE = 'HRSmart - İK Portalı';

const useFavicon = (logoUrl, companyName) => {
  // Favicon güncelleme
  useEffect(() => {
    // Favicon elementini bul veya oluştur
    let link = document.querySelector("link[rel~='icon']");
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    if (logoUrl) {
      // Şirket logosu varsa onu kullan
      const fullUrl = logoUrl.startsWith('http') ? logoUrl : `${API_BASE_URL}${logoUrl}`;
      link.href = fullUrl;
      link.type = 'image/png'; // Logo genelde PNG/JPG olacak
    } else {
      // Varsayılan favicon
      link.href = DEFAULT_FAVICON;
      link.type = 'image/svg+xml';
    }
  }, [logoUrl]);

  // Sayfa başlığı güncelleme
  useEffect(() => {
    if (companyName) {
      document.title = `${companyName} - İK Portalı`;
    } else {
      document.title = DEFAULT_TITLE;
    }
  }, [companyName]);
};

export default useFavicon;

