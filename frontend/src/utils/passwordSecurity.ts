import CryptoJS from 'crypto-js';

/**
 * Client-side password security utilities
 * Ensures passwords are never transmitted in plain text
 */

/**
 * Hash password on client before sending to server
 * This adds a layer of protection during transmission
 */
export const hashPasswordForTransmission = (password: string, salt: string = ''): string => {
  // Use a consistent salt + password to create transmission hash
  const combinedInput = salt + password + 'nexus_client_salt_v1';
  
  // SHA-256 hash for transmission (server will bcrypt this again)
  return CryptoJS.SHA256(combinedInput).toString(CryptoJS.enc.Hex);
};

/**
 * Generate a secure salt for password hashing
 */
export const generatePasswordSalt = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
};

/**
 * Validate password strength before hashing
 */
export const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters long' };
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain uppercase, lowercase, numbers, and special characters' 
    };
  }
  
  // Check for common weak passwords
  const weakPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /^nexus/i
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return { valid: false, message: 'Password contains common weak patterns' };
    }
  }

  return { valid: true, message: 'Password strength is acceptable' };
};

/**
 * Secure password utilities for encryption key derivation
 */
export const deriveEncryptionPassword = (password: string, userId: number): string => {
  // Use original password for encryption key derivation (not the transmission hash)
  return password;
};

export default {
  hashPasswordForTransmission,
  generatePasswordSalt,
  validatePasswordStrength,
  deriveEncryptionPassword
};