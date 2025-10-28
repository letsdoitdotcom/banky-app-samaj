/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

// HTML escape function to prevent XSS
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return String(unsafe);
  }
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
}

// Email validation and sanitization
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }
  
  // Remove any HTML/script tags
  const sanitized = email.replace(/<[^>]*>/g, '').trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /onclick/i,
    /onerror/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Email contains suspicious content');
    }
  }
  
  return sanitized;
}

// Name sanitization (remove HTML but allow international characters)
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') {
    throw new Error('Name must be a string');
  }
  
  // Remove HTML tags
  const sanitized = name.replace(/<[^>]*>/g, '').trim();
  
  // Check length
  if (sanitized.length < 1 || sanitized.length > 100) {
    throw new Error('Name must be between 1 and 100 characters');
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /onclick/i,
    /onerror/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Name contains invalid characters');
    }
  }
  
  return sanitized;
}

// URL validation and sanitization
export function sanitizeUrl(url: string, allowedHosts?: string[]): string {
  if (typeof url !== 'string') {
    throw new Error('URL must be a string');
  }
  
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP/HTTPS URLs are allowed');
    }
    
    // Check against allowed hosts if provided
    if (allowedHosts && allowedHosts.length > 0) {
      if (!allowedHosts.includes(urlObj.hostname)) {
        throw new Error('URL hostname not allowed');
      }
    }
    
    return url;
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

// Transaction narration sanitization
export function sanitizeNarration(narration: string): string {
  if (typeof narration !== 'string') {
    return '';
  }
  
  // Remove HTML tags and limit length
  const sanitized = narration
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 500);
  
  return escapeHtml(sanitized);
}

// Account number validation (flexible for external accounts)
export function sanitizeAccountNumber(accountNumber: string): string {
  if (typeof accountNumber !== 'string') {
    throw new Error('Account number must be a string');
  }
  
  // Remove any non-alphanumeric characters (keep letters for some bank formats)
  const cleaned = accountNumber.replace(/[^A-Za-z0-9]/g, '');
  
  // Validate length (flexible for different bank formats)
  if (cleaned.length < 8 || cleaned.length > 20) {
    throw new Error('Account number must be between 8 and 20 characters');
  }
  
  return cleaned;
}

// Internal BankyApp account validation (strict 10 digits)
export function sanitizeBankyAppAccountNumber(accountNumber: string): string {
  if (typeof accountNumber !== 'string') {
    throw new Error('Account number must be a string');
  }
  
  // Remove any non-digit characters
  const cleaned = accountNumber.replace(/\D/g, '');
  
  // Validate length (exactly 10 digits for BankyApp)
  if (cleaned.length !== 10) {
    throw new Error('BankyApp account numbers must be exactly 10 digits');
  }
  
  return cleaned;
}

// Generic text sanitization for safe display
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  return escapeHtml(text.trim().substring(0, maxLength));
}