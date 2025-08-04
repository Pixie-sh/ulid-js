/**
 * Base32 encoding/decoding using Crockford's Base32 alphabet
 * Alphabet: 0123456789ABCDEFGHJKMNPQRSTVWXYZ (excludes I, L, O, U)
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// Create decoding map for case-insensitive decoding
const DECODING = {};
for (let i = 0; i < ENCODING.length; i++) {
  const char = ENCODING[i];
  DECODING[char] = i;
  DECODING[char.toLowerCase()] = i;
}

// Add common confusable characters
DECODING['I'] = DECODING['i'] = 1; // I -> 1
DECODING['L'] = DECODING['l'] = 1; // L -> 1
DECODING['O'] = DECODING['o'] = 0; // O -> 0
DECODING['U'] = DECODING['u'] = 22; // U -> V (V is at index 22)

/**
 * Encode bytes to Base32 string using Crockford's Base32 (ULID compatible)
 * Based on reference ULID implementation
 */
function encodeBase32(bytes) {
  if (bytes.length === 0) return '';
  
  let result = '';
  let i = 0;
  
  while (i < bytes.length) {
    let byte1 = bytes[i++] || 0;
    let byte2 = bytes[i++] || 0;
    let byte3 = bytes[i++] || 0;
    let byte4 = bytes[i++] || 0;
    let byte5 = bytes[i++] || 0;
    
    result += ENCODING[byte1 >>> 3];
    result += ENCODING[((byte1 & 7) << 2) | (byte2 >>> 6)];
    result += ENCODING[(byte2 >>> 1) & 31];
    result += ENCODING[((byte2 & 1) << 4) | (byte3 >>> 4)];
    result += ENCODING[((byte3 & 15) << 1) | (byte4 >>> 7)];
    result += ENCODING[(byte4 >>> 2) & 31];
    result += ENCODING[((byte4 & 3) << 3) | (byte5 >>> 5)];
    result += ENCODING[byte5 & 31];
  }
  
  // Calculate expected length for the given byte count
  const expectedLength = Math.ceil(bytes.length * 8 / 5);
  return result.substring(0, expectedLength);
}

/**
 * Decode Base32 string to bytes using Crockford's Base32 (ULID compatible)
 * Matches the encoding algorithm - processes 8 chars to produce 5 bytes
 */
function decodeBase32(str) {
  if (str.length === 0) return new Uint8Array(0);
  
  // Convert to uppercase for consistency
  str = str.toUpperCase();
  
  // Validate all characters first
  for (let i = 0; i < str.length; i++) {
    if (!(str[i] in DECODING)) {
      throw new Error(`Invalid character in Base32 string: ${str[i]}`);
    }
  }
  
  const bytes = [];
  let i = 0;
  
  // Process 8 characters at a time to produce 5 bytes
  while (i < str.length) {
    const chars = [];
    for (let j = 0; j < 8 && i + j < str.length; j++) {
      chars.push(DECODING[str[i + j]]);
    }
    
    // Pad with zeros if needed
    while (chars.length < 8) {
      chars.push(0);
    }
    
    // Convert 8 base32 values to 5 bytes
    const byte1 = (chars[0] << 3) | (chars[1] >>> 2);
    const byte2 = ((chars[1] & 3) << 6) | (chars[2] << 1) | (chars[3] >>> 4);
    const byte3 = ((chars[3] & 15) << 4) | (chars[4] >>> 1);
    const byte4 = ((chars[4] & 1) << 7) | (chars[5] << 2) | (chars[6] >>> 3);
    const byte5 = ((chars[6] & 7) << 5) | chars[7];
    
    bytes.push(byte1, byte2, byte3, byte4, byte5);
    i += 8;
  }
  
  // Calculate expected byte length and trim excess
  const expectedByteLength = Math.floor(str.length * 5 / 8);
  return new Uint8Array(bytes.slice(0, expectedByteLength));
}

/**
 * Encode timestamp (6 bytes) to Base32 string (10 characters)
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Base32 encoded timestamp
 */
function encodeTimestamp(timestamp) {
  const bytes = new Uint8Array(6);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = timestamp & 0xff;
    timestamp = Math.floor(timestamp / 256);
  }
  return encodeBase32(bytes);
}

/**
 * Decode timestamp from Base32 string
 * @param {string} encoded - Base32 encoded timestamp (first 10 chars)
 * @returns {number} Unix timestamp in milliseconds
 */
function decodeTimestamp(encoded) {
  const bytes = decodeBase32(encoded.substring(0, 10));
  let timestamp = 0;
  for (let i = 0; i < 6; i++) {
    timestamp = timestamp * 256 + bytes[i];
  }
  return timestamp;
}

/**
 * Encode scope (2 bytes) to Base32 string
 * @param {number} scope - Scope value (1-65534)
 * @returns {string} Base32 encoded scope
 */
function encodeScope(scope) {
  const bytes = new Uint8Array([
    (scope >> 8) & 0xff,
    scope & 0xff
  ]);
  return encodeBase32(bytes);
}

/**
 * Decode scope from Base32 string
 * @param {string} encoded - Full pULID string
 * @returns {number} Scope value
 */
function decodeScope(encoded) {
  // Extract scope portion (characters 10-11, but we need to handle variable length)
  // For pULID, we need to decode the middle 2 bytes after timestamp
  const fullBytes = decodeBase32(encoded);
  if (fullBytes.length < 8) {
    throw new Error('Invalid pULID: too short');
  }
  return (fullBytes[6] << 8) | fullBytes[7];
}

/**
 * Encode entropy (8 bytes) to Base32 string
 * @param {Uint8Array} entropyBytes - 8 bytes of entropy
 * @returns {string} Base32 encoded entropy
 */
function encodeEntropy(entropyBytes) {
  return encodeBase32(entropyBytes);
}

/**
 * Decode entropy from Base32 string
 * @param {string} encoded - Full pULID string
 * @returns {Uint8Array} 8 bytes of entropy
 */
function decodeEntropy(encoded) {
  const fullBytes = decodeBase32(encoded);
  if (fullBytes.length < 16) {
    throw new Error('Invalid pULID: too short');
  }
  return fullBytes.slice(8, 16);
}

module.exports = {
  ENCODING,
  DECODING,
  encodeBase32,
  decodeBase32,
  encodeTimestamp,
  decodeTimestamp,
  encodeScope,
  decodeScope,
  encodeEntropy,
  decodeEntropy
};