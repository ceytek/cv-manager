/**
 * Period Calculator Utility
 * Calculates billing periods from subscription start_date
 */

/**
 * Generate billing periods based on subscription start date
 * @param {string} startDate - ISO date string of subscription start
 * @param {string} billingCycle - 'monthly' or 'yearly'
 * @returns {Array} Array of period objects {label, start, end}
 */
export const generateBillingPeriods = (startDate, billingCycle = 'monthly') => {
  if (!startDate) return [];

  const periods = [];
  const now = new Date();

  // Helper: format date as local YYYY-MM-DD (no UTC shift)
  const toLocalYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Normalize to calendar month boundaries
  const firstMonthStart = new Date(startDate);
  firstMonthStart.setDate(1); // first day of month
  firstMonthStart.setHours(0, 0, 0, 0);

  let currentPeriodStart = new Date(firstMonthStart);

  while (currentPeriodStart <= now) {
    let periodEnd;

    if (billingCycle === 'yearly') {
      // Yearly: Jan 1 to Dec 31
      periodEnd = new Date(currentPeriodStart.getFullYear(), 11, 31);
    } else {
      // Monthly: first day to last day of month
      periodEnd = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, 0);
    }

    const label = currentPeriodStart.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long'
    });

    periods.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      start: toLocalYMD(currentPeriodStart),
      end: toLocalYMD(periodEnd),
    });

    // Move to next period start
    currentPeriodStart = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, 1);
  }

  // Most recent first
  return periods.reverse();
};

/**
 * Get current active period
 * @param {Array} periods - Array of period objects
 * @returns {Object} Current period or null
 */
export const getCurrentPeriod = (periods) => {
  if (!periods || periods.length === 0) return null;
  
  const now = new Date();
  const toLocalYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const today = toLocalYMD(now);
  
  return periods.find(period => {
    return today >= period.start && today <= period.end;
  }) || periods[0]; // Fallback to most recent
};

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (isoDate) => {
  if (!isoDate) return '';
  
  const date = new Date(isoDate);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date short (without time)
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date
 */
export const formatDateShort = (isoDate) => {
  if (!isoDate) return '';
  
  const date = new Date(isoDate);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Generate last N calendar months if subscription start is missing
 * @param {number} months
 */
export const generateLastMonths = (months = 12) => {
  const periods = [];
  const now = new Date();
  const toLocalYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  for (let i = 0; i < months; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const label = start.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
    periods.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      start: toLocalYMD(start),
      end: toLocalYMD(end),
    });
  }
  return periods; // already from most recent to older
};
