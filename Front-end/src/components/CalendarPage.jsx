/**
 * CalendarPage - HR Calendar View
 * Shows scheduled interviews, likert tests, and AI interviews
 * Week and Day views with event type filtering
 */
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Video,
  MapPin,
  Bot,
  ClipboardList,
  Clock,
  User,
  Briefcase,
  ExternalLink,
  X,
  Filter,
} from 'lucide-react';
import { GET_CALENDAR_EVENTS } from '../graphql/calendar';

// ============================================
// Helper Functions
// ============================================

const getWeekDates = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(d.setDate(diff));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(dd);
  }
  return dates;
};

const formatDateISO = (d) => {
  return d.toISOString().split('T')[0];
};

const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const isToday = (d) => isSameDay(d, new Date());

const DAY_NAMES_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAY_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const FULL_DAY_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EVENT_TYPE_CONFIG = {
  second_interview: {
    icon: Video,
    labelTR: 'Yüzyüze/Online Mülakat',
    labelEN: 'Face-to-Face/Online Interview',
    defaultColor: '#8B5CF6',
  },
  ai_interview: {
    icon: Bot,
    labelTR: 'AI Mülakat',
    labelEN: 'AI Interview',
    defaultColor: '#3B82F6',
  },
  likert_test: {
    icon: ClipboardList,
    labelTR: 'Likert Test',
    labelEN: 'Likert Test',
    defaultColor: '#10B981',
  },
};

const STATUS_LABELS = {
  invited: { tr: 'Davet Edildi', en: 'Invited', color: '#F59E0B' },
  pending: { tr: 'Bekliyor', en: 'Pending', color: '#6B7280' },
  in_progress: { tr: 'Devam Ediyor', en: 'In Progress', color: '#3B82F6' },
  completed: { tr: 'Tamamlandı', en: 'Completed', color: '#10B981' },
  expired: { tr: 'Süresi Doldu', en: 'Expired', color: '#EF4444' },
  cancelled: { tr: 'İptal', en: 'Cancelled', color: '#9CA3AF' },
};

// ============================================
// Event Detail Modal
// ============================================

