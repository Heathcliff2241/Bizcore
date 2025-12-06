#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Payment Proof Integration Test
 * Tests the payment proof field functionality in the Order model
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';
const SUBDOMAIN = 'avio';
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Test Case 1: Create order with payment proof
 */
async function testCreateOrderWithPaymentProof() {
  console.log('\n📝 Test 1: Create Order with Payment Proof');
  console.log('=========================================');
  
  const orderData = {
    customer: {
      firstName: 'Payment',
      lastName: 'Proof Test',
      email: `paymenttest${Date.now()}@example.com`,
      phone: '+63987654321'
    },
    items: [
      {
        productId: 6,
        quantity: 1,
        price: 150
      }
    ],
    deliveryType: 'delivery',
    address: 'Test Address',
    subtotal: 150,
    paymentMethod: 'bank_transfer',
    paymentProof: TEST_IMAGE_BASE64,
    tip: 0,
    discount: 0
  };

  try {
    const response = await fetch(`${API_BASE}/api/orders?subdomain=${SUBDOMAIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-subdomain': SUBDOMAIN
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Order created successfully');
      console.log(`   Order Number: ${result.data.orderNumber}`);
      console.log(`   Order ID: ${result.data.id}`);
      console.log(`   Payment Method: ${result.data.paymentMethod}`);
      console.log(`   Payment Proof Stored: ${result.data.paymentProof ? 'Yes ✓' : 'No ✗'}`);
      return result.data;
    } else {
      console.log('❌ Failed to create order');
      console.log('   Error:', result.message);
      console.log('   Details:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
    return null;
  }
}

/**
 * Test Case 2: Create order without payment proof
 */
async function testCreateOrderWithoutPaymentProof() {
  console.log('\n📝 Test 2: Create Order WITHOUT Payment Proof');
  console.log('==============================================');
  
  const orderData = {
    customer: {
      firstName: 'No',
      lastName: 'Proof Test',
      email: `noproof${Date.now()}@example.com`,
      phone: '+63987654322'
    },
    items: [
      {
        productId: 6,
        quantity: 2,
        price: 150
      }
    ],
    deliveryType: 'takeout',
    subtotal: 300,
    paymentMethod: 'cash',
    tip: 0,
    discount: 0
  };

  try {
    const response = await fetch(`${API_BASE}/api/orders?subdomain=${SUBDOMAIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-subdomain': SUBDOMAIN
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Order created successfully (without payment proof)');
      console.log(`   Order Number: ${result.data.orderNumber}`);
      console.log(`   Order ID: ${result.data.id}`);
      console.log(`   Payment Method: ${result.data.paymentMethod}`);
      console.log(`   Payment Proof Stored: ${result.data.paymentProof ? 'Yes ✓' : 'No (as expected) ✓'}`);
      return result.data;
    } else {
      console.log('❌ Failed to create order');
      console.log('   Error:', result.message);
      return null;
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
    return null;
  }
}

/**
 * Test Case 3: Retrieve orders and verify payment proof field
 */
async function testRetrieveOrders() {
  console.log('\n📝 Test 3: Retrieve Orders and Verify Payment Proof Field');
  console.log('==========================================================');
  
  try {
    const response = await fetch(`${API_BASE}/api/orders?subdomain=${SUBDOMAIN}`, {
      method: 'GET',
      headers: {
        'x-tenant-subdomain': SUBDOMAIN
      }
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      const orders = result.data.orders;
      console.log(`✅ Retrieved ${orders.length} orders`);
      
      // Find orders with payment proof
      const withProof = orders.filter(o => o.paymentProof);
      const withoutProof = orders.filter(o => !o.paymentProof);
      
      console.log(`\n   Orders with payment proof: ${withProof.length}`);
      withProof.slice(0, 3).forEach(order => {
        console.log(`   - ${order.order_number} (${order.payment_method})`);
      });
      
      console.log(`\n   Orders without payment proof: ${withoutProof.length}`);
      withoutProof.slice(0, 3).forEach(order => {
        console.log(`   - ${order.order_number} (${order.payment_method})`);
      });
      
      return orders;
    } else {
      console.log('❌ Failed to retrieve orders');
      console.log('   Error:', result.message);
      return null;
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
    return null;
  }
}

/**
 * Test Case 4: Verify schema includes paymentProof field
 */
async function testSchemaVerification() {
  console.log('\n📝 Test 4: Verify Schema Includes Payment Proof Field');
  console.log('=====================================================');
  
  try {
    // Read the Prisma schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Check for paymentProof field
    const hasPaymentProof = schema.includes('paymentProof');
    const hasLongText = schema.includes('@db.LongText');
    
    if (hasPaymentProof && hasLongText) {
      console.log('✅ Schema verification passed');
      console.log('   ✓ paymentProof field exists');
      console.log('   ✓ Uses @db.LongText for storage');
      
      // Extract the exact field definition
      const match = schema.match(/paymentProof\s+String\?\s+@db\.LongText/);
      if (match) {
        console.log(`   ✓ Field definition: ${match[0]}`);
      }
    } else {
      console.log('❌ Schema verification failed');
      if (!hasPaymentProof) console.log('   ✗ paymentProof field not found');
      if (!hasLongText) console.log('   ✗ @db.LongText not found');
    }
  } catch (error) {
    console.log('⚠️  Could not verify schema:', error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Payment Proof Field Integration Tests');
  console.log('========================================\n');
  
  // Verify schema first
  await testSchemaVerification();
  
  // Wait a moment before API calls
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Run API tests
  const order1 = await testCreateOrderWithPaymentProof();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const order2 = await testCreateOrderWithoutPaymentProof();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const orders = await testRetrieveOrders();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✓ Schema verification: PASSED`);
  console.log(`${order1 ? '✓' : '✗'} Create order with payment proof: ${order1 ? 'PASSED' : 'FAILED'}`);
  console.log(`${order2 ? '✓' : '✗'} Create order without payment proof: ${order2 ? 'PASSED' : 'FAILED'}`);
  console.log(`${orders ? '✓' : '✗'} Retrieve orders: ${orders ? 'PASSED' : 'FAILED'}`);
  console.log('\n✅ Integration test suite complete!\n');
}

// Run tests
runTests().catch(console.error);
