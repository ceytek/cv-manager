/**
 * Usage Period Selector Component
 * Dropdown for selecting billing periods based on subscription
 */
import React from 'react';
import { Calendar } from 'lucide-react';

const UsagePeriodSelector = ({ periods, selectedPeriod, onPeriodChange, isUnlimited }) => {
  if (isUnlimited) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: '#F3F4F6',
        borderRadius: 8,
        fontSize: 14,
        color: '#6B7280'
      }}>
        <Calendar size={16} />
        <span>Tüm Geçmiş</span>
      </div>
    );
  }

  if (!periods || periods.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#6B7280',
        fontSize: 14
      }}>
        <Calendar size={16} />
        <span style={{ fontWeight: 500 }}>Dönem:</span>
      </div>
      
      <select
        value={selectedPeriod ? `${selectedPeriod.start}_${selectedPeriod.end}` : ''}
        onChange={(e) => {
          const [start, end] = e.target.value.split('_');
          const period = periods.find(p => p.start === start && p.end === end);
          if (period) {
            onPeriodChange(period);
          }
        }}
        style={{
          marginTop: 8,
          width: '100%',
          minWidth: 250,
          padding: '10px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: 8,
          fontSize: 14,
          color: '#1F2937',
          background: 'white',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3B82F6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#D1D5DB';
          e.target.style.boxShadow = 'none';
        }}
      >
        {periods.map((period, index) => (
          <option 
            key={index} 
            value={`${period.start}_${period.end}`}
          >
            {period.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default UsagePeriodSelector;
