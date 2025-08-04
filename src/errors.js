/**
 * pULID-specific error classes
 */

/**
 * Base pULID error class
 */
class pULIDError extends Error {
  constructor(message) {
    super(message);
    this.name = 'pULIDError';
    Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when parsing a pULID string fails
 */
class pULIDParseError extends pULIDError {
  constructor(message) {
    super(message);
    this.name = 'pULIDParseError';
  }
}

/**
 * Error thrown when an invalid scope value is used
 */
class pULIDScopeError extends pULIDError {
  constructor(message) {
    super(message);
    this.name = 'pULIDScopeError';
  }
}

/**
 * Error thrown when timestamp operations fail
 */
class pULIDTimestampError extends pULIDError {
  constructor(message) {
    super(message);
    this.name = 'pULIDTimestampError';
  }
}

/**
 * Error thrown when UUID conversion operations fail
 */
class pULIDUUIDError extends pULIDError {
  constructor(message) {
    super(message);
    this.name = 'pULIDUUIDError';
  }
}

/**
 * Error thrown when entropy generation fails
 */
class pULIDEntropyError extends pULIDError {
  constructor(message) {
    super(message);
    this.name = 'pULIDEntropyError';
  }
}

module.exports = {
  pULIDError,
  pULIDParseError,
  pULIDScopeError,
  pULIDTimestampError,
  pULIDUUIDError,
  pULIDEntropyError
};