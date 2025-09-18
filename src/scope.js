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
    this.PROTECTED_SCOPES = []; // No protected scopes
    this.MIN_SCOPE = 0;
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

    if (scope < 0) {
      throw new pULIDScopeError(`Invalid scope: ${scope}. Scope must be >= 0`);
    }

    // Special case: if scope is 0, convert to MAX_SCOPE
    if (scope === 0) {
      return this.MAX_SCOPE;
    }

    // Check range
    if (scope > this.MAX_SCOPE) {
      throw new pULIDScopeError(`Invalid scope: ${scope}. Must be between ${this.MIN_SCOPE}-${this.MAX_SCOPE}`);
    }

    // We no longer check for protected scopes since 0 is allowed as input
    // but gets converted to MAX_SCOPE

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
   * @param {number} scope - Scope value (0-65535, where 0 becomes MAX_SCOPE)
   * @returns {Uint8Array} 2-byte array
   */
  scopeToBytes(scope) {
    // If scope is 0, use MAX_SCOPE instead
    const actualScope = scope === 0 ? this.MAX_SCOPE : scope;

    // For all other scopes, validate normally
    if (scope !== 0) {
      this.validate(scope);
    }

    return new Uint8Array([
      (actualScope >> 8) & 0xff,
      actualScope & 0xff
    ]);
  }

  /**
   * Convert 16-byte ULID array to scope value (extracts bytes 6-7)
   * @param {Uint8Array} bytes - 16-byte ULID array
   * @returns {number} Scope value
   * @throws {pULIDScopeError} If bytes are invalid
   */
  bytesToScope(bytes) {
    if (!bytes || bytes.length !== 16) {
      throw new pULIDScopeError(`Invalid ULID bytes: expected 16 bytes, got ${bytes ? bytes.length : 0}`);
    }

    const scope = (bytes[6] << 8) | bytes[7];
    
    // Only validate that scope is not 0 (which is reserved/invalid in stored ULIDs)
    // This matches Go implementation: scope 0 is invalid when extracted from ULID bytes
    if (scope === 0) {
      throw new pULIDScopeError('Invalid scope: extracted scope is 0 (reserved value)');
    }
    
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