const EventDetailModal = ({ event, onClose, isEnglish }) => {
  if (!event) return null;

  const config = EVENT_TYPE_CONFIG[event.eventType] || {};
  const IconComp = config.icon || CalendarIcon;
  const statusInfo = STATUS_LABELS[event.status] || STATUS_LABELS.pending;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'white', borderRadius: 16, width: '90%', maxWidth: 480,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: `linear-gradient(135deg, ${event.color || config.defaultColor} 0%, ${event.color || config.defaultColor}cc 100%)`,
          borderRadius: '16px 16px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
            <IconComp size={22} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {isEnglish ? config.labelEN : config.labelTR}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {event.scheduledDate} {event.scheduledTime ? `• ${event.scheduledTime}` : ''}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            padding: 8, background: 'rgba(255,255,255,0.2)', border: 'none',
            cursor: 'pointer', borderRadius: 8,
          }}>
            <X size={18} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Status */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: `${statusInfo.color}15`, color: statusInfo.color,
            fontSize: 13, fontWeight: 600, marginBottom: 20,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusInfo.color }} />
            {isEnglish ? statusInfo.en : statusInfo.tr}
          </div>

          {/* Candidate */}
          {event.candidateName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 16, background: '#F9FAFB', borderRadius: 12, marginBottom: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: event.candidatePhoto ? `url(${event.candidatePhoto}) center/cover` : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 18, fontWeight: 600,
              }}>
                {!event.candidatePhoto && (event.candidateName?.charAt(0)?.toUpperCase() || '?')}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1F2937' }}>{event.candidateName}</div>
                {event.candidateEmail && <div style={{ fontSize: 13, color: '#6B7280' }}>{event.candidateEmail}</div>}
              </div>
            </div>
          )}

          {/* Details */}
          <div style={{ display: 'grid', gap: 12 }}>
            {event.jobTitle && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Briefcase size={16} color="#6B7280" />
                <span style={{ fontSize: 14, color: '#374151' }}>{event.jobTitle}</span>
              </div>
            )}
            {event.departmentName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={16} color="#6B7280" />
                <span style={{ fontSize: 14, color: '#374151' }}>{event.departmentName}</span>
              </div>
            )}
            {event.scheduledTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={16} color="#6B7280" />
                <span style={{ fontSize: 14, color: '#374151' }}>{event.scheduledTime}</span>
              </div>
            )}
            {event.interviewMode === 'online' && event.platform && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Video size={16} color="#8B5CF6" />
                <span style={{ fontSize: 14, color: '#374151', textTransform: 'capitalize' }}>
                  {event.platform.replace('_', ' ')}
                </span>
              </div>
            )}
            {event.meetingLink && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ExternalLink size={16} color="#3B82F6" />
                <a
                  href={event.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: '#3B82F6', wordBreak: 'break-all' }}
                >
                  {event.meetingLink}
                </a>
              </div>
            )}
            {event.locationAddress && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14, color: '#374151' }}>{event.locationAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 24px', background: '#374151', color: 'white',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            {isEnglish ? 'Close' : 'Kapat'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Event Card (for calendar cells)
// ============================================

const EventCard = ({ event, onClick, compact = false }) => {
  const config = EVENT_TYPE_CONFIG[event.eventType] || {};
  const color = event.color || config.defaultColor || '#6B7280';

  if (compact) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onClick(event); }}
        style={{
          padding: '3px 8px', borderRadius: 6,
          background: `${color}15`, borderLeft: `3px solid ${color}`,
          cursor: 'pointer', fontSize: 11, color: color, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 2, transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${color}25`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `${color}15`; }}
        title={`${event.candidateName || ''} - ${event.scheduledTime || ''}`}
      >
        {event.scheduledTime && <span style={{ fontWeight: 600 }}>{event.scheduledTime} </span>}
        {event.candidateName || event.title}
      </div>
    );
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      style={{
        padding: '8px 10px', borderRadius: 8,
        background: `${color}12`, borderLeft: `4px solid ${color}`,
        cursor: 'pointer', marginBottom: 6, transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{event.scheduledTime || '--:--'}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {event.candidateName || 'Aday'}
      </div>
      <div style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {event.jobTitle || ''}
      </div>
    </div>
  );
};

// ============================================
// Main CalendarPage Component
// ============================================

const CalendarPage = () => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';

  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeFilters, setActiveFilters] = useState(['second_interview', 'ai_interview', 'likert_test']);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const dayNames = isEnglish ? DAY_NAMES_EN : DAY_NAMES_TR;
  const fullDayNames = isEnglish ? FULL_DAY_EN : FULL_DAY_TR;

  // Date range for query
  const queryRange = useMemo(() => {
    if (viewMode === 'week') {
      return {
        startDate: formatDateISO(weekDates[0]),
        endDate: formatDateISO(weekDates[6]),
      };
    }
    return {
      startDate: formatDateISO(currentDate),
      endDate: formatDateISO(currentDate),
    };
  }, [viewMode, weekDates, currentDate]);

  const { data, loading } = useQuery(GET_CALENDAR_EVENTS, {
    variables: {
      startDate: queryRange.startDate,
      endDate: queryRange.endDate,
      eventTypes: activeFilters.length > 0 ? activeFilters : null,
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  });

  const events = data?.calendarEvents?.events || [];
  const totalCount = data?.calendarEvents?.totalCount || 0;

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!map[ev.scheduledDate]) map[ev.scheduledDate] = [];
      map[ev.scheduledDate].push(ev);
    });
    return map;
  }, [events]);

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1));
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === 'week' ? 7 : 1));
    setCurrentDate(d);
  };

  const toggleFilter = (type) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Header date range text
  const headerText = useMemo(() => {
    if (viewMode === 'week') {
      const locale = isEnglish ? 'en-US' : 'tr-TR';
      const start = weekDates[0].toLocaleDateString(locale, { day: 'numeric', month: 'short' });
      const end = weekDates[6].toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
      return `${start} — ${end}`;
    }
    return currentDate.toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }, [viewMode, weekDates, currentDate, isEnglish]);

  // Hours for day view
  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 - 21:00

  // Get events for a specific hour in day view
  const getEventsForHour = (hour) => {
    const dateStr = formatDateISO(currentDate);
    const dayEvents = eventsByDate[dateStr] || [];
    return dayEvents.filter((ev) => {
      if (!ev.scheduledTime) return hour === 7; // events without time go to 07:00
      const eventHour = parseInt(ev.scheduledTime.split(':')[0], 10);
      return eventHour === hour;
    });
  };

  return (
    <div style={{ padding: 0 }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 16,
      }}>
        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={goPrev} style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
            background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronLeft size={18} color="#374151" />
          </button>
          <button onClick={goToday} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
            background: 'white', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer',
          }}>
            {isEnglish ? 'Today' : 'Bugün'}
          </button>
          <button onClick={goNext} style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
            background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronRight size={18} color="#374151" />
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
            {headerText}
          </h2>
          {loading && (
            <div style={{ width: 20, height: 20, border: '2px solid #E5E7EB', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          )}
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Event Count Badge */}
          <div style={{
            padding: '6px 14px', borderRadius: 20, background: '#F3F4F6',
            fontSize: 13, fontWeight: 500, color: '#6B7280',
          }}>
            {totalCount} {isEnglish ? 'events' : 'etkinlik'}
          </div>

          {/* View Toggle */}
          <div style={{
            display: 'flex', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden',
          }}>
            <button onClick={() => setViewMode('day')} style={{
              padding: '8px 16px', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              background: viewMode === 'day' ? '#1F2937' : 'white',
              color: viewMode === 'day' ? 'white' : '#6B7280',
            }}>
              {isEnglish ? 'Day' : 'Gün'}
            </button>
            <button onClick={() => setViewMode('week')} style={{
              padding: '8px 16px', border: 'none', borderLeft: '1px solid #E5E7EB',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              background: viewMode === 'week' ? '#1F2937' : 'white',
              color: viewMode === 'week' ? 'white' : '#6B7280',
            }}>
              {isEnglish ? 'Week' : 'Hafta'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <Filter size={16} color="#9CA3AF" />
        {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => {
          const active = activeFilters.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20,
                border: `1.5px solid ${active ? cfg.defaultColor : '#E5E7EB'}`,
                background: active ? `${cfg.defaultColor}10` : 'white',
                color: active ? cfg.defaultColor : '#9CA3AF',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: active ? cfg.defaultColor : '#D1D5DB',
              }} />
              {isEnglish ? cfg.labelEN : cfg.labelTR}
            </button>
          );
        })}
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div style={{
          background: 'white', borderRadius: 12, border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}>
          {/* Week Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #E5E7EB',
          }}>
            {weekDates.map((date, i) => {
              const today = isToday(date);
              return (
                <div key={i} style={{
                  padding: '14px 8px', textAlign: 'center',
                  borderRight: i < 6 ? '1px solid #F3F4F6' : 'none',
                  background: today ? '#F5F3FF' : 'transparent',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: today ? '#7C3AED' : '#6B7280', marginBottom: 4 }}>
                    {dayNames[i]}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: '50%',
                    background: today ? '#7C3AED' : 'transparent',
                    color: today ? 'white' : '#1F2937',
                    fontSize: 16, fontWeight: 700,
                  }}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week Body */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            minHeight: 400,
          }}>
            {weekDates.map((date, i) => {
              const dateStr = formatDateISO(date);
              const dayEvents = eventsByDate[dateStr] || [];
              const today = isToday(date);

              return (
                <div key={i} style={{
                  padding: 8, borderRight: i < 6 ? '1px solid #F3F4F6' : 'none',
                  background: today ? '#FAFAFE' : 'transparent',
                  minHeight: 120,
                }}>
                  {dayEvents.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#D1D5DB', fontSize: 12 }}>
                      —
                    </div>
                  )}
                  {dayEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      onClick={setSelectedEvent}
                      compact={dayEvents.length > 3}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div style={{
          background: 'white', borderRadius: 12, border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}>
          {/* Day Header */}
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center', gap: 12,
            background: isToday(currentDate) ? '#F5F3FF' : 'transparent',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: isToday(currentDate) ? '#7C3AED' : '#F3F4F6',
              color: isToday(currentDate) ? 'white' : '#1F2937',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700,
            }}>
              {currentDate.getDate()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>
                {fullDayNames[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>
                {currentDate.toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Time Slots */}
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {hours.map((hour) => {
              const hourEvents = getEventsForHour(hour);
              return (
                <div key={hour} style={{
                  display: 'grid', gridTemplateColumns: '70px 1fr',
                  borderBottom: '1px solid #F3F4F6', minHeight: 60,
                }}>
                  <div style={{
                    padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#9CA3AF',
                    borderRight: '1px solid #F3F4F6', textAlign: 'right',
                  }}>
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  <div style={{ padding: '6px 12px' }}>
                    {hourEvents.map((ev) => (
                      <EventCard key={ev.id} event={ev} onClick={setSelectedEvent} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px', color: '#9CA3AF',
        }}>
          <CalendarIcon size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            {isEnglish ? 'No events scheduled' : 'Planlanmış etkinlik yok'}
          </div>
          <div style={{ fontSize: 14 }}>
            {isEnglish
              ? 'Scheduled interviews and tests will appear here'
              : 'Planlanan mülakatlar ve testler burada görünecek'}
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isEnglish={isEnglish}
        />
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CalendarPage;
