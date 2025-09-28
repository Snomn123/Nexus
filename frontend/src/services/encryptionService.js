import CryptoJS from 'crypto-js';

/**
 * End-to-End Encryption Service for Nexus
 * Provides client-side message encryption/decryption
 * Server never sees unencrypted message content
 */
class EncryptionService {
  constructor() {
    this.userMasterKey = null;
    this.channelKeys = new Map();
  }

  /**
   * Initialize encryption with user's master password
   * Called after successful authentication
   */
  async initializeEncryption(userPassword, userId) {
    // Derive master key from user password + userId (salt)
    this.userMasterKey = CryptoJS.PBKDF2(userPassword, userId.toString(), {
      keySize: 256/32,
      iterations: 100000
    }).toString();
    
    // Store encrypted master key in localStorage for session persistence
    const encryptedMasterKey = CryptoJS.AES.encrypt(this.userMasterKey, userPassword).toString();
    localStorage.setItem('nexus_master_key', encryptedMasterKey);
    localStorage.setItem('nexus_user_id', userId.toString());
    
    return this.userMasterKey !== null;
  }

  /**
   * Restore encryption from stored session
   */
  async restoreEncryption(userPassword) {
    try {
      const encryptedMasterKey = localStorage.getItem('nexus_master_key');
      const userId = localStorage.getItem('nexus_user_id');
      
      if (!encryptedMasterKey || !userId) {
        return false;
      }

      const decryptedKey = CryptoJS.AES.decrypt(encryptedMasterKey, userPassword);
      this.userMasterKey = decryptedKey.toString(CryptoJS.enc.Utf8);
      
      return this.userMasterKey.length > 0;
    } catch (error) {
      console.error('Failed to restore encryption:', error);
      return false;
    }
  }

  /**
   * Generate or retrieve channel encryption key
   */
  getChannelKey(channelId) {
    if (!this.userMasterKey) {
      throw new Error('Encryption not initialized');
    }

    if (this.channelKeys.has(channelId)) {
      return this.channelKeys.get(channelId);
    }

    // Derive channel-specific key from master key + channel ID
    const channelKey = CryptoJS.PBKDF2(this.userMasterKey, channelId.toString(), {
      keySize: 256/32,
      iterations: 10000
    }).toString();

    this.channelKeys.set(channelId, channelKey);
    return channelKey;
  }

  /**
   * Encrypt message content before sending to server
   */
  encryptMessage(content, channelId) {
    try {
      const channelKey = this.getChannelKey(channelId);
      const encrypted = CryptoJS.AES.encrypt(content, channelKey).toString();
      
      return {
        encrypted_content: encrypted,
        encryption_version: 1,
        is_encrypted: true
      };
    } catch (error) {
      console.error('Message encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message content received from server
   */
  decryptMessage(encryptedData, channelId) {
    try {
      if (!encryptedData.is_encrypted) {
        return encryptedData.content; // Fallback for unencrypted messages
      }

      const channelKey = this.getChannelKey(channelId);
      const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted_content, channelKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Message decryption failed:', error);
      return '[🔒 Unable to decrypt message - check encryption key]';
    }
  }

  /**
   * Encrypt direct message between users
   */
  encryptDirectMessage(content, userId, recipientId) {
    try {
      // Create unique key for this user pair
      const userIds = [userId, recipientId].sort();
      const dmKey = CryptoJS.PBKDF2(this.userMasterKey, userIds.join('-'), {
        keySize: 256/32,
        iterations: 10000
      }).toString();

      const encrypted = CryptoJS.AES.encrypt(content, dmKey).toString();
      
      return {
        encrypted_content: encrypted,
        encryption_version: 1,
        is_encrypted: true
      };
    } catch (error) {
      console.error('DM encryption failed:', error);
      throw new Error('Failed to encrypt direct message');
    }
  }

  /**
   * Decrypt direct message
   */
  decryptDirectMessage(encryptedData, userId, recipientId) {
    try {
      if (!encryptedData.is_encrypted) {
        return encryptedData.content;
      }

      const userIds = [userId, recipientId].sort();
      const dmKey = CryptoJS.PBKDF2(this.userMasterKey, userIds.join('-'), {
        keySize: 256/32,
        iterations: 10000
      }).toString();

      const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted_content, dmKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('DM decryption failed:', error);
      return '[🔒 Unable to decrypt message - check encryption key]';
    }
  }

  /**
   * Clear all encryption keys (logout)
   */
  clearEncryption() {
    this.userMasterKey = null;
    this.channelKeys.clear();
    localStorage.removeItem('nexus_master_key');
    localStorage.removeItem('nexus_user_id');
  }

  /**
   * Check if encryption is properly initialized
   */
  isEncryptionReady() {
    return this.userMasterKey !== null;
  }

  /**
   * Generate a cryptographically secure password for new users
   */
  static generateSecurePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }

  /**
   * Validate encryption key strength
   */
  static validateEncryptionPassword(password) {
    if (password.length < 8) {
      return { valid: false, message: 'Encryption password must be at least 8 characters' };
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { 
        valid: false, 
        message: 'Encryption password must contain uppercase, lowercase, and numbers' 
      };
    }

    return { valid: true };
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

export default encryptionService;