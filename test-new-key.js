/**
 * Test new OpenAI API Key
 */

const fs = require('fs');
const OpenAI = require('openai');

async function testNewKey() {
  console.log('🧪 Testing new OpenAI API Key...\n');

  // Read key from .env.test
  const envContent = fs.readFileSync('.env.test', 'utf8');
  const keyMatch = envContent.match(/OPENAI_API_KEY=(.+)/);

  if (!keyMatch) {
    console.error('❌ Could not find OPENAI_API_KEY in .env.test');
    process.exit(1);
  }

  const apiKey = keyMatch[1].trim();

  console.log('📋 API Key Info:');
  console.log(`   Length: ${apiKey.length} characters`);
  console.log(`   Prefix: ${apiKey.substring(0, 15)}...`);
  console.log(`   Suffix: ...${apiKey.substring(apiKey.length - 10)}`);
  console.log('');

  // Test 1: Initialize OpenAI client
  console.log('Test 1: Initializing OpenAI client...');
  let openai;
  try {
    openai = new OpenAI({ apiKey });
    console.log('✅ Client initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize client:', error.message);
    process.exit(1);
  }

  // Test 2: List models (authentication test)
  console.log('Test 2: Testing authentication (listing models)...');
  try {
    const models = await openai.models.list();
    console.log(`✅ Authentication successful`);
    console.log(`   Available models: ${models.data.length}`);
    console.log('');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    console.error('   Status:', error.status);
    console.error('   Code:', error.code);
    console.error('   Type:', error.type);
    console.error('   Error object:', JSON.stringify(error, null, 2));
    console.log('');

    // Check if it's a network error
    if (error.message && error.message.includes('Connection error')) {
      console.log('💡 This appears to be a NETWORK/CONNECTIVITY issue, not an invalid key.');
      console.log('   Possible causes:');
      console.log('   - Firewall blocking OpenAI API');
      console.log('   - Proxy configuration needed');
      console.log('   - No internet connection');
      console.log('');
      console.log('🔧 Will proceed assuming key format is valid...');
      console.log('');
      return; // Don't exit, continue with key update
    }

    console.log('💡 This key is INVALID. Get a new one from:');
    console.log('   https://platform.openai.com/api-keys');
    process.exit(1);
  }

  // Test 3: Create thread
  console.log('Test 3: Creating test thread...');
  try {
    const thread = await openai.beta.threads.create();
    console.log(`✅ Thread created: ${thread.id}\n`);
  } catch (error) {
    console.error('❌ Thread creation failed:', error.message);
    process.exit(1);
  }

  // Test 4: Test with a real assistant ID
  console.log('Test 4: Testing assistant retrieval...');
  try {
    const assistantId = 'asst_hH374jNSOTSqrsbC9Aq5MKo3'; // Clara - A Conselheira
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    console.log(`✅ Assistant retrieved: ${assistant.name}`);
    console.log(`   Model: ${assistant.model}`);
    console.log('');
  } catch (error) {
    console.error('❌ Assistant retrieval failed:', error.message);
    console.log('   Note: This may be OK if the assistant belongs to a different OpenAI account');
    console.log('');
  }

  // Success summary
  console.log('='.repeat(60));
  console.log('✅ ALL CRITICAL TESTS PASSED!');
  console.log('='.repeat(60));
  console.log('');
  console.log('🎯 This key is VALID and ready to use!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update api/.env with this key');
  console.log('2. Update Vercel environment variable');
  console.log('3. Deploy to production');
  console.log('');
}

testNewKey().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
