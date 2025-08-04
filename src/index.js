/**
 * pULID - Pixie ULID implementation for JavaScript
 * Main entry point with all exports
 */

// Core classes
const { pULID } = require('./pulid');
const { pULIDGenerator, createScopedGenerator, createEntityGenerator, defaultGenerator } = require('./generator');

// Component classes
const { EntropyGenerator } = require('./entropy');
const { TimestampGenerator } = require('./timestamp');
const { ScopeManager } = require('./scope');
const { UUIDConverter } = require('./uuid');

// Error classes
const {
  pULIDError,
  pULIDParseError,
  pULIDScopeError,
  pULIDTimestampError,
  pULIDUUIDError,
  pULIDEntropyError
} = require('./errors');

// Utility functions
const { encodeBase32, decodeBase32 } = require('./encoding');
const { generateEntropy, testEntropy } = require('./entropy');
const { validateScope, isValidScope, scopeToBytes, bytesToScope } = require('./scope');
const { validateTimestamp, isValidTimestamp, timestampToBytes, bytesToTimestamp } = require('./timestamp');
const { formatAsUUID, uuidToBytes, validateUUID, isValidUUID, createUUID } = require('./uuid');

/**
 * Main factory function for generating pULIDs
 * @param {Object} options - Generation options
 * @param {number} [options.timestamp] - Custom timestamp
 * @param {number} [options.scope=1] - Scope value
 * @param {Uint8Array} [options.entropy] - Custom entropy
 * @returns {string} pULID string (ULID format)
 */
function pulid(options = {}) {
  return defaultGenerator.generateString(options);
}

/**
 * Generate a pULID instance
 * @param {Object} options - Generation options
 * @returns {pULID} pULID instance
 */
function generate(options = {}) {
  return defaultGenerator.generate(options);
}

/**
 * Parse a pULID from string
 * @param {string} string - ULID string to parse
 * @returns {pULID} Parsed pULID instance
 */
function parse(string) {
  return pULID.parse(string);
}

/**
 * Validate a pULID string
 * @param {string} string - String to validate
 * @returns {boolean} True if valid
 */
function isValid(string) {
  return pULID.isValid(string);
}

/**
 * Compare two pULID strings lexicographically
 * @param {string} pulid1 - First pULID string
 * @param {string} pulid2 - Second pULID string
 * @returns {number} -1, 0, or 1
 */
function compare(pulid1, pulid2) {
  return pulid1.localeCompare(pulid2);
}

/**
 * Create a scoped generator
 * @param {number} scope - Default scope for the generator
 * @param {Object} options - Additional generator options
 * @returns {pULIDGenerator} New scoped generator
 */
function scopedGenerator(scope, options = {}) {
  return createScopedGenerator(scope, options);
}

/**
 * Test the pULID implementation
 * @returns {Object} Test results
 */
function test() {
  const results = {
    entropy: testEntropy(),
    parsing: false,
    uuid: false
  };

  try {
    // Test parsing
    const testPulid = generate({ scope: 100 });
    const parsed = parse(testPulid.toString());
    results.parsing = parsed.getScope() === 100;

    // Test UUID conversion
    const uuid = testPulid.toUUID();
    const fromUuid = pULID.fromUUID(uuid);
    results.uuid = fromUuid.equals(testPulid);
  } catch (error) {
    results.error = error.message;
  }

  results.overall = results.entropy && results.parsing && results.uuid;
  return results;
}

// Main exports
module.exports = {
  // Main factory function
  pulid,

  // Core classes
  pULID,
  pULIDGenerator,

  // Utility functions
  generate,
  parse,
  isValid,
  compare,
  scopedGenerator,
  test,

  // Component classes
  EntropyGenerator,
  TimestampGenerator,
  ScopeManager,
  UUIDConverter,

  // Generator utilities
  createScopedGenerator,
  createEntityGenerator,
  defaultGenerator,

  // Error classes
  pULIDError,
  pULIDParseError,
  pULIDScopeError,
  pULIDTimestampError,
  pULIDUUIDError,
  pULIDEntropyError,

  // Low-level utilities
  encodeBase32,
  decodeBase32,
  generateEntropy,
  testEntropy,
  validateScope,
  isValidScope,
  scopeToBytes,
  bytesToScope,
  validateTimestamp,
  isValidTimestamp,
  timestampToBytes,
  bytesToTimestamp,
  formatAsUUID,
  uuidToBytes,
  validateUUID,
  isValidUUID,
  createUUID
};

// Default export for ES6 modules
module.exports.default = pulid;