/**
 * pULID Generator class for controlled pULID generation
 * Provides configurable generation with default settings
 */

const { pULID } = require('./pulid');
const { EntropyGenerator } = require('./entropy');
const { TimestampGenerator } = require('./timestamp');
const { ScopeManager } = require('./scope');
const { pULIDError } = require('./errors');

/**
 * pULID Generator class for controlled generation
 */
class pULIDGenerator {
  /**
   * Create a new pULID generator
   * @param {Object} options - Generator configuration
   * @param {number} [options.defaultScope=0] - Default scope for generated pULIDs
   * @param {boolean} [options.validateScope=true] - Whether to validate scopes
   * @param {EntropyGenerator} [options.entropyGenerator] - Custom entropy generator
   * @param {TimestampGenerator} [options.timestampGenerator] - Custom timestamp generator
   * @param {ScopeManager} [options.scopeManager] - Custom scope manager
   */
  constructor(options = {}) {
    this.defaultScope = options.defaultScope || 1;
    this.validateScope = options.validateScope !== false;
    
    // Initialize generators
    this.entropyGenerator = options.entropyGenerator || new EntropyGenerator();
    this.timestampGenerator = options.timestampGenerator || new TimestampGenerator();
    this.scopeManager = options.scopeManager || new ScopeManager();
    
    // Validate default scope
    if (this.validateScope) {
      this.scopeManager.validate(this.defaultScope);
    }
  }

  /**
   * Generate a new pULID
   * @param {Object} options - Generation options
   * @param {number} [options.timestamp] - Custom timestamp (defaults to current time)
   * @param {number} [options.scope] - Custom scope (defaults to generator's default scope)
   * @param {Uint8Array} [options.entropy] - Custom entropy (defaults to random generation)
   * @returns {pULID} New pULID instance
   */
  generate(options = {}) {
    const timestamp = options.timestamp || this.timestampGenerator.generate();
    const scope = options.scope !== undefined ? options.scope : this.defaultScope;
    const entropy = options.entropy || this.entropyGenerator.generate();

    // Validate scope if validation is enabled
    if (this.validateScope) {
      this.scopeManager.validate(scope);
    }

    return new pULID(timestamp, scope, entropy);
  }

  /**
   * Generate a pULID string (ULID format)
   * @param {Object} options - Generation options
   * @returns {string} 26-character ULID string
   */
  generateString(options = {}) {
    return this.generate(options).toString();
  }

  /**
   * Generate a pULID in UUID format
   * @param {Object} options - Generation options
   * @returns {string} UUID string
   */
  generateUUID(options = {}) {
    return this.generate(options).toUUID();
  }

  /**
   * Generate multiple pULIDs
   * @param {number} count - Number of pULIDs to generate
   * @param {Object} options - Generation options
   * @returns {pULID[]} Array of pULID instances
   */
  generateBatch(count, options = {}) {
    if (typeof count !== 'number' || count < 1) {
      throw new pULIDError(`Invalid count: ${count}. Must be a positive number`);
    }

    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(this.generate(options));
    }
    return results;
  }

  /**
   * Generate multiple pULID strings
   * @param {number} count - Number of pULIDs to generate
   * @param {Object} options - Generation options
   * @returns {string[]} Array of ULID strings
   */
  generateBatchStrings(count, options = {}) {
    return this.generateBatch(count, options).map(pulid => pulid.toString());
  }

  /**
   * Generate pULID for a specific entity type
   * @param {string} entityType - Entity type name
   * @param {Object} options - Additional generation options
   * @returns {pULID} New pULID instance with entity-specific scope
   */
  generateForEntity(entityType, options = {}) {
    const scope = this.scopeManager.getScopeForEntity(entityType);
    return this.generate({
      ...options,
      scope
    });
  }

  /**
   * Generate pULID with a specific timestamp
   * @param {number|Date|string} timestamp - Timestamp (milliseconds, Date object, or ISO string)
   * @param {Object} options - Additional generation options
   * @returns {pULID} New pULID instance
   */
  generateAt(timestamp, options = {}) {
    let ts;
    
    if (typeof timestamp === 'number') {
      ts = timestamp;
    } else if (timestamp instanceof Date) {
      ts = timestamp.getTime();
    } else if (typeof timestamp === 'string') {
      ts = new Date(timestamp).getTime();
    } else {
      throw new pULIDError(`Invalid timestamp type: ${typeof timestamp}`);
    }

    return this.generate({
      ...options,
      timestamp: ts
    });
  }

  /**
   * Set the default scope for this generator
   * @param {number} scope - New default scope
   */
  setDefaultScope(scope) {
    if (this.validateScope) {
      this.scopeManager.validate(scope);
    }
    this.defaultScope = scope;
  }

  /**
   * Get the current default scope
   * @returns {number} Current default scope
   */
  getDefaultScope() {
    return this.defaultScope;
  }

  /**
   * Get generator configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return {
      defaultScope: this.defaultScope,
      validateScope: this.validateScope,
      scopeInfo: this.scopeManager.getScopeInfo(),
      timestampInfo: this.timestampGenerator.getTimestampInfo()
    };
  }
}

/**
 * Create a scoped generator for a specific scope
 * @param {number} scope - Scope value for the generator
 * @param {Object} options - Additional generator options
 * @returns {pULIDGenerator} New generator with the specified default scope
 */
function createScopedGenerator(scope, options = {}) {
  return new pULIDGenerator({
    ...options,
    defaultScope: scope
  });
}

/**
 * Default pULID generator instance
 */
const defaultGenerator = new pULIDGenerator();

/**
 * Generate a pULID using the default generator
 * @param {Object} options - Generation options
 * @returns {pULID} New pULID instance
 */
function generate(options = {}) {
  return defaultGenerator.generate(options);
}

/**
 * Generate a pULID string using the default generator
 * @param {Object} options - Generation options
 * @returns {string} ULID string
 */
function generateString(options = {}) {
  return defaultGenerator.generateString(options);
}

module.exports = {
  pULIDGenerator,
  createScopedGenerator,
  defaultGenerator,
  generate,
  generateString
};