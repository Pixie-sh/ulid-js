/**
 * Base32 encoding/decoding using Crockford's Base32 alphabet for pULID
 * Alphabet: 0123456789ABCDEFGHJKMNPQRSTVWXYZ (excludes I, L, O, U)
 * 
 * This implementation exactly matches the Go implementation in ulid-go
 * for compatibility and correct round-trip conversion
 */

// The encoding table from the Go implementation (globals.go)
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// Create a lookup table for decoding, similar to the c2b32 table in Go
// The table maps each character code to its value (0-31) or 0xFF for invalid characters
const C2B32 = new Array(256).fill(0xFF); // Initialize all as invalid

// Fill in valid character mappings (exactly as in Go implementation)
for (let i = 0; i < ENCODING.length; i++) {
  const charCode = ENCODING.charCodeAt(i);
  C2B32[charCode] = i;
  
  // Also map lowercase version
  C2B32[String.fromCharCode(charCode).toLowerCase().charCodeAt(0)] = i;
}

// Special character mappings for Crockford's Base32
C2B32['I'.charCodeAt(0)] = C2B32['i'.charCodeAt(0)] = 1;  // I -> 1
C2B32['L'.charCodeAt(0)] = C2B32['l'.charCodeAt(0)] = 1;  // L -> 1
C2B32['O'.charCodeAt(0)] = C2B32['o'.charCodeAt(0)] = 0;  // O -> 0
C2B32['U'.charCodeAt(0)] = C2B32['u'.charCodeAt(0)] = 22; // U -> V (at index 22)

/**
 * Encode a 16-byte ULID to a 26-character Base32 string
 * This is a direct port of the Go implementation's MarshalText method
 * @param {Uint8Array} id - 16-byte array to encode
 * @returns {string} 26-character Base32 encoded string
 */
function encodeBase32(id) {
  if (!id || id.length !== 16) {
    throw new Error(`Invalid ULID bytes: expected 16 bytes, got ${id ? id.length : 0}`);
  }
  
  // Create a buffer for the encoded string (26 characters)
  const dst = new Array(26);
  
  // Encode timestamp part (bytes 0-5)
  dst[0] = ENCODING.charAt((id[0] & 224) >> 5);
  dst[1] = ENCODING.charAt(id[0] & 31);
  dst[2] = ENCODING.charAt((id[1] & 248) >> 3);
  dst[3] = ENCODING.charAt(((id[1] & 7) << 2) | ((id[2] & 192) >> 6));
  dst[4] = ENCODING.charAt((id[2] & 62) >> 1);
  dst[5] = ENCODING.charAt(((id[2] & 1) << 4) | ((id[3] & 240) >> 4));
  dst[6] = ENCODING.charAt(((id[3] & 15) << 1) | ((id[4] & 128) >> 7));
  dst[7] = ENCODING.charAt((id[4] & 124) >> 2);
  dst[8] = ENCODING.charAt(((id[4] & 3) << 3) | ((id[5] & 224) >> 5));
  dst[9] = ENCODING.charAt(id[5] & 31);
  
  // Encode entropy part (bytes 6-15)
  dst[10] = ENCODING.charAt((id[6] & 248) >> 3);
  dst[11] = ENCODING.charAt(((id[6] & 7) << 2) | ((id[7] & 192) >> 6));
  dst[12] = ENCODING.charAt((id[7] & 62) >> 1);
  dst[13] = ENCODING.charAt(((id[7] & 1) << 4) | ((id[8] & 240) >> 4));
  dst[14] = ENCODING.charAt(((id[8] & 15) << 1) | ((id[9] & 128) >> 7));
  dst[15] = ENCODING.charAt((id[9] & 124) >> 2);
  dst[16] = ENCODING.charAt(((id[9] & 3) << 3) | ((id[10] & 224) >> 5));
  dst[17] = ENCODING.charAt(id[10] & 31);
  dst[18] = ENCODING.charAt((id[11] & 248) >> 3);
  dst[19] = ENCODING.charAt(((id[11] & 7) << 2) | ((id[12] & 192) >> 6));
  dst[20] = ENCODING.charAt((id[12] & 62) >> 1);
  dst[21] = ENCODING.charAt(((id[12] & 1) << 4) | ((id[13] & 240) >> 4));
  dst[22] = ENCODING.charAt(((id[13] & 15) << 1) | ((id[14] & 128) >> 7));
  dst[23] = ENCODING.charAt((id[14] & 124) >> 2);
  dst[24] = ENCODING.charAt(((id[14] & 3) << 3) | ((id[15] & 224) >> 5));
  dst[25] = ENCODING.charAt(id[15] & 31);
  
  return dst.join('');
}

