const OpenAI = require('openai');
require('dotenv').config({ path: './backend/.env' });

async function testFinalOpenAI() {
  console.log('🤖 Final OpenAI test - extended timeout...');

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const assistantId = 'asst_8kNKRg68rR8zguhYzdlMEvQc';
    
    // Create thread and send message
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Apenas responda "OK" para confirmar que está funcionando.'
    });
    
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });
    
    console.log('✅ Run created:', run.id);
    
    // Extended wait with better status tracking
    let attempts = 0;
    const maxAttempts = 60; // 1 minute
    let runStatus = run;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        attempts++;
        
        console.log(`[${attempts}/${maxAttempts}] Status: ${runStatus.status}`);
        
        if (runStatus.status === 'completed') {
          console.log('✅ Run completed successfully!');
          
          const messages = await openai.beta.threads.messages.list(thread.id);
          const aiResponse = messages.data.find(msg => 
            msg.role === 'assistant' && msg.run_id === run.id
          );
          
          if (aiResponse) {
            const content = aiResponse.content[0]?.text?.value;
            console.log('\n🎉 AI RESPONSE RECEIVED:');
            console.log('─'.repeat(40));
            console.log(content);
            console.log('─'.repeat(40));
            return { success: true, response: content };
          }
          
          return { success: true, response: 'No content in response' };
        }
        
        if (runStatus.status === 'failed' || runStatus.status === 'expired' || runStatus.status === 'cancelled') {
          console.log('❌ Run failed with status:', runStatus.status);
          if (runStatus.last_error) {
            console.log('Error details:', runStatus.last_error);
          }
          return { success: false, error: runStatus.status };
        }
        
        // Show progress for long-running tasks
        if (attempts % 10 === 0) {
          console.log(`⏳ Still waiting... (${attempts}s elapsed)`);
        }
        
      } catch (statusError) {
        console.error('❌ Error checking run status:', statusError.message);
        attempts++;
      }
    }
    
    console.log('❌ Timeout reached, final status:', runStatus.status);
    return { success: false, error: 'timeout' };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

testFinalOpenAI().then(result => {
  console.log('\n🎯 FINAL CONCLUSION:');
  if (result.success) {
    console.log('✅ OpenAI integration is WORKING!');
    console.log('   The problem is NOT with the OpenAI API or configuration.');
    console.log('   Issue must be in the backend authentication, routing, or frontend communication.');
  } else {
    console.log('❌ OpenAI integration has problems:');
    console.log(`   Error: ${result.error}`);
    console.log('   This explains why IAs are not responding in the app.');
  }
});