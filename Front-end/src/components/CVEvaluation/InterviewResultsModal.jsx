/**
 * Interview Results Modal
 * Displays interview results with video player and AI analysis for HR view
 */
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  X, CheckCircle2, Video, Clock, MessageSquare, 
  ChevronLeft, ChevronRight, Search, Sparkles, Play,
  AlertCircle, Mic, MicOff
} from 'lucide-react';
import { GET_INTERVIEW_SESSION_BY_APPLICATION, ANALYZE_INTERVIEW_WITH_AI } from '../../graphql/interview';
import { API_BASE_URL } from '../../config/api';

const InterviewResultsModal = ({ isOpen, onClose, applicationId, candidateName, jobTitle }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  
  const { data, loading, error, refetch } = useQuery(GET_INTERVIEW_SESSION_BY_APPLICATION, {
    variables: { applicationId },
    skip: !applicationId || !isOpen,
    fetchPolicy: 'network-only',
  });

  const [analyzeWithAI, { loading: analyzing }] = useMutation(ANALYZE_INTERVIEW_WITH_AI, {
    onCompleted: () => {
      refetch();
    },
  });

  if (!isOpen) return null;

  const session = data?.interviewSessionByApplication;
  const template = session?.template;
  const answers = session?.answers || [];
  const sortedAnswers = [...answers].sort((a, b) => a.questionOrder - b.questionOrder);
  const currentAnswer = sortedAnswers[currentQuestionIndex];
  
  // AI Analysis data
  const aiAnalysis = session?.aiAnalysis;
  const aiOverallScore = session?.aiOverallScore;
  const aiAnalysisEnabled = template?.aiAnalysisEnabled;
  const browserSttSupported = session?.browserSttSupported;

  // Calculate duration
  const duration = session?.startedAt && session?.completedAt
    ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 60000)
    : null;

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString(isEnglish ? 'en-US' : 'tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'expired': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return isEnglish ? 'Completed' : 'Tamamlandı';
      case 'in_progress': return isEnglish ? 'In Progress' : 'Devam Ediyor';
      case 'expired': return isEnglish ? 'Expired' : 'Süresi Doldu';
      case 'pending': return isEnglish ? 'Pending' : 'Beklemede';
      default: return status;
    }
  };

  const getScoreEmoji = (score) => {
    if (score >= 4) return '😊';
    if (score >= 3) return '🙂';
    if (score >= 2) return '😐';
    return '😟';
  };

  const getScoreColor = (score) => {
    if (score >= 4) return '#10B981';
    if (score >= 3) return '#84CC16';
    if (score >= 2) return '#F59E0B';
    return '#EF4444';
  };

  // Filter transcript by search term
  const highlightText = (text, term) => {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} style={{ background: '#FEF3C7' }}>{part}</mark> : part
    );
  };

  const handleAnalyze = async () => {
    if (!session?.id) return;
    try {
      await analyzeWithAI({ variables: { sessionId: session.id } });
      setShowAIAnalysis(true);
    } catch (err) {
      console.error('AI Analysis error:', err);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < sortedAnswers.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '95%',
        maxWidth: 1200,
        maxHeight: '95vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Video size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t('interviewResults.title')}</h2>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
                {candidateName} - {jobTitle}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Browser STT Support Indicator */}
            {browserSttSupported !== null && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.2)',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
              }}>
                {browserSttSupported ? <Mic size={14} /> : <MicOff size={14} />}
                {browserSttSupported 
                  ? (isEnglish ? 'Voice supported' : 'Sesli yanıt desteklendi')
                  : (isEnglish ? 'Voice not supported' : 'Sesli yanıt desteklenmedi')
                }
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={20} color="white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{
                width: 40,
                height: 40,
                border: '3px solid #E5E7EB',
                borderTopColor: '#3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ color: '#6B7280' }}>{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#EF4444' }}>{t('common.error')}: {error.message}</p>
            </div>
          ) : !session ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#6B7280' }}>{t('interviewResults.notCompleted')}</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                marginBottom: 24,
              }}>
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <CheckCircle2 size={20} style={{ color: getStatusColor(session.status), marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'Status' : 'Durum'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: getStatusColor(session.status) }}>
                    {getStatusLabel(session.status)}
                  </div>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <MessageSquare size={20} style={{ color: '#3B82F6', marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'Questions' : 'Sorular'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>{sortedAnswers.length}</div>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <Clock size={20} style={{ color: '#F59E0B', marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'Duration' : 'Süre'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>
                    {duration ? `${duration} ${isEnglish ? 'min' : 'dk'}` : '-'}
                  </div>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <Sparkles size={20} style={{ color: aiOverallScore ? getScoreColor(aiOverallScore) : '#9CA3AF', marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'AI Score' : 'AI Puanı'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: aiOverallScore ? getScoreColor(aiOverallScore) : '#9CA3AF' }}>
                    {aiOverallScore ? `${aiOverallScore.toFixed(1)} ${getScoreEmoji(aiOverallScore)}` : '-'}
                  </div>
                </div>
              </div>

              {/* Question Navigation & Video Section */}
              {sortedAnswers.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  {/* Question Header with Navigation */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}>
                    <div style={{ color: '#8B5CF6', fontSize: 14, fontWeight: 600 }}>
                      {isEnglish ? 'Question' : 'Soru'}: {currentQuestionIndex + 1}/{sortedAnswers.length}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={goToPrevious}
                        disabled={currentQuestionIndex === 0}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '8px 16px',
                          background: currentQuestionIndex === 0 ? '#F3F4F6' : 'white',
                          border: '1px solid #8B5CF6',
                          borderRadius: 8,
                          color: currentQuestionIndex === 0 ? '#9CA3AF' : '#8B5CF6',
                          cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        <ChevronLeft size={16} />
                        {isEnglish ? 'Previous' : 'Önceki'}
                      </button>
                      <button
                        onClick={goToNext}
                        disabled={currentQuestionIndex === sortedAnswers.length - 1}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '8px 16px',
                          background: currentQuestionIndex === sortedAnswers.length - 1 ? '#F3F4F6' : '#8B5CF6',
                          border: 'none',
                          borderRadius: 8,
                          color: currentQuestionIndex === sortedAnswers.length - 1 ? '#9CA3AF' : 'white',
                          cursor: currentQuestionIndex === sortedAnswers.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        {isEnglish ? 'Next' : 'Sonraki'}
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <h3 style={{
                    margin: '0 0 16px',
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#1F2937',
                    lineHeight: 1.5,
                  }}>
                    {currentAnswer?.questionText}
                  </h3>

                  {/* Video Player */}
                  {currentAnswer?.videoUrl ? (
                    <div style={{
                      background: '#111827',
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginBottom: 16,
                      aspectRatio: '16/9',
                      maxHeight: 400,
                    }}>
                      <video
                        key={currentAnswer.videoUrl}
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        src={`${API_BASE_URL}${currentAnswer.videoUrl}`}
                      >
                        {isEnglish ? 'Your browser does not support video playback.' : 'Tarayıcınız video oynatmayı desteklemiyor.'}
                      </video>
                    </div>
                  ) : (
                    <div style={{
                      background: '#F3F4F6',
                      borderRadius: 12,
                      padding: 48,
                      textAlign: 'center',
                      marginBottom: 16,
                    }}>
                      <Play size={48} color="#9CA3AF" style={{ marginBottom: 12 }} />
                      <p style={{ color: '#6B7280', margin: 0 }}>
                        {isEnglish ? 'No video recording available' : 'Video kaydı mevcut değil'}
                      </p>
                    </div>
                  )}

                  {/* Transcript */}
                  <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                        {isEnglish ? 'Transcript' : 'Transkript'}
                      </h4>
                      <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder={isEnglish ? 'Search in transcript...' : 'Bu cevapta ara'}
                          style={{
                            padding: '8px 12px 8px 32px',
                            border: '1px solid #E5E7EB',
                            borderRadius: 8,
                            fontSize: 13,
                            width: 200,
                          }}
                        />
                      </div>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: 14,
                      color: '#374151',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      textAlign: 'justify',
                    }}>
                      {currentAnswer?.answerText 
                        ? highlightText(currentAnswer.answerText, searchTerm)
                        : <em style={{ color: '#9CA3AF' }}>{t('interviewResults.noAnswer')}</em>
                      }
                    </p>
                    {currentAnswer?.durationSeconds && (
                      <p style={{ margin: '12px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                        ({Math.floor(currentAnswer.durationSeconds / 60)}:{(currentAnswer.durationSeconds % 60).toString().padStart(2, '0')} {isEnglish ? 'video recording ends after waiting time' : 'bekleme süresinin ardından video kaydı sona erer'})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AI Analysis Section */}
              {aiAnalysisEnabled && (
                <div style={{
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid #BBF7D0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={20} />
                      {isEnglish ? 'AI Interview Analysis' : 'Bu Mülakatın Yapay Zeka Analizi'}
                    </h3>
                    {!aiAnalysis && (
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing || session.status !== 'completed'}
                        style={{
                          padding: '10px 20px',
                          background: analyzing ? '#9CA3AF' : '#22C55E',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: analyzing || session.status !== 'completed' ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {analyzing ? (
                          <>
                            <div style={{
                              width: 16,
                              height: 16,
                              border: '2px solid white',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                            }} />
                            {isEnglish ? 'Analyzing...' : 'Analiz ediliyor...'}
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            {isEnglish ? 'Analyze with AI' : 'AI Analizini Gör'}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {aiAnalysis ? (
                    <>
                      {/* Overall Score */}
                      <div style={{
                        background: 'white',
                        borderRadius: 12,
                        padding: 24,
                        textAlign: 'center',
                        marginBottom: 24,
                      }}>
                        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Sparkles size={14} />
                          {isEnglish ? 'AI Score' : 'Yapay Zeka Skoru'}
                          <span style={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            border: '1px solid #9CA3AF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            color: '#9CA3AF',
                            cursor: 'help',
                          }} title={isEnglish ? 'Score out of 5' : '5 üzerinden puan'}>ⓘ</span>
                        </div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#F9FAFB',
                          padding: '12px 24px',
                          borderRadius: 30,
                        }}>
                          <span style={{ fontSize: 28, fontWeight: 700, color: getScoreColor(aiOverallScore) }}>
                            {aiOverallScore?.toFixed(1)}
                          </span>
                          <span style={{ fontSize: 24 }}>{getScoreEmoji(aiOverallScore)}</span>
                        </div>
                        {aiAnalysis.summary && (
                          <p style={{ margin: '16px 0 0', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                            {aiAnalysis.summary}
                          </p>
                        )}
                      </div>

                      {/* Category Scores */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {aiAnalysis.categories?.map((cat, index) => (
                          <div key={index} style={{
                            background: 'white',
                            borderRadius: 12,
                            padding: 20,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
                                {isEnglish ? cat.categoryEn : cat.category}
                              </h4>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#F9FAFB',
                                padding: '4px 12px',
                                borderRadius: 20,
                              }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(cat.score) }}>
                                  {cat.score}
                                </span>
                                <span>{getScoreEmoji(cat.score)}</span>
                              </div>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 20, color: '#4B5563', fontSize: 14, lineHeight: 1.8 }}>
                              {cat.feedback?.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : session.status !== 'completed' ? (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                      <AlertCircle size={32} color="#F59E0B" style={{ marginBottom: 12 }} />
                      <p style={{ color: '#92400E', margin: 0 }}>
                        {isEnglish 
                          ? 'AI analysis will be available after the interview is completed.'
                          : 'AI analizi mülakat tamamlandıktan sonra kullanılabilir olacaktır.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                      <Sparkles size={32} color="#22C55E" style={{ marginBottom: 12 }} />
                      <p style={{ color: '#166534', margin: 0 }}>
                        {isEnglish 
                          ? 'Click "Analyze with AI" to get a detailed evaluation of the interview.'
                          : '"AI Analizini Gör" butonuna tıklayarak detaylı değerlendirme alabilirsiniz.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('common.close')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InterviewResultsModal;
