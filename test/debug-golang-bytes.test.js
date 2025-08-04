const { decodeBase32, encodeBase32 } = require('../src/encoding');

// Test with golang README examples
const golangExamples = [
  {
    name: 'Scope 567 - Example 1',
    ulid: '01JJN1AD5B08VJ5SRBJAWCBWDQ', 
    uuid: '0194AA15-34AB-0237-22E7-0B92B8C5F1B7',
    expectedScope: 567
  },
  {
    name: 'MaxScope 65535 - Example 1',
    ulid: '01JJN0XQ6YZZZN7WGR4NZP1C1Q',
    uuid: '0194AA0E-DCDE-FFFF-53F2-18257F60B037',
    expectedScope: 65535
  }
];

console.log('Debugging pULID byte structure with golang README examples:');
console.log('='.repeat(60));

golangExamples.forEach(({ name, ulid, uuid, expectedScope }) => {
  console.log(`\n${name}:`);
  console.log('ULID:', ulid);
  console.log('Expected UUID:', uuid);
  console.log('Expected scope:', expectedScope);

  // Decode the ULID
  const bytes = decodeBase32(ulid);
  console.log('\nDecoded bytes:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
  console.log('Byte count:', bytes.length);

  // Expected UUID bytes (from hex)
  const expectedUuidHex = uuid.replace(/-/g, '');
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

  // Extract scope from our decoded bytes (bytes 6-7)
  if (bytes.length >= 8) {
    const decodedScope = (bytes[6] << 8) | bytes[7];
    console.log('Scope from decoded bytes (6-7):', decodedScope);
  }

  // Check if our decoding matches expected
  if (bytes.length === expectedBytes.length) {
    console.log('\nByte-by-byte comparison:');
    for (let i = 0; i < Math.min(bytes.length, expectedBytes.length); i++) {
      const match = bytes[i] === expectedBytes[i] ? '✓' : '✗';
      console.log(`Byte ${i}: decoded=${bytes[i].toString(16).padStart(2, '0')} expected=${expectedBytes[i].toString(16).padStart(2, '0')} ${match}`);
    }
  } else {
    console.log('\nLength mismatch!');
    console.log('Decoded length:', bytes.length);
    console.log('Expected length:', expectedBytes.length);
  }

  // Test reverse encoding - encode expected bytes to see what ULID we get
  const encodedFromExpected = encodeBase32(new Uint8Array(expectedBytes));
  console.log('\nReverse encoding test:');
  console.log('Expected bytes encoded to ULID:', encodedFromExpected);
  console.log('Original golang ULID:          ', ulid);
  console.log('Match:', encodedFromExpected === ulid ? '✓' : '✗');
});

// Test our encoding/decoding round-trip
console.log('\n' + '='.repeat(60));
console.log('Round-trip encoding/decoding test:');
const testBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
const encoded = encodeBase32(testBytes);
const decoded = decodeBase32(encoded);
console.log('Test bytes:', Array.from(testBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Encoded:', encoded);
console.log('Decoded:', Array.from(decoded).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Round-trip match:', testBytes.every((b, i) => b === decoded[i]) ? '✓' : '✗');