/**
 * Main pULID class implementation
 * Combines timestamp, scope, and entropy into a pULID identifier
 */

const { encodeBase32, decodeBase32, bytesToScope, bytesToTimestamp, bytesToEntropy } = require('./encoding');
const { pULIDError, pULIDParseError } = require('./errors');
const { generateEntropy } = require('./entropy');
const { validateScope, scopeToBytes } = require('./scope');
const { validateTimestamp, timestampToBytes } = require('./timestamp');
const { formatAsUUID, uuidToBytes } = require('./uuid');

/**
 * pULID class representing a Pixie ULID identifier
 * Structure: 6 bytes timestamp + 2 bytes scope + 8 bytes entropy = 16 bytes total
 */
class pULID {
  /**
   * Create a new pULID instance
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @param {number} scope - Scope value (1-65534)
   * @param {Uint8Array} entropy - 8 bytes of entropy
   */
  constructor(timestamp, scope, entropy) {
    // Validate inputs
    validateTimestamp(timestamp);

    // If scope is 0, convert to MAX_SCOPE (65535)
    const actualScope = scope === 0 ? 65535 : scope;

    // For all other scopes, validate normally
    if (scope !== 0) {
      validateScope(scope);
    }

    if (!entropy || entropy.length !== 8) {
      throw new pULIDError(`Invalid entropy: expected 8 bytes, got ${entropy ? entropy.length : 0}`);
    }

    this.timestamp = timestamp;
    this.scope = actualScope; // Store the actual scope (65535 if input was 0)
    this.entropy = new Uint8Array(entropy); // Create a copy to prevent external modification
  }

  /**
   * Convert pULID to string representation (ULID format)
   * @returns {string} 26-character Base32 encoded string
   */
  toString() {
    const bytes = this.toBytes();
    return encodeBase32(bytes);
  }

  /**
   * Convert pULID to UUID format
   * @returns {string} UUID string in format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   */
  toUUID() {
    const bytes = this.toBytes();
    return formatAsUUID(bytes);
  }

  /**
   * Convert pULID to ULID format
   * @returns {string} ULID string in format
   */
  toULID() {
    return this.toString();
  }

  /**
   * Convert pULID to 16-byte array
   * @returns {Uint8Array} 16-byte array (6+2+8 structure)
   */
  toBytes() {
    const timestampBytes = timestampToBytes(this.timestamp);
    const scopeBytes = scopeToBytes(this.scope);
    
    // Combine all bytes: timestamp + scope + entropy
    const bytes = new Uint8Array(16);
    bytes.set(timestampBytes, 0);  // bytes 0-5
    bytes.set(scopeBytes, 6);      // bytes 6-7
    bytes.set(this.entropy, 8);    // bytes 8-15
    
    return bytes;
  }

  /**
   * Get timestamp as Date object
   * @returns {Date} Date object representing the timestamp
   */
  getTime() {
    return new Date(this.timestamp);
  }

  /**
   * Get timestamp as milliseconds
   * @returns {number} Unix timestamp in milliseconds
   */
  getTimestamp() {
    return this.timestamp;
  }

  /**
   * Get scope value
   * @returns {number} Scope value (1-65534)
   */
  getScope() {
    return this.scope;
  }

  /**
   * Get entropy bytes
   * @returns {Uint8Array} Copy of the 8-byte entropy array
   */
  getEntropy() {
    return new Uint8Array(this.entropy);
  }

  /**
   * Compare this pULID with another pULID
   * @param {pULID} other - Another pULID instance
   * @returns {number} -1, 0, or 1 for less than, equal, or greater than
   */
  compare(other) {
    if (!(other instanceof pULID)) {
      throw new pULIDError('Cannot compare with non-pULID object');
    }

    // Compare lexicographically by string representation
    const thisStr = this.toString();
    const otherStr = other.toString();
    
    if (thisStr < otherStr) return -1;
    if (thisStr > otherStr) return 1;
    return 0;
  }

  /**
   * Check if this pULID equals another pULID
   * @param {pULID} other - Another pULID instance
   * @returns {boolean} True if equal
   */
  equals(other) {
    return this.compare(other) === 0;
  }

