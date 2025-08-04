#!/usr/bin/env node

/**
 * Test Runner for pULID JavaScript Implementation
 * Runs all test files in the ./test directory
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const testDir = './test';
const testFiles = [
  'debug-bytes.test.js',
  'debug-golang-bytes.test.js', 
  'demo.test.js',
  'generate-valid-test-data.test.js',
  'test-golang-examples.test.js',
  'test-golang-set.test.js'
];

console.log('🚀 pULID Test Suite Runner');
console.log('='.repeat(50));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n📋 Running: ${testFile}`);
    console.log('-'.repeat(30));
    
    const testPath = path.join(testDir, testFile);
    const child = spawn('node', [testPath], {
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      totalTests++;
      if (code === 0) {
        passedTests++;
        console.log(`✅ ${testFile} PASSED`);
        results.push({ file: testFile, status: 'PASSED', code });
      } else {
        failedTests++;
        console.log(`❌ ${testFile} FAILED (exit code: ${code})`);
        results.push({ file: testFile, status: 'FAILED', code });
      }
      resolve();
    });
    
    child.on('error', (error) => {
      totalTests++;
      failedTests++;
      console.log(`❌ ${testFile} ERROR: ${error.message}`);
      results.push({ file: testFile, status: 'ERROR', error: error.message });
      resolve();
    });
  });
}

async function runAllTests() {
  // Check if test directory exists
  if (!fs.existsSync(testDir)) {
    console.log(`❌ Test directory ${testDir} does not exist!`);
    process.exit(1);
  }
  
  // Run each test file sequentially
  for (const testFile of testFiles) {
    const testPath = path.join(testDir, testFile);
    
    if (fs.existsSync(testPath)) {
      await runTest(testFile);
    } else {
      console.log(`⚠️  Test file ${testFile} not found, skipping...`);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  results.forEach(({ file, status, code, error }) => {
    const icon = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
    const info = error ? ` (${error})` : code !== undefined ? ` (exit code: ${code})` : '';
    console.log(`${icon} ${file.padEnd(35)} ${status}${info}`);
  });
  
  console.log('\n' + '-'.repeat(50));
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.log('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run all tests
runAllTests().catch(error => {
  console.log('❌ Test runner error:', error.message);
  process.exit(1);
});
