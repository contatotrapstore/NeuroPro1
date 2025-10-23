/**
 * OpenAI Configuration Test Script
 *
 * This script tests the OpenAI API key configuration locally
 * to help diagnose "Assistente temporariamente indisponível" errors
 *
 * Usage:
 *   1. Set OPENAI_API_KEY environment variable
 *   2. Run: node scripts/test-openai-config.js
 */

require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAIConfiguration() {
  console.log('='.repeat(60));
  console.log('🧪 OpenAI Configuration Test');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Check if API key is set
  console.log('📋 Test 1: Environment Variable Check');
  console.log('-'.repeat(60));

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ FAILED: OPENAI_API_KEY is not set');
    console.log('');
    console.log('💡 Solution:');
    console.log('   1. Create a .env file in the project root');
    console.log('   2. Add: OPENAI_API_KEY=sk-proj-your-key-here');
    console.log('   3. Or set it in Vercel: vercel env add OPENAI_API_KEY');
    process.exit(1);
  }

  if (apiKey.includes('placeholder') || apiKey === 'your-key-here') {
    console.error('❌ FAILED: OPENAI_API_KEY contains placeholder value');
    console.log('');
    console.log('💡 Solution:');
    console.log('   Replace placeholder with real OpenAI API key from:');
    console.log('   https://platform.openai.com/api-keys');
    process.exit(1);
  }

  console.log('✅ PASSED: OPENAI_API_KEY is set');
  console.log(`   Length: ${apiKey.length} characters`);
  console.log(`   Prefix: ${apiKey.substring(0, 15)}...`);
  console.log('');

  // Test 2: Validate API key format
  console.log('📋 Test 2: API Key Format Check');
  console.log('-'.repeat(60));

  if (!apiKey.startsWith('sk-')) {
    console.warn('⚠️  WARNING: API key does not start with "sk-"');
    console.log('   This may be an invalid key format');
  } else {
    console.log('✅ PASSED: API key format looks correct');
  }
  console.log('');

  // Test 3: Test OpenAI API connection
  console.log('📋 Test 3: OpenAI API Connection Test');
  console.log('-'.repeat(60));

  try {
    const openai = new OpenAI({ apiKey });
    console.log('🔌 Connecting to OpenAI API...');

    const models = await openai.models.list();
    console.log(`✅ PASSED: Successfully connected to OpenAI`);
    console.log(`   Available models: ${models.data.length}`);
    console.log('');
  } catch (error) {
    console.error('❌ FAILED: Could not connect to OpenAI API');
    console.error(`   Error: ${error.message}`);
    console.error(`   Type: ${error.type || 'unknown'}`);
    console.error(`   Code: ${error.code || 'unknown'}`);
    console.log('');
    console.log('💡 Possible causes:');
    console.log('   1. API key is invalid or expired');
    console.log('   2. OpenAI account has no billing/credits');
    console.log('   3. Network connectivity issues');
    console.log('   4. OpenAI service is down: https://status.openai.com');
    console.log('');
    console.log('🔧 Solutions:');
    console.log('   1. Generate new API key: https://platform.openai.com/api-keys');
    console.log('   2. Check billing: https://platform.openai.com/account/billing');
    console.log('   3. Verify account status: https://platform.openai.com/account');
    process.exit(1);
  }

  // Test 4: Test thread creation
  console.log('📋 Test 4: Thread Creation Test');
  console.log('-'.repeat(60));

  try {
    const openai = new OpenAI({ apiKey });
    console.log('🔨 Creating test thread...');

    const thread = await openai.beta.threads.create();
    console.log(`✅ PASSED: Thread created successfully`);
    console.log(`   Thread ID: ${thread.id}`);
    console.log('');
  } catch (error) {
    console.error('❌ FAILED: Could not create thread');
    console.error(`   Error: ${error.message}`);
    console.error(`   Type: ${error.type || 'unknown'}`);
    console.error(`   Code: ${error.code || 'unknown'}`);
    console.log('');
    console.log('💡 This may indicate:');
    console.log('   1. Rate limiting issues');
    console.log('   2. Quota exceeded');
    console.log('   3. API access restrictions');
    process.exit(1);
  }

  // Test 5: Test assistant retrieval (requires assistant ID)
  console.log('📋 Test 5: Assistant Retrieval Test');
  console.log('-'.repeat(60));
  console.log('ℹ️  SKIPPED: Requires assistant ID from database');
  console.log('   Use the diagnostic endpoint instead:');
  console.log('   GET /api/debug/openai-test');
  console.log('');

  // Final summary
  console.log('='.repeat(60));
  console.log('✅ All basic tests passed!');
  console.log('='.repeat(60));
  console.log('');
  console.log('🎯 Next steps:');
  console.log('   1. Verify this key is set in Vercel:');
  console.log('      vercel env ls');
  console.log('');
  console.log('   2. If key is not in Vercel, add it:');
  console.log('      vercel env add OPENAI_API_KEY production');
  console.log('');
  console.log('   3. Redeploy after adding the key:');
  console.log('      vercel --prod');
  console.log('');
  console.log('   4. Test the live endpoint:');
  console.log('      GET https://neuroai-lab.vercel.app/api/debug/openai-test');
  console.log('');
}

// Run the tests
testOpenAIConfiguration().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
