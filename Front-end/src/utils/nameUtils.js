/**
 * Utility functions for handling names
 */

// Common titles to remove before extracting initials
const TITLES_TO_REMOVE = [
  // Turkish academic/professional titles
  'Dr.', 'DR.', 'dr.',
  'Prof.', 'PROF.', 'prof.',
  'Doç.', 'DOÇ.', 'doç.',
  'Yrd.', 'YRD.', 'yrd.',
  'Öğr.', 'ÖĞR.', 'öğr.',
  'Gör.', 'GÖR.', 'gör.',
  'Av.', 'AV.', 'av.',
  'Arş.', 'ARŞ.', 'arş.',
  'Uzm.', 'UZM.', 'uzm.',
  // English academic titles
  'PhD', 'PHD', 'phd', 'Ph.D.', 'Ph.D',
  'MD', 'M.D.', 'M.D',
  'MSc', 'M.Sc.', 'M.Sc',
  'BSc', 'B.Sc.', 'B.Sc',
  'MBA', 'M.B.A.',
  'Mr.', 'MR.', 'mr.',
  'Mrs.', 'MRS.', 'mrs.',
  'Ms.', 'MS.', 'ms.',
  'Miss', 'MISS', 'miss',
  'Sir', 'SIR', 'sir',
  'Eng.', 'ENG.', 'eng.',
  // Software/IT job levels - English
  'Senior', 'SENIOR', 'senior', 'Sr.', 'SR.', 'sr.',
  'Junior', 'JUNIOR', 'junior', 'Jr.', 'JR.', 'jr.',
  'Mid', 'MID', 'mid', 'Mid-Level', 'Mid-level', 'MID-LEVEL',
  'Lead', 'LEAD', 'lead',
  'Principal', 'PRINCIPAL', 'principal',
  'Staff', 'STAFF', 'staff',
  'Chief', 'CHIEF', 'chief',
  'Head', 'HEAD', 'head',
  'Associate', 'ASSOCIATE', 'associate',
  'Intern', 'INTERN', 'intern',
  'Trainee', 'TRAINEE', 'trainee',
  // Software/IT job levels - Turkish
  'Kıdemli', 'KIDEMLI', 'kıdemli',
  'Uzman', 'UZMAN', 'uzman',
  'Stajyer', 'STAJYER', 'stajyer',
  'Baş', 'BAŞ', 'baş',
  'Yardımcı', 'YARDIMCI', 'yardımcı',
  // Without dots
  'Dr', 'DR',
  'Prof', 'PROF',
  'Doç', 'DOÇ',
  'Yrd', 'YRD',
  'Sr', 'SR',
  'Jr', 'JR',
];

/**
 * Remove titles from a name
 * @param {string} name - The full name possibly containing titles
 * @returns {string} - Name without titles
 */
export const removeTitles = (name) => {
  if (!name) return '';
  
  let cleanName = name.trim();
  
  // Remove each title
  TITLES_TO_REMOVE.forEach(title => {
    // Create a regex that matches the title at word boundaries
    const regex = new RegExp(`^${title.replace('.', '\\.')}\\s*`, 'gi');
    cleanName = cleanName.replace(regex, '');
  });
  
  // Also handle combined titles like "Yrd. Doç. Dr."
  cleanName = cleanName.replace(/^(Yrd\.?\s*)?Doç\.?\s*(Dr\.?)?\s*/gi, '');
  cleanName = cleanName.replace(/^Prof\.?\s*(Dr\.?)?\s*/gi, '');
  
  return cleanName.trim();
};

/**
 * Get initials from a name, automatically removing titles
 * @param {string} name - The full name
 * @param {number} maxLength - Maximum number of initials (default: 2)
 * @returns {string} - Uppercase initials
 */
export const getInitials = (name, maxLength = 2) => {
  if (!name || name === '—' || name === '-') return '?';
  
  // Remove titles first
  const cleanName = removeTitles(name);
  
  if (!cleanName) return '?';
  
  // Split by space and get first letter of each part
  const parts = cleanName.split(' ').filter(part => part.length > 0);
  
  if (parts.length === 0) return '?';
  
  // Get initials from the parts
  const initials = parts
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
  
  return initials || '?';
};

export default {
  removeTitles,
  getInitials,
};
