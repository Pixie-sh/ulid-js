#!/usr/bin/env node

/**
 * Generate valid test data with consistent ULID/UUID pairs
 * This will create proper test data where ULID and UUID actually correspond
 */

const { pulid, pULID, parse, forEntity } = require('../src');

console.log('🔧 Generating Valid pULID Test Data');
console.log('='.repeat(50));

// Entity types with their scopes (from the original test data)
const entities = [
  { entity: 'Scope-200', scope: 200 },
  { entity: 'Scope-201', scope: 201 },
  { entity: 'Scope-203', scope: 203 },
  { entity: 'Scope-204', scope: 204 },
  { entity: 'Scope-205', scope: 205 },
  { entity: 'Scope-206', scope: 206 },
  { entity: 'Scope-100', scope: 100 },
  { entity: 'Scope-101', scope: 101 },
  { entity: 'Scope-102', scope: 102 },
  { entity: 'Scope-103', scope: 103 },
  { entity: 'Scope-104', scope: 104 },
  { entity: 'Scope-300', scope: 300 },
  { entity: 'Scope-400', scope: 400 },
  { entity: 'Scope-401', scope: 401 },
  { entity: 'Scope-500', scope: 500 },
  { entity: 'Scope-501', scope: 501 },
  { entity: 'Scope-502', scope: 502 },
  { entity: 'Scope-550', scope: 550 },
  { entity: 'Scope-600', scope: 600 },
  { entity: 'Scope-601', scope: 601 },
  { entity: 'Scope-105', scope: 105 },
  { entity: 'Scope-650', scope: 650 },
  { entity: 'Scope-651', scope: 651 },
  { entity: 'Scope-652', scope: 652 },
  { entity: 'Scope-654', scope: 654 },
  { entity: 'Scope-655', scope: 655 },
  { entity: 'Scope-656', scope: 656 }
];

// Use a fixed timestamp so all generated pULIDs have the same timestamp
const fixedTimestamp = Date.now();
const fixedDate = new Date(fixedTimestamp);

console.log(`Using fixed timestamp: ${fixedTimestamp} (${fixedDate.toISOString()})`);
console.log('\nGenerating valid test data:');
console.log('Entity               | ULID                           | UUID                                 | Scope');
console.log('---------------------|--------------------------------|--------------------------------------|-------');

const validTestData = [];

entities.forEach(({ entity, scope }) => {
  // Generate pULID with fixed timestamp and entity scope
  const generated = pulid({ timestamp: fixedTimestamp, scope });
  const parsed = parse(generated);
  const uuid = parsed.toUUID();
  
  // Verify the data is consistent
  const fromUuid = pULID.fromUUID(uuid);
  const roundTripUlid = fromUuid.toString();
  const roundTripMatch = roundTripUlid === generated;
  
  if (!roundTripMatch) {
    console.log(`❌ Round-trip failed for ${entity}!`);
    return;
  }
  
  // Add to valid test data
  validTestData.push({
    entity,
    ulid: generated,
    uuid,
    scope
  });
  
  const entityPadded = entity.padEnd(20);
  const ulidPadded = generated.padEnd(30);
  const uuidPadded = uuid.padEnd(36);
  
  console.log(`${entityPadded} | ${ulidPadded} | ${uuidPadded} | ${scope} scope`);
});

console.log(`\n✅ Generated ${validTestData.length} valid test entries`);

// Test the generated data
console.log('\n🧪 Testing Generated Data:');
let testsPassed = 0;
let testsFailed = 0;

validTestData.forEach(({ entity, ulid, uuid, scope }) => {
  try {
    // Parse ULID
    const parsed = parse(ulid);
    
    // Check scope
    const scopeMatch = parsed.getScope() === scope;
    
    // Check UUID conversion
    const convertedUuid = parsed.toUUID();
    const uuidMatch = convertedUuid === uuid;
    
    // Test round-trip
    const fromUuid = pULID.fromUUID(uuid);
    const roundTripMatch = fromUuid.toString() === ulid;
    
    if (scopeMatch && uuidMatch && roundTripMatch) {
      testsPassed++;
    } else {
      console.log(`❌ ${entity}: scope=${scopeMatch}, uuid=${uuidMatch}, roundtrip=${roundTripMatch}`);
      testsFailed++;
    }
    
  } catch (error) {
    console.log(`❌ ${entity}: ${error.message}`);
    testsFailed++;
  }
});

console.log(`\nTest Results: ${testsPassed} passed, ${testsFailed} failed`);

if (testsFailed === 0) {
  console.log('🎉 All generated test data is valid!');
  
  // Output the test data in the format expected by test-runner.js
  console.log('\n📋 Test Data for test-runner.js:');
  console.log('const golangTestData = [');
  validTestData.forEach(({ entity, ulid, uuid, scope }, index) => {
    const comma = index < validTestData.length - 1 ? ',' : '';
    console.log(`  { entity: '${entity}', ulid: '${ulid}', uuid: '${uuid}', scope: ${scope} }${comma}`);
  });
  console.log('];');
  
} else {
  console.log('❌ Some generated test data is invalid - this indicates a bug in our implementation');
}