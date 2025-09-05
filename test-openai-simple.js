const OpenAI = require('openai');
require('dotenv').config({ path: './backend/.env' });

async function testOpenAIFlow() {
  console.log('🤖 Testing complete OpenAI chat flow...');

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    // Test assistant availability
    const assistantId = 'asst_8kNKRg68rR8zguhYzdlMEvQc'; // PsicoPlano
    console.log('\n1. Testing assistant...');
    
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    console.log('✅ Assistant found:', assistant.name);
    console.log('   Model:', assistant.model);
    
    // Create thread
    console.log('\n2. Creating thread...');
    const thread = await openai.beta.threads.create();
    console.log('✅ Thread created:', thread.id);
    
    // Send message
    console.log('\n3. Sending message...');
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Olá! Este é um teste rápido. Você pode me responder brevemente confirmando que está funcionando? Seja conciso.'
    });
    console.log('✅ Message added to thread');
    
    // Create run
    console.log('\n4. Creating run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });
    console.log('✅ Run created:', run.id, 'Status:', run.status);
    
    // Wait for completion
    console.log('\n5. Waiting for completion...');
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    
    while (runStatus.status === 'running' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      
      console.log(`   Attempt ${attempts}: ${runStatus.status}`);
      
      if (attempts > 30) {
        console.log('❌ Timeout waiting for completion');
        return;
      }
    }
    
    console.log('✅ Run completed with status:', runStatus.status);
    
    if (runStatus.status === 'completed') {
      // Get messages
      console.log('\n6. Getting response...');
      const messages = await openai.beta.threads.messages.list(thread.id);
      
      const assistantMessages = messages.data.filter(msg => 
        msg.role === 'assistant' && msg.run_id === run.id
      );
      
      if (assistantMessages.length > 0) {
        const response = assistantMessages[0].content[0]?.text?.value;
        
        console.log('\n🎉 SUCCESS! AI is working correctly!');
        console.log('═'.repeat(60));
        console.log('AI Response:');
        console.log(response);
        console.log('═'.repeat(60));
        
        return true;
      } else {
        console.log('❌ No assistant response found');
        return false;
      }
    } else {
      console.log('❌ Run failed with status:', runStatus.status);
      if (runStatus.last_error) {
        console.log('Error:', runStatus.last_error);
      }
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    return false;
  }
}

testOpenAIFlow().then(success => {
  if (success) {
    console.log('\n🎯 CONCLUSION: OpenAI integration is working perfectly!');
    console.log('   The issue with IAs not responding is likely in the authentication or routing layer.');
  } else {
    console.log('\n❌ CONCLUSION: OpenAI integration has issues that need fixing.');
  }
});