/**
 * Decode a 26-character Base32 string to a 16-byte ULID
 * This is a direct port of the Go implementation's UnmarshalText method
 * @param {string} str - 26-character Base32 encoded string
 * @returns {Uint8Array} 16-byte array
 */
function decodeBase32(str) {
  if (typeof str !== 'string') {
    throw new Error(`Invalid input type: ${typeof str}. Expected string`);
  }
  
  if (str.length !== 26) {
    throw new Error(`Invalid ULID length: ${str.length}. Expected 26 characters`);
  }
  
  // Validate each character
  for (let i = 0; i < 26; i++) {
    if (C2B32[str.charCodeAt(i)] === 0xFF) {
      throw new Error(`Invalid character in ULID: ${str[i]}`);
    }
  }
  
  // Check for timestamp overflow - first character must be <= '7'
  if (str.charCodeAt(0) > '7'.charCodeAt(0)) {
    throw new Error(`Timestamp overflow: first character '${str[0]}' > 7`);
  }
  
  // Create a buffer for the decoded bytes
  const id = new Uint8Array(16);
  
  // Decode timestamp part (first 10 characters -> bytes 0-5)
  id[0] = (C2B32[str.charCodeAt(0)] << 5) | C2B32[str.charCodeAt(1)];
  id[1] = (C2B32[str.charCodeAt(2)] << 3) | (C2B32[str.charCodeAt(3)] >> 2);
  id[2] = (C2B32[str.charCodeAt(3)] << 6) | (C2B32[str.charCodeAt(4)] << 1) | (C2B32[str.charCodeAt(5)] >> 4);
  id[3] = (C2B32[str.charCodeAt(5)] << 4) | (C2B32[str.charCodeAt(6)] >> 1);
  id[4] = (C2B32[str.charCodeAt(6)] << 7) | (C2B32[str.charCodeAt(7)] << 2) | (C2B32[str.charCodeAt(8)] >> 3);
  id[5] = (C2B32[str.charCodeAt(8)] << 5) | C2B32[str.charCodeAt(9)];
  
  // Decode entropy part (last 16 characters -> bytes 6-15)
  id[6] = (C2B32[str.charCodeAt(10)] << 3) | (C2B32[str.charCodeAt(11)] >> 2);
  id[7] = (C2B32[str.charCodeAt(11)] << 6) | (C2B32[str.charCodeAt(12)] << 1) | (C2B32[str.charCodeAt(13)] >> 4);
  id[8] = (C2B32[str.charCodeAt(13)] << 4) | (C2B32[str.charCodeAt(14)] >> 1);
  id[9] = (C2B32[str.charCodeAt(14)] << 7) | (C2B32[str.charCodeAt(15)] << 2) | (C2B32[str.charCodeAt(16)] >> 3);
  id[10] = (C2B32[str.charCodeAt(16)] << 5) | C2B32[str.charCodeAt(17)];
  id[11] = (C2B32[str.charCodeAt(18)] << 3) | (C2B32[str.charCodeAt(19)] >> 2);
  id[12] = (C2B32[str.charCodeAt(19)] << 6) | (C2B32[str.charCodeAt(20)] << 1) | (C2B32[str.charCodeAt(21)] >> 4);
  id[13] = (C2B32[str.charCodeAt(21)] << 4) | (C2B32[str.charCodeAt(22)] >> 1);
  id[14] = (C2B32[str.charCodeAt(22)] << 7) | (C2B32[str.charCodeAt(23)] << 2) | (C2B32[str.charCodeAt(24)] >> 3);
  id[15] = (C2B32[str.charCodeAt(24)] << 5) | C2B32[str.charCodeAt(25)];
  
  return id;
}

/**
 * Extract timestamp from ULID bytes
 * @param {Uint8Array} bytes - 16-byte ULID
 * @returns {number} Timestamp in milliseconds
 */
function bytesToTimestamp(bytes) {
  // Extract timestamp from first 6 bytes (big-endian)
  // Using proper JavaScript arithmetic to avoid integer overflow
  let timestamp = 0;
  for (let i = 0; i < 6; i++) {
    timestamp = timestamp * 256 + bytes[i];
  }
  return timestamp;
}

/**
 * Extract scope from ULID bytes (bytes 6-7)
 * @param {Uint8Array} bytes - 16-byte ULID
 * @returns {number} Scope value
 */
function bytesToScope(bytes) {
  return (bytes[6] << 8) | bytes[7];
}

/**
 * Extract entropy from ULID bytes (bytes 8-15)
 * @param {Uint8Array} bytes - 16-byte ULID
 * @returns {Uint8Array} 8-byte entropy
 */
function bytesToEntropy(bytes) {
  return bytes.slice(8, 16);
}

module.exports = {
  ENCODING,
  C2B32,
  encodeBase32,
  decodeBase32,
  bytesToTimestamp,
  bytesToScope,
  bytesToEntropy
};
