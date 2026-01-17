/**
 * Test Header Page
 * Yeni header tasarımını test etmek için
 */
import React, { useState } from 'react';
import { Search, Calendar, ChevronRight, Mic, Bell, Settings, Menu } from 'lucide-react';

const TestHeaderPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data
  const currentUser = {
    name: 'Ahmet Yılmaz',
    role: 'İK Müdürü',
    avatar: null,
    companyName: 'TechCorp',
    companyLogo: null
  };

  const today = new Date();
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #E8E4E1 0%, #D4CFC9 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24
      }}>
        {/* Left Section - Logo & Company */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Menu Button */}
          <button style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Menu size={20} color="#1F2937" />
          </button>

          {/* Logo Circle */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 18
          }}>
            İK
          </div>

          {/* Company Info */}
          <div>
            <div style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: '#1F2937',
              letterSpacing: '-0.02em'
            }}>
              {currentUser.companyName || 'HRSmart'}
            </div>
            <div style={{ 
              fontSize: 13, 
              color: '#6B7280',
              fontWeight: 500
            }}>
              İK Portalı
            </div>
          </div>
        </div>

        {/* Center Section - Date & Quick Action */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'white',
          padding: '8px 8px 8px 20px',
          borderRadius: 50,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          {/* Date Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: '2px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', lineHeight: 1 }}>
                {today.getDate()}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                {dayNames[today.getDay()]},
              </div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>
                {monthNames[today.getMonth()]}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 32, background: '#E5E7EB' }} />

          {/* Quick Action Button */}
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #E07850 0%, #D4633C 100%)',
            border: 'none',
            borderRadius: 50,
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 12px rgba(224, 120, 80, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(224, 120, 80, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(224, 120, 80, 0.3)';
          }}
          >
            Görevlerim
            <ChevronRight size={18} />
          </button>

          {/* Calendar Button */}
          <button style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid #E5E7EB',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <Calendar size={20} color="#6B7280" />
            {/* Notification dot */}
            <div style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#EF4444',
              border: '2px solid white'
            }} />
          </button>
        </div>

        {/* Right Section - User & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Add Button */}
          <button style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px dashed #D1D5DB',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 20,
            color: '#9CA3AF'
          }}>
            +
          </button>

          {/* User Profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'white',
            padding: '8px 16px 8px 8px',
            borderRadius: 50,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: 14
            }}>
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                {currentUser.role}
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'white',
            padding: '12px 20px',
            borderRadius: 50,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            minWidth: 200
          }}>
            <Search size={18} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Aramaya başla..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 14,
                color: '#1F2937',
                background: 'transparent',
                width: '100%'
              }}
            />
          </div>
        </div>
      </header>

      {/* Help Widget - Fixed */}
      <div style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'white',
        padding: '20px 24px',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>
        <div>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: '#1F2937',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            Yardım ister misin?
            <span style={{ fontSize: 28 }}>👋</span>
          </div>
          <div style={{ 
            fontSize: 18, 
            color: '#9CA3AF',
            fontStyle: 'italic'
          }}>
            Bana her şeyi sorabilirsin!
          </div>
        </div>
        <button style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <Mic size={24} color="#6B7280" />
        </button>
      </div>

      {/* Main Content Area - Demo */}
      <main style={{ padding: '32px' }}>
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: 40,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          minHeight: 400
        }}>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: '#1F2937',
            marginBottom: 16
          }}>
            Test Header Sayfası
          </h1>
          <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.6 }}>
            Bu sayfa yeni header tasarımını test etmek için oluşturuldu.
            <br /><br />
            Beğenirseniz ana Dashboard'a uygulayabiliriz.
          </p>

          {/* Color Palette Demo */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>
              Kullanılan Renkler:
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { color: '#E8E4E1', name: 'Arka Plan' },
                { color: '#1F2937', name: 'Koyu Metin' },
                { color: '#E07850', name: 'Aksan (Turuncu)' },
                { color: '#667eea', name: 'Profil Mor' },
                { color: '#6B7280', name: 'İkincil Metin' },
              ].map((c, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    background: c.color,
                    marginBottom: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} />
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{c.color}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestHeaderPage;

