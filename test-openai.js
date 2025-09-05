const OpenAI = require('openai');
require('dotenv').config({ path: './backend/.env' });

async function testOpenAI() {
  console.log('🔍 Testing OpenAI configuration...');
  console.log('API Key:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'NOT FOUND');
  console.log('Organization:', process.env.OPENAI_ORGANIZATION || 'NOT SET');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION
    });

    // Test 1: List models (basic API connectivity)
    console.log('\n📡 Testing API connectivity...');
    const models = await openai.models.list();
    console.log('✅ API connection successful');
    console.log(`Found ${models.data.length} models available`);

    // Test 2: Try to retrieve a specific assistant (using first one from our list)
    console.log('\n🤖 Testing assistant retrieval...');
    const assistantId = 'asst_8kNKRg68rR8zguhYzdlMEvQc'; // PsicoPlano
    
    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log('✅ Assistant retrieval successful');
      console.log(`Assistant: ${assistant.name} (${assistant.id})`);
      console.log(`Model: ${assistant.model}`);
    } catch (assistantError) {
      console.error('❌ Assistant retrieval failed:', assistantError.message);
    }

    // Test 3: Create a thread
    console.log('\n💬 Testing thread creation...');
    try {
      const thread = await openai.beta.threads.create();
      console.log('✅ Thread creation successful');
      console.log(`Thread ID: ${thread.id}`);

      // Test 4: Send a message and create a run
      console.log('\n📝 Testing message sending...');
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: 'Olá, este é um teste de conexão.'
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId
      });

      console.log('✅ Message sent and run created');
      console.log(`Run ID: ${run.id}, Status: ${run.status}`);

      // Wait briefly and check run status
      setTimeout(async () => {
        try {
          const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
          console.log(`Run status after delay: ${runStatus.status}`);
        } catch (runError) {
          console.error('❌ Run status check failed:', runError.message);
        }
      }, 2000);

    } catch (threadError) {
      console.error('❌ Thread/message test failed:', threadError.message);
    }

  } catch (error) {
    console.error('❌ OpenAI API test failed:', error.message);
    if (error.status) {
      console.error(`Status: ${error.status}`);
    }
    if (error.code) {
      console.error(`Code: ${error.code}`);
    }
  }
}

testOpenAI();