  /**
   * Get JSON representation
   * @returns {Object} Object with timestamp, scope, entropy, ulid, and uuid
   */
  toJSON() {
    return {
      timestamp: this.timestamp,
      scope: this.scope,
      entropy: Array.from(this.entropy),
      ulid: this.toString(),
      uuid: this.toUUID(),
      date: this.getTime().toISOString()
    };
  }

  /**
   * Generate a new pULID with current timestamp
   * @param {Object} options - Generation options
   * @param {number} [options.timestamp] - Custom timestamp (defaults to current time)
   * @param {number} [options.scope=1] - Scope value (defaults to 1)
   * @param {Uint8Array} [options.entropy] - Custom entropy (defaults to random)
   * @returns {pULID} New pULID instance
   */
  static generate(options = {}) {
    const timestamp = options.timestamp || Date.now();
    const scope = options.scope || 1;
    const entropy = options.entropy || generateEntropy();

    return new pULID(timestamp, scope, entropy);
  }

  /**
   * Parse pULID from ULID string representation
   * @param {string} string - 26-character ULID string
   * @returns {pULID} Parsed pULID instance
   * @throws {pULIDParseError} If string is invalid
   */
  static parse(string) {
    if (typeof string !== 'string') {
      throw new pULIDParseError(`Invalid input type: ${typeof string}. Expected string`);
    }

    if (string.length !== 26) {
      throw new pULIDParseError(`Invalid ULID length: ${string.length}. Expected 26 characters`);
    }

    try {
      const bytes = decodeBase32(string);
      return pULID.fromBytes(bytes);
    } catch (error) {
      throw new pULIDParseError(`Failed to parse ULID string: ${error.message}`);
    }
  }

  /**
   * Create pULID from 16-byte array
   * @param {Uint8Array} bytes - 16-byte array
   * @returns {pULID} New pULID instance
   * @throws {pULIDParseError} If bytes are invalid
   */
  static fromBytes(bytes) {
    if (!bytes || bytes.length !== 16) {
      throw new pULIDParseError(`Invalid byte array: expected 16 bytes, got ${bytes ? bytes.length : 0}`);
    }

    try {
      const timestamp = bytesToTimestamp(bytes);
      const scope = bytesToScope(bytes);
      const entropy = bytesToEntropy(bytes);

      return new pULID(timestamp, scope, entropy);
    } catch (error) {
      throw new pULIDParseError(`Failed to parse bytes: ${error.message}`);
    }
  }

  /**
   * Parse pULID from UUID string
   * @param {string} uuid - UUID string
   * @returns {pULID} New pULID instance
   * @throws {pULIDParseError} If UUID is invalid
   */
  static fromUUID(uuid) {
    try {
      const bytes = uuidToBytes(uuid);
      return pULID.fromBytes(bytes);
    } catch (error) {
      throw new pULIDParseError(`Failed to parse UUID: ${error.message}`);
    }
  }

  /**
   * Validate pULID string format
   * @param {string} string - String to validate
   * @returns {boolean} True if valid pULID string
   */
  static isValid(string) {
    try {
      pULID.parse(string);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create pULID with specific entity scope
   * @param {string} entityType - Entity type name
   * @param {Object} options - Additional options
   * @returns {pULID} New pULID instance with entity-specific scope
   */
  static forEntity(entityType, options = {}) {
    const { defaultScopeManager } = require('./scope');
    const scope = defaultScopeManager.getScopeForEntity(entityType);
    
    return pULID.generate({
      ...options,
      scope
    });
  }

  /**
   * Generate multiple pULIDs at once
   * @param {number} count - Number of pULIDs to generate
   * @param {Object} options - Generation options
   * @returns {pULID[]} Array of pULID instances
   */
  static generateBatch(count, options = {}) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(pULID.generate(options));
    }
    return results;
  }

  /**
   * Sort an array of pULIDs lexicographically
   * @param {pULID[]} pulids - Array of pULID instances
   * @returns {pULID[]} Sorted array
   */
  static sort(pulids) {
    return pulids.slice().sort((a, b) => a.compare(b));
  }
}

module.exports = {
  pULID
};