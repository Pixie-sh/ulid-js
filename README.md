# pULID JavaScript 

This repository contains comprehensive guidelines for implementing a pULID (Pixie ULID) library in JavaScript, based on patterns from the ulid-go project.

## What is pULID?

pULID is a 128-bit identifier that combines:
- **48-bit timestamp** (6 bytes, millisecond precision)
- **16-bit scope** (2 bytes, for entity types or namespaces)
- **64-bit entropy** (8 bytes, cryptographically secure randomness)

Key features:
- ✅ ULID compatible
- ✅ UUIDv4 compatible
- ✅ Time based with entropy abstraction optimized
- ✅ Scope bytes for storing relevant information (entity types, namespaces)
- ✅ 65,534 available scope types (scope 0 and 65535 are protected)
- ✅ Lexicographically sortable
- ✅ Concurrent call optimized

## Quick Start

The main implementation guidelines are available in [`README-js-guidelines.md`](./README-js-guidelines.md).

### Expected API Usage

```javascript
import { pulid, pULID, pULIDGenerator } from 'your-pulid-library';

// Generate a pULID with default scope (1)
const id = pulid(); // "01JJN0XQ6Y0001N7WGR4NZP1C1Q"

// Generate with custom scope
const userScopeId = pulid({ scope: 567 }); // "01JJN1AD5B08VJ5SRBJAWCBWDQ"

// Generate with custom timestamp and scope
const customId = pulid({ timestamp: 1469918176385, scope: 1000 });

// Parse existing pULID
const parsed = pULID.parse("01JJN0XQ6Y0001N7WGR4NZP1C1Q");
console.log(parsed.getTime()); // Date object
console.log(parsed.getScope()); // 1

// Use generator for advanced control
const generator = new pULIDGenerator({ defaultScope: 567 });
const id1 = generator.generate();
const id2 = generator.generate({ scope: 1000 });

// Convert to UUID format
console.log(parsed.toUUID()); // "0194AA0E-DCDE-0001-53F2-18257F60B037"
```

## Implementation Checklist

Based on the guidelines, your JavaScript pULID implementation should include:

- [ ] **Base32 Encoding/Decoding**
  - Crockford's Base32 alphabet: `0123456789ABCDEFGHJKMNPQRSTVWXYZ`
  - Case-insensitive decoding
  - Efficient encoding/decoding functions for pULID format

- [ ] **Core Classes**
  - `pULID` class with timestamp, scope, and entropy components
  - `pULIDGenerator` class for controlled generation
  - `TimestampGenerator` for 6-byte timestamps
  - `ScopeManager` for scope validation and handling
  - `EntropyGenerator` for 8-byte cryptographically secure entropy

- [ ] **Key Functions**
  - `pulid(options?)` - Main factory function with scope support
  - `pULID.parse(string)` - Parse from ULID string
  - `pULID.fromBytes(bytes)` - Parse from 16-byte array
  - `pULID.fromUUID(uuid)` - Parse from UUID string
  - `isValid(string)` - Validation function
  - `toUUID()` - Convert to UUID format

- [ ] **Scope Management**
  - Scope validation (1-65534, excluding 0 and 65535)
  - Default scope handling
  - Scope-based entity type management
  - Namespace support through scopes

- [ ] **Error Handling**
  - `pULIDError` base class
  - `pULIDParseError` for parsing failures
  - `pULIDScopeError` for invalid scope values
  - `pULIDOverflowError` for entropy overflow

- [ ] **Cross-Platform Support**
  - Browser compatibility (crypto.getRandomValues)
  - Node.js compatibility (crypto.randomBytes)
  - TypeScript definitions (optional)
  - ULID and UUIDv4 compatibility

- [ ] **Testing**
  - Basic generation tests with scope
  - Scope validation tests
  - ULID/UUID compatibility tests
  - Parsing and validation tests
  - Edge case handling (protected scopes)
  - Performance benchmarks

## Key Implementation Details

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

### String Encoding
- **Total length**: 26 characters (ULID compatible)
- **Timestamp**: First 10 characters (6 bytes, 48 bits)
- **Scope**: Characters 11-12 (2 bytes, 16 bits)
- **Entropy**: Last 14 characters (8 bytes, 64 bits)
- **Alphabet**: Crockford's Base32 (excludes I, L, O, U)

### Scope Management
- **Available scopes**: 1-65534 (65,534 total)
- **Protected scopes**: 0 and 65535 (reserved by library)
- **Use cases**: Entity types, namespaces, tenant isolation
- **Default scope**: 1 (when not specified)

### Entropy Behavior
- **Cryptographically secure**: 8 bytes of random data
- **Concurrent optimized**: Allows for concurrent calls
- **No monotonic increment**: Each pULID gets fresh entropy

## Performance Considerations

- Pre-compute Base32 encoding/decoding tables
- Reuse generator instances
- Use `Uint8Array` for byte operations
- Implement object pooling for high-frequency generation
- Optimize for both single and batch generation

## Testing Strategy

The guidelines include comprehensive testing recommendations:

1. **Functional Tests**: Basic pULID generation, parsing, validation
2. **Scope Tests**: Scope validation, protected scope handling, entity type management
3. **Compatibility Tests**: ULID format compatibility, UUID conversion accuracy
4. **Edge Cases**: Maximum timestamps, invalid scopes (0, 65535), malformed inputs
5. **Performance Tests**: Generation speed, memory usage, concurrent generation
6. **Cross-Platform Tests**: Browser and Node.js compatibility

## File Structure

```
your-pulid-library/
├── src/
│   ├── pulid.js          # Main pULID class
│   ├── generator.js      # pULIDGenerator class
│   ├── encoding.js       # Base32 encoding/decoding for pULID
│   ├── entropy.js        # 8-byte entropy generation
│   ├── timestamp.js      # 6-byte timestamp handling
│   ├── scope.js          # Scope management and validation
│   ├── uuid.js           # UUID compatibility functions
│   ├── errors.js         # pULID-specific error classes
│   └── index.js          # Main exports
├── test/
│   ├── pulid.test.js     # Core pULID functionality
│   ├── generator.test.js # Generator tests
│   ├── scope.test.js     # Scope validation tests
│   ├── uuid.test.js      # UUID compatibility tests
│   ├── encoding.test.js  # Base32 encoding tests
│   └── performance.test.js # Benchmarks
├── types/
│   └── index.d.ts        # TypeScript definitions
└── README.md
```

## Resources

- [ULID Specification](https://github.com/ulid/spec)
- [Crockford's Base32](https://www.crockford.com/base32.html)
- [Implementation Guidelines](./ULID_JAVASCRIPT_IMPLEMENTATION_GUIDELINES.md)

## Contributing

When implementing based on these guidelines:

1. Follow the API design patterns outlined in the guidelines
2. Ensure all test categories are covered
3. Maintain cross-platform compatibility
4. Optimize for performance while maintaining correctness
5. Include comprehensive documentation and examples

## License

These guidelines are provided as reference material for implementing ULID in JavaScript. Check the specific license requirements for your implementation.