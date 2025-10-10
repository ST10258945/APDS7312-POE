#!/usr/bin/env node

/**
 * Generate a secure JWT secret for the APDS7311 Task 2 project
 * 
 * Usage:
 *   node generate-jwt-secret.js
 * 
 * This will generate a 64-byte cryptographically secure random string
 * encoded as base64 for use as JWT_SECRET in your .env file.
 */

const crypto = require('crypto');

console.log('🔐 Generating secure JWT secret for APDS7311 Task 2...\n');

// Generate 64 bytes of cryptographically secure random data
const secret = crypto.randomBytes(64).toString('base64');

console.log('Generated JWT Secret:');
console.log('─'.repeat(80));
console.log(secret);
console.log('─'.repeat(80));

console.log('\n📋 To use this secret:');
console.log('1. Copy the generated secret above');
console.log('2. Open your .env file');
console.log('3. Replace the JWT_SECRET value with the new secret:');
console.log(`   JWT_SECRET="${secret}"`);

console.log('\n✅ This secret is cryptographically secure and suitable for production use.');
console.log('🔒 Keep this secret confidential and never commit it to version control.');

console.log('\n🎯 Your GlobeWire backend is ready for secure JWT signing!');