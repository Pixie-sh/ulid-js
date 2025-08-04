# pULID JavaScript Implementation Guidelines

Based on the ulid-go project patterns and pULID specification, this document provides comprehensive guidelines for implementing a pULID (Pixie ULID) library in JavaScript.

## Table of Contents

1. [pULID Specification Overview](#pulid-specification-overview)
2. [Core Components](#core-components)
3. [API Design Guidelines](#api-design-guidelines)
4. [Implementation Details](#implementation-details)
5. [Error Handling](#error-handling)
6. [Testing Guidelines](#testing-guidelines)
7. [Performance Considerations](#performance-considerations)

## pULID Specification Overview

### What is pULID?

pULID is a 128-bit identifier that is:
- **ULID compatible**: Can be used anywhere ULIDs are expected
- **UUIDv4 compatible**: Can be converted to/from UUID format
- **Time based**: Uses 6-byte timestamp for millisecond precision
- **Scope aware**: 2-byte scope field for entity types or namespaces
- **Entropy optimized**: 8-byte cryptographically secure entropy
- **Concurrent safe**: Optimized for concurrent generation
- **Lexicographically sortable**: Earlier generated pULIDs sort before later ones

### pULID Structure

```
  6bytes   2bytes    8bytes
| ------ | | -- | | -------- |
   epoch.  scope   entropy
```

Visual representation:
```
 01JJN0XQ6Y  0001  N7WGR4NZP1C1Q
|----------|  |--|  |-----------|
 Timestamp   Scope    Entropy
  6 bytes   2 bytes   8 bytes
```

- **Timestamp**: 48-bit big-endian unsigned integer (Unix time in milliseconds)
- **Scope**: 16-bit scope identifier (1-65534, excluding 0 and 65535)
- **Entropy**: 64-bit cryptographically secure random data

## Core Components

### 1. Encoding/Decoding

#### Base32 Encoding (Crockford's Base32)
```javascript
// Character set: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
// Excludes: I, L, O, U to avoid confusion
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const DECODING = {
  // Map each character to its numeric value
  // Include lowercase mappings for case insensitivity
};
```

#### Key Functions Needed:
- `encode(bytes)`: Convert byte array to Base32 string
- `decode(string)`: Convert Base32 string to byte array
- Case-insensitive decoding support
- pULID-specific encoding for 6+2+8 byte structure

### 2. Timestamp Handling

```javascript
class TimestampGenerator {
  constructor() {
    // No need to track last time - pULID uses fresh entropy
  }
  
  // Generate 6-byte timestamp
  generate() {
    const now = Date.now();
    return this.timestampToBytes(now);
  }
  
  timestampToBytes(timestamp) {
    // Convert timestamp to 6-byte big-endian array
    const bytes = new Uint8Array(6);
    for (let i = 5; i >= 0; i--) {
      bytes[i] = timestamp & 0xff;
      timestamp = Math.floor(timestamp / 256);
    }
    return bytes;
  }
}
```

### 3. Scope Management

```javascript
class ScopeManager {
  constructor() {
    this.PROTECTED_SCOPES = [0, 65535]; // Reserved by library
    this.MIN_SCOPE = 1;
    this.MAX_SCOPE = 65534;
  }
  
  validate(scope) {
    if (scope < this.MIN_SCOPE || scope > this.MAX_SCOPE) {
      throw new pULIDScopeError(`Invalid scope: ${scope}. Must be between 1-65534`);
    }
    if (this.PROTECTED_SCOPES.includes(scope)) {
      throw new pULIDScopeError(`Protected scope: ${scope}. Scopes 0 and 65535 are reserved`);
    }
    return true;
  }
  
  scopeToBytes(scope) {
    // Convert scope to 2-byte big-endian array
    return new Uint8Array([
      (scope >> 8) & 0xff,
      scope & 0xff
    ]);
  }
}
```

### 4. Entropy Generation

pULID uses fresh 8-byte entropy for each generation (no monotonic increment):

```javascript
class EntropyGenerator {
  constructor() {
    // Use crypto.getRandomValues() for browser
    // Use crypto.randomBytes() for Node.js
    this.getRandomBytes = this.initRandomSource();
  }
  
  generate() {
    // Generate fresh 8 bytes of cryptographically secure entropy
    return this.getRandomBytes(8);
  }
  
  initRandomSource() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return (length) => {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
      };
    } else if (typeof require !== 'undefined') {
      const crypto = require('crypto');
      return (length) => new Uint8Array(crypto.randomBytes(length));
    } else {
      throw new Error('No secure random number generator available');
    }
  }
}
```

## API Design Guidelines

### Core pULID Class

```javascript
class pULID {
  constructor(timestamp, scope, entropy) {
    this.timestamp = timestamp; // 48-bit timestamp (6 bytes)
    this.scope = scope;         // 16-bit scope (2 bytes)
    this.entropy = entropy;     // 64-bit entropy (8 bytes)
  }
  
  // Convert to string representation (ULID format)
  toString() {
    // Encode timestamp (10 chars) + scope (2 chars) + entropy (14 chars) = 26 chars total
    const timestampBytes = this.timestampToBytes();
    const scopeBytes = this.scopeToBytes();
    const allBytes = new Uint8Array([...timestampBytes, ...scopeBytes, ...this.entropy]);
    return this.encodeBase32(allBytes);
  }
  
  // Convert to UUID format
  toUUID() {
    const bytes = this.toBytes();
    return this.formatAsUUID(bytes);
  }
  
  // Convert to byte array
  toBytes() {
    // Return 16-byte Uint8Array (6+2+8)
    const timestampBytes = this.timestampToBytes();
    const scopeBytes = this.scopeToBytes();
    return new Uint8Array([...timestampBytes, ...scopeBytes, ...this.entropy]);
  }
  
  // Get timestamp as Date object
  getTime() {
    return new Date(this.timestamp);
  }
  
  // Get scope value
  getScope() {
    return this.scope;
  }
  
  // Static factory methods
  static generate(options = {}) {
    const timestamp = options.timestamp || Date.now();
    const scope = options.scope || 1; // Default scope
    const entropy = new EntropyGenerator().generate();
    return new pULID(timestamp, scope, entropy);
  }
  
  static parse(string) {
    // Parse pULID from ULID string representation
    const bytes = this.decodeBase32(string);
    return this.fromBytes(bytes);
  }
  
  static fromBytes(bytes) {
    // Create pULID from 16-byte array
    const timestamp = this.bytesToTimestamp(bytes.slice(0, 6));
    const scope = this.bytesToScope(bytes.slice(6, 8));
    const entropy = bytes.slice(8, 16);
    return new pULID(timestamp, scope, entropy);
  }
  
  static fromUUID(uuid) {
    // Parse pULID from UUID string
    const bytes = this.uuidToBytes(uuid);
    return this.fromBytes(bytes);
  }
}
```

### Generator Class

```javascript
class pULIDGenerator {
  constructor(options = {}) {
    this.defaultScope = options.defaultScope || 1;
    this.timestampGenerator = new TimestampGenerator();
    this.scopeManager = new ScopeManager();
    this.entropyGenerator = new EntropyGenerator();
  }
  
  generate(options = {}) {
    const timestamp = options.timestamp || Date.now();
    const scope = options.scope || this.defaultScope;
    
    // Validate scope
    this.scopeManager.validate(scope);
    
    const entropy = this.entropyGenerator.generate();
    return new pULID(timestamp, scope, entropy);
  }
}
```

### Utility Functions

```javascript
// Factory function for easy usage
function pulid(options = {}) {
  return defaultGenerator.generate(options).toString();
}

// Validation function
function isValid(pulidString) {
  // Validate pULID string format and content
  try {
    pULID.parse(pulidString);
    return true;
  } catch {
    return false;
  }
}

// Comparison functions
function compare(pulid1, pulid2) {
  // Lexicographic comparison
  return pulid1.toString().localeCompare(pulid2.toString());
}

// Scope utilities
function createScopedGenerator(scope) {
  return new pULIDGenerator({ defaultScope: scope });
}
```

## Implementation Details

### 1. Timestamp Encoding/Decoding

```javascript
function encodeTimestamp(timestamp) {
  // Convert 48-bit timestamp to 6-byte array, then to 10-character Base32 string
  const bytes = new Uint8Array(6);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = timestamp & 0xff;
    timestamp = Math.floor(timestamp / 256);
  }
  return encodeBase32(bytes); // 10 characters
}

function decodeTimestamp(encoded) {
  // Convert 10-character Base32 string to timestamp
  const bytes = decodeBase32(encoded.substring(0, 10));
  let timestamp = 0;
  for (let i = 0; i < 6; i++) {
    timestamp = timestamp * 256 + bytes[i];
  }
  return timestamp;
}
```

### 2. Scope Encoding/Decoding

```javascript
function encodeScope(scope) {
  // Convert 16-bit scope to 2-byte array, then to 2-character Base32 string
  const bytes = new Uint8Array([
    (scope >> 8) & 0xff,
    scope & 0xff
  ]);
  return encodeBase32(bytes); // 2 characters (approximately)
}

function decodeScope(encoded) {
  // Convert scope portion of Base32 string to scope value
  const bytes = decodeBase32(encoded.substring(10, 12));
  return (bytes[0] << 8) | bytes[1];
}
```

### 3. Entropy Encoding/Decoding

```javascript
function encodeEntropy(entropyBytes) {
  // Convert 8-byte entropy data to 14-character Base32 string
  return encodeBase32(entropyBytes); // 14 characters (approximately)
}

function decodeEntropy(encoded) {
  // Convert entropy portion of Base32 string to byte array
  return decodeBase32(encoded.substring(12, 26));
}
```

### 4. UUID Compatibility

```javascript
function formatAsUUID(bytes) {
  // Convert 16-byte array to UUID string format
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-').toUpperCase();
}

function uuidToBytes(uuid) {
  // Convert UUID string to 16-byte array
  const hex = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
```

## Error Handling

### Error Types

```javascript
class pULIDError extends Error {
  constructor(message) {
    super(message);
    this.name = 'pULIDError';
  }
}

class pULIDParseError extends pULIDError {
  constructor(message) {
    super(message);
    this.name = 'pULIDParseError';
  }
}

class pULIDScopeError extends pULIDError {
  constructor(message) {
    super(message);
    this.name = 'pULIDScopeError';
  }
}

class pULIDTimestampError extends pULIDError {
  constructor(message) {
    super(message);
    this.name = 'pULIDTimestampError';
  }
}

class pULIDUUIDError extends pULIDError {
  constructor(message) {
    super(message);
    this.name = 'pULIDUUIDError';
  }
}
```

### Error Scenarios

1. **Invalid string format**: Wrong length, invalid characters in ULID string
2. **Timestamp overflow**: Timestamp exceeds 48-bit limit (year 10889)
3. **Invalid scope**: Scope value outside valid range (1-65534) or using protected scopes (0, 65535)
4. **Invalid byte array**: Wrong length for byte input (must be 16 bytes)
5. **UUID parsing error**: Invalid UUID format when converting from UUID
6. **Scope validation error**: Attempting to use reserved scope values

## Testing Guidelines

### Test Categories

1. **Basic Generation**
   - Generate valid pULIDs
   - Verify string format (26 characters, valid Base32)
   - Verify lexicographic ordering
   - Test with different scopes

2. **Timestamp Handling**
   - Custom timestamp generation (6-byte encoding)
   - Timestamp extraction and validation
   - Future timestamp handling

3. **Scope Management**
   - Valid scope range testing (1-65534)
   - Protected scope rejection (0, 65535)
   - Default scope behavior
   - Scope-based entity type management

4. **UUID Compatibility**
   - pULID to UUID conversion
   - UUID to pULID parsing
   - Format validation for both representations
   - Round-trip conversion accuracy

5. **Parsing and Validation**
   - Valid pULID string parsing
   - Invalid format rejection
   - Case insensitivity
   - Scope extraction from parsed pULIDs

6. **Edge Cases**
   - Maximum timestamp values
   - Invalid scope values
   - Malformed UUID inputs
   - Concurrent generation testing

### Sample Test Structure

```javascript
describe('pULID', () => {
  describe('generation', () => {
    it('should generate valid pULID strings', () => {
      const id = pulid();
      expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    });
    
    it('should be lexicographically sortable', () => {
      const ids = Array.from({length: 100}, () => pulid());
      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
    });
    
    it('should generate with custom scope', () => {
      const id = pulid({ scope: 567 });
      const parsed = pULID.parse(id);
      expect(parsed.getScope()).toBe(567);
    });
  });
  
  describe('scope validation', () => {
    it('should reject protected scopes', () => {
      expect(() => pulid({ scope: 0 })).toThrow(pULIDScopeError);
      expect(() => pulid({ scope: 65535 })).toThrow(pULIDScopeError);
    });
    
    it('should accept valid scope range', () => {
      expect(() => pulid({ scope: 1 })).not.toThrow();
      expect(() => pulid({ scope: 65534 })).not.toThrow();
    });
  });
  
  describe('UUID compatibility', () => {
    it('should convert to UUID format', () => {
      const pulid = pULID.generate({ scope: 567 });
      const uuid = pulid.toUUID();
      expect(uuid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/);
    });
    
    it('should parse from UUID format', () => {
      const original = pULID.generate({ scope: 1000 });
      const uuid = original.toUUID();
      const parsed = pULID.fromUUID(uuid);
      expect(parsed.getScope()).toBe(1000);
      expect(parsed.getTime().getTime()).toBe(original.getTime().getTime());
    });
  });
});
```

## Performance Considerations

### 1. Optimization Strategies

- **Pre-compute encoding tables**: Cache Base32 encoding/decoding maps
- **Reuse generators**: Avoid creating new generator instances
- **Batch generation**: Optimize for generating multiple ULIDs
- **Memory pooling**: Reuse byte arrays where possible

### 2. Browser vs Node.js Considerations

```javascript
// Cross-platform random generation
const getRandomBytes = (() => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment
    return (length) => {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      return bytes;
    };
  } else if (typeof require !== 'undefined') {
    // Node.js environment
    const crypto = require('crypto');
    return (length) => new Uint8Array(crypto.randomBytes(length));
  } else {
    throw new Error('No secure random number generator available');
  }
})();
```

### 3. Memory Usage

- Use `Uint8Array` for byte operations
- Avoid string concatenation in hot paths
- Consider object pooling for high-frequency generation

## Implementation Checklist

- [ ] Base32 encoding/decoding with Crockford's alphabet
- [ ] 48-bit timestamp handling
- [ ] 80-bit cryptographically secure random generation
- [ ] Monotonic random increment logic
- [ ] ULID string parsing and validation
- [ ] Error handling for all edge cases
- [ ] Cross-platform compatibility (Browser/Node.js)
- [ ] Comprehensive test suite
- [ ] Performance optimization
- [ ] TypeScript definitions (if applicable)
- [ ] Documentation and examples

## Example Usage

```javascript
// Basic usage
const id = ulid(); // "01ARZ3NDEKTSV4RRFFQ69G5FAV"

// With custom timestamp
const customId = ulid(1469918176385); // "01ARYZ6S41TSV4RRFFQ69G5FAV"

// Using generator class
const generator = new ULIDGenerator();
const id1 = generator.generate();
const id2 = generator.generate();

// Parsing
const parsed = ULID.parse("01ARZ3NDEKTSV4RRFFQ69G5FAV");
console.log(parsed.getTime()); // Date object

// Validation
console.log(isValid("01ARZ3NDEKTSV4RRFFQ69G5FAV")); // true
console.log(isValid("invalid")); // false
```

This implementation should provide a robust, performant, and specification-compliant ULID library for JavaScript environments.