/**
 * UUID compatibility functions for pULID
 * Handles conversion between pULID bytes and UUID string format
 */

const { pULIDUUIDError } = require('./errors');

/**
 * UUID utility class for pULID compatibility
 */
class UUIDConverter {
  constructor() {
    // UUID format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    this.UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    this.UUID_LENGTH = 36; // Including hyphens
    this.HEX_LENGTH = 32;  // Without hyphens
  }

  /**
   * Validate UUID string format
   * @param {string} uuid - UUID string to validate
   * @returns {boolean} True if valid
   * @throws {pULIDUUIDError} If UUID format is invalid
   */
  validate(uuid) {
    if (typeof uuid !== 'string') {
      throw new pULIDUUIDError(`Invalid UUID type: ${typeof uuid}. Expected string`);
    }

    if (uuid.length !== this.UUID_LENGTH) {
      throw new pULIDUUIDError(`Invalid UUID length: ${uuid.length}. Expected ${this.UUID_LENGTH} characters`);
    }

    if (!this.UUID_REGEX.test(uuid)) {
      throw new pULIDUUIDError(`Invalid UUID format: ${uuid}. Expected format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`);
    }

    return true;
  }

  /**
   * Check if UUID is valid without throwing
   * @param {string} uuid - UUID string to check
   * @returns {boolean} True if valid
   */
  isValid(uuid) {
    try {
      return this.validate(uuid);
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert 16-byte array to UUID string format
   * @param {Uint8Array} bytes - 16-byte array (6+2+8 pULID structure)
   * @returns {string} UUID string in format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   */
  formatAsUUID(bytes) {
    if (!bytes || bytes.length !== 16) {
      throw new pULIDUUIDError(`Invalid byte array: expected 16 bytes, got ${bytes ? bytes.length : 0}`);
    }

    // Convert bytes to hex string
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Format as UUID: 8-4-4-4-12
    const uuid = [
      hex.substring(0, 8),   // 8 chars
      hex.substring(8, 12),  // 4 chars
      hex.substring(12, 16), // 4 chars
      hex.substring(16, 20), // 4 chars
      hex.substring(20, 32)  // 12 chars
    ].join('-').toLowerCase();

    return uuid;
  }

  /**
   * Convert UUID string to 16-byte array
   * @param {string} uuid - UUID string
   * @returns {Uint8Array} 16-byte array
   */
  uuidToBytes(uuid) {
    this.validate(uuid);

    // Remove hyphens and convert to lowercase
    const hex = uuid.replace(/-/g, '').toLowerCase();
    
    if (hex.length !== this.HEX_LENGTH) {
      throw new pULIDUUIDError(`Invalid hex length after removing hyphens: ${hex.length}. Expected ${this.HEX_LENGTH}`);
    }

    // Convert hex pairs to bytes
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      const hexPair = hex.substring(i * 2, i * 2 + 2);
      const byte = parseInt(hexPair, 16);
      
      if (isNaN(byte)) {
        throw new pULIDUUIDError(`Invalid hex pair: ${hexPair} at position ${i}`);
      }
      
      bytes[i] = byte;
    }

    return bytes;
  }

  /**
   * Extract timestamp from UUID (first 6 bytes)
   * @param {string} uuid - UUID string
   * @returns {number} Timestamp in milliseconds
   */
  extractTimestamp(uuid) {
    const bytes = this.uuidToBytes(uuid);
    let timestamp = 0;
    
    // First 6 bytes are timestamp
    for (let i = 0; i < 6; i++) {
      timestamp = timestamp * 256 + bytes[i];
    }
    
    return timestamp;
  }

  /**
   * Extract scope from UUID (bytes 6-7)
   * @param {string} uuid - UUID string
   * @returns {number} Scope value (returns 0 if MAX_SCOPE is detected)
   */
  extractScope(uuid) {
    const bytes = this.uuidToBytes(uuid);

    // Bytes 6-7 are scope
    const extractedScope = (bytes[6] << 8) | bytes[7];

    // If the extracted scope is MAX_SCOPE (65535), return 0 instead
    return extractedScope === 65535 ? 0 : extractedScope;
  }

  /**
   * Extract entropy from UUID (last 8 bytes)
   * @param {string} uuid - UUID string
   * @returns {Uint8Array} 8 bytes of entropy
   */
  extractEntropy(uuid) {
    const bytes = this.uuidToBytes(uuid);
    
    // Last 8 bytes are entropy
    return bytes.slice(8, 16);
  }

  /**
   * Create UUID from components
   * @param {number} timestamp - Timestamp in milliseconds
   * @param {number} scope - Scope value
   * @param {Uint8Array} entropy - 8 bytes of entropy
   * @returns {string} UUID string
   */
  createUUID(timestamp, scope, entropy) {
    if (entropy.length !== 8) {
      throw new pULIDUUIDError(`Invalid entropy length: ${entropy.length}. Expected 8 bytes`);
    }

    // Create 16-byte array: 6 bytes timestamp + 2 bytes scope + 8 bytes entropy
    const bytes = new Uint8Array(16);
    
    // Timestamp (6 bytes, big-endian)
    for (let i = 5; i >= 0; i--) {
      bytes[i] = timestamp & 0xff;
      timestamp = Math.floor(timestamp / 256);
    }
    
    // Scope (2 bytes, big-endian)
    bytes[6] = (scope >> 8) & 0xff;
    bytes[7] = scope & 0xff;
    
    // Entropy (8 bytes)
    for (let i = 0; i < 8; i++) {
      bytes[8 + i] = entropy[i];
    }

    return this.formatAsUUID(bytes);
  }

  /**
   * Generate a random UUID for testing
   * @returns {string} Random UUID string
   */
  generateRandomUUID() {
    const bytes = new Uint8Array(16);
    
    // Use crypto if available, otherwise fallback to Math.random
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    return this.formatAsUUID(bytes);
  }

  /**
   * Compare two UUIDs
   * @param {string} uuid1 - First UUID
   * @param {string} uuid2 - Second UUID
   * @returns {number} -1, 0, or 1 for less than, equal, or greater than
   */
  compare(uuid1, uuid2) {
    this.validate(uuid1);
    this.validate(uuid2);
    
    const normalized1 = uuid1.toLowerCase();
    const normalized2 = uuid2.toLowerCase();
    
    if (normalized1 < normalized2) return -1;
    if (normalized1 > normalized2) return 1;
    return 0;
  }
}

/**
 * Default UUID converter instance
 */
const defaultUUIDConverter = new UUIDConverter();

/**
 * Convert bytes to UUID using default converter
 * @param {Uint8Array} bytes - 16-byte array
 * @returns {string} UUID string
 */
function formatAsUUID(bytes) {
  return defaultUUIDConverter.formatAsUUID(bytes);
}

/**
 * Convert UUID to bytes using default converter
 * @param {string} uuid - UUID string
 * @returns {Uint8Array} 16-byte array
 */
function uuidToBytes(uuid) {
  return defaultUUIDConverter.uuidToBytes(uuid);
}

/**
 * Validate UUID using default converter
 * @param {string} uuid - UUID string
 * @returns {boolean} True if valid
 */
function validateUUID(uuid) {
  return defaultUUIDConverter.validate(uuid);
}

/**
 * Check if UUID is valid using default converter
 * @param {string} uuid - UUID string
 * @returns {boolean} True if valid
 */
function isValidUUID(uuid) {
  return defaultUUIDConverter.isValid(uuid);
}

/**
 * Create UUID from components using default converter
 * @param {number} timestamp - Timestamp in milliseconds
 * @param {number} scope - Scope value
 * @param {Uint8Array} entropy - 8 bytes of entropy
 * @returns {string} UUID string
 */
function createUUID(timestamp, scope, entropy) {
  return defaultUUIDConverter.createUUID(timestamp, scope, entropy);
}

module.exports = {
  UUIDConverter,
  defaultUUIDConverter,
  formatAsUUID,
  uuidToBytes,
  validateUUID,
  isValidUUID,
  createUUID
};