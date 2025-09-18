const { decodeBase32 } = require('../src/encoding');

// Let's examine the first golang pULID to understand the byte structure
const testUlid = '01K1JSNY9T034AXHKS1ZCFSQGS';
const expectedUuid = '0198659a-f93a-00c8-aec6-790fd8fcde19';
const expectedScope = 200;

console.log('Debugging pULID byte structure:');
console.log('ULID:', testUlid);
console.log('Expected UUID:', expectedUuid);
console.log('Expected scope:', expectedScope);

// Decode the ULID
const bytes = decodeBase32(testUlid);
console.log('\nDecoded bytes:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Byte count:', bytes.length);

// Expected UUID bytes (from hex)
const expectedUuidHex = expectedUuid.replace(/-/g, '');
const expectedBytes = [];
for (let i = 0; i < expectedUuidHex.length; i += 2) {
  expectedBytes.push(parseInt(expectedUuidHex.substr(i, 2), 16));
}
console.log('Expected bytes:', expectedBytes.map(b => b.toString(16).padStart(2, '0')).join(' '));

// Compare
console.log('\nComparison:');
console.log('Decoded: ', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Expected:', expectedBytes.map(b => b.toString(16).padStart(2, '0')).join(' '));

// Extract scope from expected bytes (bytes 6-7)
const expectedScopeFromBytes = (expectedBytes[6] << 8) | expectedBytes[7];
console.log('\nScope from expected bytes (6-7):', expectedScopeFromBytes);
console.log('Expected scope:', expectedScope);

// Let's also check if the scope is encoded differently
console.log('\nScope 200 in hex:', (200).toString(16));
console.log('Scope 200 as bytes:', [(200 >> 8) & 0xff, 200 & 0xff].map(b => b.toString(16).padStart(2, '0')).join(' '));

// Check if our decoding matches expected
if (bytes.length === expectedBytes.length) {
  console.log('\nByte-by-byte comparison:');
  for (let i = 0; i < bytes.length; i++) {
    const match = bytes[i] === expectedBytes[i] ? '✓' : '✗';
    console.log(`Byte ${i}: decoded=${bytes[i].toString(16).padStart(2, '0')} expected=${expectedBytes[i].toString(16).padStart(2, '0')} ${match}`);
  }
} else {
  console.log('\nLength mismatch!');
}

// Test reverse encoding - encode expected bytes to see what ULID we get
const { encodeBase32 } = require('../src/encoding');
const encodedFromExpected = encodeBase32(new Uint8Array(expectedBytes));
console.log('\nReverse encoding test:');
console.log('Expected bytes encoded to ULID:', encodedFromExpected);
console.log('Original golang ULID:          ', testUlid);
console.log('Match:', encodedFromExpected === testUlid ? '✓' : '✗');

// Let's also try a simple test with known values (16-byte array)
console.log('\nSimple test with known values:');
const testBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
const encoded = encodeBase32(testBytes);
const decoded = decodeBase32(encoded);
console.log('Test bytes:', Array.from(testBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Encoded:', encoded);
console.log('Decoded:', Array.from(decoded).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Round-trip match:', testBytes.every((b, i) => b === decoded[i]) ? '✓' : '✗');
