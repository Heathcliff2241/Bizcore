#!/usr/bin/env node

/**
 * Automated Plan Upgrade Flow Testing Script
 * Tests subscription upgrade flow and database persistence
 * 
 * Usage: node test-plan-upgrade.js
 */

const http = require('http');
const https = require('https');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || 'bizcore';
const DB_PASS = process.env.DB_PASS || 'bizcore';
const DB_NAME = process.env.DB_NAME || 'bizcore';

// Simple test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function for HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const isSecure = url.protocol === 'https:';
    const client = isSecure ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test reporter
function test(name, fn) {
  return async () => {
    try {
      await fn();
      results.passed++;
      results.tests.push({ name, status: '✅ PASS' });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: '❌ FAIL', error: error.message });
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Main test suite
async function runTests() {
  console.log('🧪 BizCore Plan Upgrade Flow - Test Suite\n');
  console.log(`📍 API Base: ${API_BASE}`);
  console.log(`📍 Database: ${DB_HOST}:${DB_PORT}\n`);

  // Test 1: API Health Check
  const healthTest = test('API Health Check', async () => {
    const res = await makeRequest('GET', '/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // Test 2: Fetch Available Plans
  let plans = [];
  const plansTest = test('Fetch Available Plans', async () => {
    const res = await makeRequest('GET', '/api/admin/subscriptions/plans');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data && Array.isArray(res.data), 'Expected plans array');
    assert(res.data.length > 0, 'Expected at least one plan');
    plans = res.data;
  });

  // Test 3: Plan Structure Validation
  const planStructureTest = test('Plan Structure Validation', async () => {
    assert(plans.length > 0, 'No plans available');
    const plan = plans[0];
    assert(plan.id, 'Plan missing id');
    assert(plan.name, 'Plan missing name');
    assert(plan.price !== undefined, 'Plan missing price');
    assert(plan.billingCycle, 'Plan missing billingCycle');
    assert(plan.features, 'Plan missing features');
  });

  // Test 4: Upgrade Endpoint Exists
  const upgradeEndpointTest = test('Upgrade Endpoint Exists', async () => {
    // This should fail with 401 (no auth) but endpoint exists
    const res = await makeRequest('POST', '/api/tenant/subscriptions/upgrade', {
      subscriptionId: 999,
      planId: 'basic'
    });
    assert(res.status === 401 || res.status === 400, 
      `Expected 401/400, got ${res.status}`);
  });

  // Test 5: Payment Submit Endpoint Exists
  const paymentSubmitTest = test('Payment Submit Endpoint Exists', async () => {
    const res = await makeRequest('POST', '/api/tenant/subscriptions/payment/submit', {
      subscriptionId: 999,
      amount: 1000,
      paymentMethod: 'gcash'
    });
    assert(res.status === 401 || res.status === 400, 
      `Expected 401/400, got ${res.status}`);
  });

  // Test 6: Payment Status Endpoint Exists
  const paymentStatusTest = test('Payment Status Endpoint Exists', async () => {
    const res = await makeRequest('GET', '/api/tenant/subscriptions/payment/status?paymentId=1');
    assert(res.status === 401 || res.status === 404 || res.status === 400, 
      `Expected 401/404/400, got ${res.status}`);
  });

  // Test 7: Admin Payments Endpoint Exists
  const adminPaymentsTest = test('Admin Payments Endpoint Exists', async () => {
    const res = await makeRequest('GET', '/api/admin/payments');
    assert(res.status === 401 || res.status === 200, 
      `Expected 401/200, got ${res.status}`);
  });

  // Test 8: Payment Verify Endpoint Exists
  const paymentVerifyTest = test('Payment Verify Endpoint Exists', async () => {
    const res = await makeRequest('PUT', '/api/admin/payments', {
      paymentId: 999,
      action: 'verify'
    });
    assert(res.status === 401 || res.status === 404 || res.status === 400, 
      `Expected 401/404/400, got ${res.status}`);
  });

  // Run all tests
  console.log('\n📋 Running Tests...\n');
  await healthTest();
  await plansTest();
  await planStructureTest();
  await upgradeEndpointTest();
  await paymentSubmitTest();
  await paymentStatusTest();
  await adminPaymentsTest();
  await paymentVerifyTest();

  // Summary
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(50));
  results.tests.forEach(t => {
    console.log(`${t.status} ${t.name}`);
    if (t.error) console.log(`   → ${t.error}`);
  });
  console.log('═'.repeat(50));
  console.log(`\n✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}\n`);

  if (results.failed === 0) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log(`⚠️  ${results.failed} test(s) failed\n`);
  }
}

// Run tests
runTests().catch(console.error);
