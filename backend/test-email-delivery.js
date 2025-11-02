// Test script for email delivery with verified domain
// Run this with: node test-email-delivery.js

const { sendVerificationEmail } = require('./lib/emailService');
require('dotenv').config();

async function testEmailDelivery() {
  console.log('🧪 Testing Email Delivery with Verified Domain');
  console.log('================================================');
  
  // Check environment
  console.log('\n📋 Environment Check:');
  console.log('✓ RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
  console.log('✓ FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
  
  // Test email
  const testEmail = 'letsdoitdotcom@gmail.com'; // Your email for testing
  const testName = 'Paulo Test';
  const testToken = 'test_' + Math.random().toString(36).substring(2, 15);
  
  console.log('\n📧 Sending Test Email...');
  console.log('To:', testEmail);
  console.log('From Domain: lumartrust.com (verified)');
  
  try {
    const result = await sendVerificationEmail(testEmail, testName, testToken);
    
    if (result.success) {
      console.log('\n✅ SUCCESS!');
      console.log('Message ID:', result.messageId);
      console.log('Service Used:', result.service);
      console.log('🎉 Your verified domain is working perfectly!');
      console.log('\n📱 Check your email inbox for the verification message');
    } else {
      console.log('\n❌ FAILED');
      console.log('Error:', result.error);
      console.log('Service:', result.service);
    }
  } catch (error) {
    console.error('\n💥 EXCEPTION:', error.message);
  }
}

testEmailDelivery();