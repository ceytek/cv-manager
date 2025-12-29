/**
 * HTML Utility Functions
 * Helper functions for HTML/text conversions
 */

/**
 * Strip HTML tags from a string to get plain text
 * @param {string} html - HTML string
 * @returns {string} Plain text without HTML tags
 */
export const stripHtml = (html) => {
  if (!html) return '';
  
  // Create a temporary div element
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  
  // Get text content (removes all HTML tags)
  const plainText = tmp.textContent || tmp.innerText || '';
  
  // Clean up extra whitespace
  return plainText.trim().replace(/\s+/g, ' ');
};

/**
 * Convert plain text to simple HTML (for initial values)
 * @param {string} text - Plain text
 * @returns {string} HTML with paragraph tags
 */
export const textToHtml = (text) => {
  if (!text) return '<p><br></p>';
  
  // Split by newlines and wrap in paragraphs
  const paragraphs = text.split('\n').filter(p => p.trim());
  if (paragraphs.length === 0) return '<p><br></p>';
  
  return paragraphs.map(p => `<p>${p}</p>`).join('');
};
