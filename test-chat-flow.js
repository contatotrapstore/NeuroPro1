const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testChatFlow() {
  console.log('🧪 Testing complete chat flow...');
  
  const baseURL = 'http://localhost:3000/api';
  
  // Mock authentication token - in real app this would come from login
  const mockToken = 'mock-test-token'; 
  
  const headers = {
    'Authorization': `Bearer ${mockToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Step 1: Test if we can reach the chat endpoint
    console.log('\n📡 Step 1: Testing chat endpoint availability...');
    
    try {
      const response = await axios.get(`${baseURL}/chat/conversations`, { headers });
      console.log('✅ Chat endpoint reachable');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Chat endpoint reachable (expected auth error)');
      } else {
        console.error('❌ Chat endpoint error:', error.message);
        return;
      }
    }

    // Step 2: Test OpenAI service directly via backend
    console.log('\n🤖 Step 2: Testing OpenAI service directly...');
    
    const { openaiService } = require('./backend/src/services/openai.service');
    
    // Test thread creation
    const threadId = await openaiService.createThread();
    console.log('✅ OpenAI thread created:', threadId);
    
    // Test assistant validation
    const assistantId = 'asst_8kNKRg68rR8zguhYzdlMEvQc'; // PsicoPlano
    const isValidAssistant = await openaiService.validateAssistant(assistantId);
    console.log('✅ Assistant validation:', isValidAssistant);
    
    if (isValidAssistant) {
      // Test sending a message
      console.log('\n💬 Step 3: Testing message sending...');
      const { runId } = await openaiService.sendMessage(
        threadId, 
        assistantId, 
        'Olá! Este é um teste de funcionamento. Você pode responder brevemente?'
      );
      console.log('✅ Message sent, run ID:', runId);
      
      // Wait for completion
      console.log('⏳ Waiting for completion...');
      const completion = await openaiService.waitForCompletion(threadId, runId, 30000);
      console.log('✅ Run completed with status:', completion.status);
      
      if (completion.status === 'completed') {
        // Get the response
        const messages = await openaiService.getThreadMessages(threadId);
        const assistantMessages = messages.filter(msg => msg.role === 'assistant');
        
        if (assistantMessages.length > 0) {
          const response = assistantMessages[0].content[0]?.text?.value;
          console.log('\n🎉 SUCCESS! AI Response received:');
          console.log('─'.repeat(50));
          console.log(response);
          console.log('─'.repeat(50));
        } else {
          console.log('❌ No assistant response found in messages');
        }
      } else {
        console.log('❌ Run did not complete successfully:', completion);
      }
    } else {
      console.log('❌ Assistant validation failed');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testChatFlow();