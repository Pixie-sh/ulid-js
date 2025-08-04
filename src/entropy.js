/**
 * Entropy generation for pULID
 * Generates 8 bytes of cryptographically secure random data
 */

const { pULIDEntropyError } = require('./errors');

/**
 * Cross-platform entropy generator
 * Supports both browser (crypto.getRandomValues) and Node.js (crypto.randomBytes)
 */
class EntropyGenerator {
  constructor() {
    this.getRandomBytes = this.initRandomSource();
  }

  /**
   * Generate 8 bytes of cryptographically secure entropy
   * @returns {Uint8Array} 8 bytes of random data
   */
  generate() {
    try {
      return this.getRandomBytes(8);
    } catch (error) {
      throw new pULIDEntropyError(`Failed to generate entropy: ${error.message}`);
    }
  }

  /**
   * Initialize the appropriate random source based on environment
   * @returns {Function} Function that generates random bytes
   * @private
   */
  initRandomSource() {
    // Browser environment - use Web Crypto API
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return (length) => {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
      };
    }
    
    // Node.js environment - use crypto module
    if (typeof require !== 'undefined') {
      try {
        const crypto = require('crypto');
        return (length) => new Uint8Array(crypto.randomBytes(length));
      } catch (error) {
        // crypto module not available
      }
    }
    
    // Fallback error - no secure random source available
    throw new pULIDEntropyError('No secure random number generator available');
  }

  /**
   * Generate multiple entropy values at once
   * @param {number} count - Number of entropy values to generate
   * @returns {Uint8Array[]} Array of entropy byte arrays
   */
  generateBatch(count) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(this.generate());
    }
    return results;
  }

  /**
   * Test if entropy generation is working
   * @returns {boolean} True if entropy generation is functional
   */
  test() {
    try {
      const entropy1 = this.generate();
      const entropy2 = this.generate();
      
      // Check that we got 8 bytes each
      if (entropy1.length !== 8 || entropy2.length !== 8) {
        return false;
      }
      
      // Check that the values are different (extremely unlikely to be the same)
      const same = entropy1.every((byte, index) => byte === entropy2[index]);
      return !same;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Default entropy generator instance
 */
const defaultEntropyGenerator = new EntropyGenerator();

/**
 * Generate 8 bytes of entropy using the default generator
 * @returns {Uint8Array} 8 bytes of random data
 */
function generateEntropy() {
  return defaultEntropyGenerator.generate();
}

/**
 * Test entropy generation functionality
 * @returns {boolean} True if entropy generation works
 */
function testEntropy() {
  return defaultEntropyGenerator.test();
}

module.exports = {
  EntropyGenerator,
  defaultEntropyGenerator,
  generateEntropy,
  testEntropy
};