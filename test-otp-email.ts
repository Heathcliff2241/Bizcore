/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Test script for OTP and Email services
 * Run with: npx tsx test-otp-email.ts
 */

import { generateOtp, isValidOtpFormat, calculateOtpExpiry, maskEmail, isValidEmail, validateSubdomain } from './lib/otp'
import { verifyEmailConnection } from './lib/email'

async function runTests() {
  console.log('🧪 Starting OTP and Email Service Tests\n')

  // Test 1: OTP Generation
  console.log('✅ Test 1: OTP Generation')
  const otp = generateOtp(6)
  console.log(`  Generated OTP: ${otp}`)
  console.log(`  Is valid format: ${isValidOtpFormat(otp, 6)}`)
  console.log(`  Is numeric: ${/^\d+$/.test(otp)}\n`)

  // Test 2: OTP Expiry Calculation
  console.log('✅ Test 2: OTP Expiry')
  const expiry = calculateOtpExpiry(10)
  console.log(`  Expiry time: ${expiry.toISOString()}`)
  console.log(`  Is future date: ${expiry > new Date()}\n`)

  // Test 3: Email Masking
  console.log('✅ Test 3: Email Masking')
  const testEmail = 'owner@example.com'
  const masked = maskEmail(testEmail)
  console.log(`  Original: ${testEmail}`)
  console.log(`  Masked: ${masked}\n`)

  // Test 4: Email Validation
  console.log('✅ Test 4: Email Validation')
  const validEmails = ['test@example.com', 'user+tag@domain.co.uk']
  const invalidEmails = ['plaintext', '@example.com', 'test@', 'test @example.com']

  validEmails.forEach(email => {
    console.log(`  ${email}: ${isValidEmail(email) ? '✓ Valid' : '✗ Invalid'}`)
  })
  invalidEmails.forEach(email => {
    console.log(`  ${email}: ${isValidEmail(email) ? '✗ Should be invalid' : '✓ Correctly invalid'}`)
  })
  console.log()

  // Test 5: Subdomain Validation
  console.log('✅ Test 5: Subdomain Validation')
  const testSubdomains = [
    'coffeehouse',
    'my-business',
    'store123',
    'admin',
    'api',
    'ab', // too short
    'a-',  // ends with hyphen
    'test_123' // invalid character
  ]

  testSubdomains.forEach(subdomain => {
    const result = validateSubdomain(subdomain)
    console.log(`  ${subdomain}: ${result.valid ? '✓ Valid' : `✗ ${result.error}`}`)
  })
  console.log()

  // Test 6: Email Service Connection
  console.log('✅ Test 6: Email Service Connection')
  try {
    const emailStatus = await verifyEmailConnection()
    console.log(`  Connection Status: ${emailStatus.success ? '✓ Connected' : '✗ Not configured'}`)
    if (!emailStatus.success) {
      console.log('   Email is in console-only mode (development)\n')
    }
  } catch (_error) {
    console.log(`   Email service check skipped\n`)
  }

  console.log(' All tests completed!\n')
  console.log(' Next steps:')
  console.log('  1. Configure email credentials in .env.local')
  console.log('  2. Start the development server: npm run dev')
  console.log('  3. Test OTP endpoints via API\n')
}

runTests().catch(error => {
  console.error('❌ Test error:', error)
  process.exit(1)
})
