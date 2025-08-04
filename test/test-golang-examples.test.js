#!/usr/bin/env node

/**
 * Test our implementation against the proper golang README examples
 */

const { parse, pULID } = require('../src');

console.log('Testing against proper golang README examples:');
console.log('='.repeat(50));

// Examples from golang README
const golangExamples = [
  {
    name: 'MaxScope 65535 - Example 1',
    ulid: '01JJN0XQ6YZZZN7WGR4NZP1C1Q',
    uuid: '0194AA0E-DCDE-FFFF-53F2-18257F60B037',
    expectedScope: 65535,
    timestamp: '2025-01-27T23:18:08.350Z'
  },
  {
    name: 'MaxScope 65535 - Example 2', 
    ulid: '01JJN1CJKQZZZMJDTN8Z2QJ6NQ',
    uuid: '0194AA16-4A77-FFFF-4937-5547C5791AB7',
    expectedScope: 65535,
    timestamp: '2025-01-27T23:26:15.159Z'
  },
  {
    name: 'Scope 567 - Example 1',
    ulid: '01JJN1AD5B08VJ5SRBJAWCBWDQ', 
    uuid: '0194AA15-34AB-0237-22E7-0B92B8C5F1B7',
    expectedScope: 567,
    timestamp: '2025-01-27T23:25:04.043Z'
  },
  {
    name: 'Scope 567 - Example 2',
    ulid: '01JJN1CJKQ08VM5AAPPTMCQWZZ',
    uuid: '0194AA16-4A77-0237-42A9-56B6A8CBF3FF', 
    expectedScope: 567,
    timestamp: '2025-01-27T23:26:15.159Z'
  }
];

let passCount = 0;
let failCount = 0;

golangExamples.forEach(({ name, ulid, uuid, expectedScope, timestamp }) => {
  console.log(`\nTesting: ${name}`);
  console.log(`ULID: ${ulid}`);
  console.log(`UUID: ${uuid}`);
  
  try {
    // Test parsing ULID
    const parsed = parse(ulid);
    const extractedScope = parsed.getScope();
    const convertedUuid = parsed.toUUID().toLowerCase();
    const parsedTimestamp = parsed.getTime().toISOString();
    
    console.log(`Extracted scope: ${extractedScope} (expected: ${expectedScope})`);
    console.log(`Converted UUID: ${convertedUuid}`);
    console.log(`Expected UUID:  ${uuid.toLowerCase()}`);
    console.log(`Parsed timestamp: ${parsedTimestamp}`);
    console.log(`Expected timestamp: ${timestamp}`);
    
    // Check scope
    const scopeMatch = extractedScope === expectedScope;
    console.log(`Scope match: ${scopeMatch ? '✅' : '❌'}`);
    
    // Check UUID conversion
    const uuidMatch = convertedUuid === uuid.toLowerCase();
    console.log(`UUID match: ${uuidMatch ? '✅' : '❌'}`);
    
    // Test round-trip from UUID
    const fromUuid = pULID.fromUUID(uuid);
    const roundTripUlid = fromUuid.toString();
    const roundTripMatch = roundTripUlid === ulid;
    console.log(`Round-trip ULID: ${roundTripUlid}`);
    console.log(`Round-trip match: ${roundTripMatch ? '✅' : '❌'}`);
    
    if (scopeMatch && uuidMatch && roundTripMatch) {
      console.log(`✅ ${name} PASSED`);
      passCount++;
    } else {
      console.log(`❌ ${name} FAILED`);
      failCount++;
    }
    
  } catch (error) {
    console.log(`❌ ${name} ERROR: ${error.message}`);
    failCount++;
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Test Results: ${passCount} passed, ${failCount} failed`);

if (failCount === 0) {
  console.log('🎉 All golang README examples work correctly!');
} else {
  console.log('❌ Some tests failed - need to investigate further');
}