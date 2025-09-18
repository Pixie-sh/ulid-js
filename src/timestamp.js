/**
 * Timestamp handling for pULID
 * Manages 6-byte timestamp conversion and validation
 */

const { pULIDTimestampError } = require('./errors');

/**
 * Timestamp generator and handler for pULID
 */
class TimestampGenerator {
  constructor() {
    // Maximum timestamp value for 48-bit (6 bytes)
    // 2^48 - 1 = 281474976710655 (year 10889)
    this.MAX_TIMESTAMP = 281474976710655;
    this.MIN_TIMESTAMP = 0;
  }

  /**
   * Generate current timestamp
   * @returns {number} Current Unix timestamp in milliseconds
   */
  generate() {
    return Date.now();
  }

  /**
   * Validate timestamp value
   * @param {number} timestamp - Timestamp to validate
   * @returns {boolean} True if valid
   * @throws {pULIDTimestampError} If timestamp is invalid
   */
  validate(timestamp) {
    if (typeof timestamp !== 'number' || !Number.isInteger(timestamp)) {
      throw new pULIDTimestampError(`Invalid timestamp type: ${typeof timestamp}. Timestamp must be an integer`);
    }

    if (timestamp < this.MIN_TIMESTAMP) {
      throw new pULIDTimestampError(`Timestamp too small: ${timestamp}. Must be >= ${this.MIN_TIMESTAMP}`);
    }

    if (timestamp > this.MAX_TIMESTAMP) {
      throw new pULIDTimestampError(`Timestamp too large: ${timestamp}. Must be <= ${this.MAX_TIMESTAMP} (year 10889)`);
    }

    return true;
  }

  /**
   * Check if timestamp is valid without throwing
   * @param {number} timestamp - Timestamp to check
   * @returns {boolean} True if valid
   */
  isValid(timestamp) {
    try {
      return this.validate(timestamp);
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert timestamp to 6-byte big-endian array
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {Uint8Array} 6-byte array
   */
  timestampToBytes(timestamp) {
    this.validate(timestamp);
    
    const bytes = new Uint8Array(6);
    for (let i = 5; i >= 0; i--) {
      bytes[i] = timestamp & 0xff;
      timestamp = Math.floor(timestamp / 256);
    }
    return bytes;
  }

  /**
   * Convert 16-byte ULID array to timestamp (extracts bytes 0-5)
   * @param {Uint8Array} bytes - 16-byte ULID array
   * @returns {number} Unix timestamp in milliseconds
   * @throws {pULIDTimestampError} If bytes are invalid
   */
  bytesToTimestamp(bytes) {
    if (!bytes || bytes.length !== 16) {
      throw new pULIDTimestampError(`Invalid ULID bytes: expected 16 bytes, got ${bytes ? bytes.length : 0}`);
    }

    // Extract timestamp from first 6 bytes (big-endian)
    // Using proper JavaScript arithmetic to avoid integer overflow
    let timestamp = 0;
    for (let i = 0; i < 6; i++) {
      timestamp = timestamp * 256 + bytes[i];
    }

    this.validate(timestamp);
    return timestamp;
  }

  /**
   * Convert timestamp to Date object
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {Date} Date object
   */
  timestampToDate(timestamp) {
    this.validate(timestamp);
    return new Date(timestamp);
  }

  /**
   * Convert Date object to timestamp
   * @param {Date} date - Date object
   * @returns {number} Unix timestamp in milliseconds
   */
  dateToTimestamp(date) {
    if (!(date instanceof Date)) {
      throw new pULIDTimestampError(`Invalid date type: ${typeof date}. Expected Date object`);
    }

    if (isNaN(date.getTime())) {
      throw new pULIDTimestampError('Invalid date: Date object represents an invalid date');
    }

    const timestamp = date.getTime();
    this.validate(timestamp);
    return timestamp;
  }

  /**
   * Get timestamp info for debugging
   * @returns {Object} Object with min, max timestamp values
   */
  getTimestampInfo() {
    return {
      min: this.MIN_TIMESTAMP,
      max: this.MAX_TIMESTAMP,
      maxDate: new Date(this.MAX_TIMESTAMP),
      current: this.generate(),
      currentDate: new Date(this.generate())
    };
  }

  /**
   * Generate timestamp for a specific date
   * @param {string|Date} date - Date string or Date object
   * @returns {number} Unix timestamp in milliseconds
   */
  timestampFor(date) {
    let dateObj;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      throw new pULIDTimestampError(`Invalid date parameter: ${typeof date}. Expected string or Date`);
    }

    return this.dateToTimestamp(dateObj);
  }

  /**
   * Check if timestamp is in the future
   * @param {number} timestamp - Timestamp to check
   * @returns {boolean} True if timestamp is in the future
   */
  isFuture(timestamp) {
    this.validate(timestamp);
    return timestamp > this.generate();
  }

  /**
   * Check if timestamp is in the past
   * @param {number} timestamp - Timestamp to check
   * @returns {boolean} True if timestamp is in the past
   */
  isPast(timestamp) {
    this.validate(timestamp);
    return timestamp < this.generate();
  }
}

/**
 * Default timestamp generator instance
 */
const defaultTimestampGenerator = new TimestampGenerator();

/**
 * Generate current timestamp using default generator
 * @returns {number} Current Unix timestamp in milliseconds
 */
function generateTimestamp() {
  return defaultTimestampGenerator.generate();
}

/**
 * Validate timestamp using default generator
 * @param {number} timestamp - Timestamp to validate
 * @returns {boolean} True if valid
 */
function validateTimestamp(timestamp) {
  return defaultTimestampGenerator.validate(timestamp);
}

/**
 * Check if timestamp is valid using default generator
 * @param {number} timestamp - Timestamp to check
 * @returns {boolean} True if valid
 */
function isValidTimestamp(timestamp) {
  return defaultTimestampGenerator.isValid(timestamp);
}

/**
 * Convert timestamp to bytes using default generator
 * @param {number} timestamp - Timestamp value
 * @returns {Uint8Array} 6-byte array
 */
function timestampToBytes(timestamp) {
  return defaultTimestampGenerator.timestampToBytes(timestamp);
}

/**
 * Convert bytes to timestamp using default generator
 * @param {Uint8Array} bytes - 6-byte array
 * @returns {number} Timestamp value
 */
function bytesToTimestamp(bytes) {
  return defaultTimestampGenerator.bytesToTimestamp(bytes);
}

module.exports = {
  TimestampGenerator,
  defaultTimestampGenerator,
  generateTimestamp,
  validateTimestamp,
  isValidTimestamp,
  timestampToBytes,
  bytesToTimestamp
};