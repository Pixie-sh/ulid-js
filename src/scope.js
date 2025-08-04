/**
 * Scope management for pULID
 * Handles scope validation and conversion to/from bytes
 */

const { pULIDScopeError } = require('./errors');

/**
 * Scope manager class for pULID scope validation and handling
 */
class ScopeManager {
  constructor() {
    this.PROTECTED_SCOPES = [0]; // Only scope 0 is reserved by library
    this.MIN_SCOPE = 1;
    this.MAX_SCOPE = 65535; // Allow max scope 65535 as shown in golang examples
  }

  /**
   * Validate a scope value
   * @param {number} scope - Scope value to validate
   * @returns {boolean} True if valid
   * @throws {pULIDScopeError} If scope is invalid
   */
  validate(scope) {
    // Check if scope is a number
    if (typeof scope !== 'number' || !Number.isInteger(scope)) {
      throw new pULIDScopeError(`Invalid scope type: ${typeof scope}. Scope must be an integer`);
    }

    // Check range
    if (scope < this.MIN_SCOPE || scope > this.MAX_SCOPE) {
      throw new pULIDScopeError(`Invalid scope: ${scope}. Must be between ${this.MIN_SCOPE}-${this.MAX_SCOPE}`);
    }

    // Check protected scopes
    if (this.PROTECTED_SCOPES.includes(scope)) {
      throw new pULIDScopeError(`Protected scope: ${scope}. Scopes ${this.PROTECTED_SCOPES.join(' and ')} are reserved`);
    }

    return true;
  }

  /**
   * Check if a scope is valid without throwing
   * @param {number} scope - Scope value to check
   * @returns {boolean} True if valid, false otherwise
   */
  isValid(scope) {
    try {
      return this.validate(scope);
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert scope to 2-byte big-endian array
   * @param {number} scope - Scope value (1-65534)
   * @returns {Uint8Array} 2-byte array
   */
  scopeToBytes(scope) {
    this.validate(scope);
    return new Uint8Array([
      (scope >> 8) & 0xff,
      scope & 0xff
    ]);
  }

  /**
   * Convert 2-byte array to scope value
   * @param {Uint8Array} bytes - 2-byte array
   * @returns {number} Scope value
   * @throws {pULIDScopeError} If bytes are invalid
   */
  bytesToScope(bytes) {
    if (!bytes || bytes.length !== 2) {
      throw new pULIDScopeError(`Invalid scope bytes: expected 2 bytes, got ${bytes ? bytes.length : 0}`);
    }

    const scope = (bytes[0] << 8) | bytes[1];
    this.validate(scope);
    return scope;
  }

  /**
   * Get all valid scope values (for testing purposes)
   * @returns {Object} Object with min, max, and protected scopes
   */
  getScopeInfo() {
    return {
      min: this.MIN_SCOPE,
      max: this.MAX_SCOPE,
      protected: [...this.PROTECTED_SCOPES],
      available: this.MAX_SCOPE - this.MIN_SCOPE + 1
    };
  }
}

/**
 * Default scope manager instance
 */
const defaultScopeManager = new ScopeManager();

/**
 * Validate a scope using the default manager
 * @param {number} scope - Scope to validate
 * @returns {boolean} True if valid
 */
function validateScope(scope) {
  return defaultScopeManager.validate(scope);
}

/**
 * Check if a scope is valid using the default manager
 * @param {number} scope - Scope to check
 * @returns {boolean} True if valid
 */
function isValidScope(scope) {
  return defaultScopeManager.isValid(scope);
}

/**
 * Convert scope to bytes using the default manager
 * @param {number} scope - Scope value
 * @returns {Uint8Array} 2-byte array
 */
function scopeToBytes(scope) {
  return defaultScopeManager.scopeToBytes(scope);
}

/**
 * Convert bytes to scope using the default manager
 * @param {Uint8Array} bytes - 2-byte array
 * @returns {number} Scope value
 */
function bytesToScope(bytes) {
  return defaultScopeManager.bytesToScope(bytes);
}

module.exports = {
  ScopeManager,
  defaultScopeManager,
  validateScope,
  isValidScope,
  scopeToBytes,
  bytesToScope
};