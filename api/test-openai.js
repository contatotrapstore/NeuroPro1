const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  console.log('🧪 OpenAI Test Endpoint - Starting comprehensive test');
  
  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      method: req.method,
      steps: {},
      errors: [],
      final_status: 'unknown'
    };

    // Step 1: Check environment variables
    console.log('📋 Step 1: Checking environment variables');
    testResults.steps.env_check = {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'none'
    };

    if (!process.env.OPENAI_API_KEY) {
      testResults.errors.push('OPENAI_API_KEY not configured');
      testResults.final_status = 'error';
      return res.json(testResults);
    }

    // Step 2: Initialize OpenAI client
    console.log('🔧 Step 2: Initializing OpenAI client');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    testResults.steps.client_init = { status: 'success' };

    // Step 3: Test assistant retrieval
    console.log('🤖 Step 3: Testing assistant retrieval');
    const assistantId = 'asst_8kNKRg68rR8zguhYzdlMEvQc'; // PsicoPlano
    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      testResults.steps.assistant_retrieval = {
        status: 'success',
        assistant_name: assistant.name,
        assistant_id: assistant.id
      };
      console.log('✅ Assistant retrieved successfully:', assistant.name);
    } catch (error) {
      testResults.steps.assistant_retrieval = {
        status: 'error',
        error: error.message
      };
      testResults.errors.push(`Assistant retrieval failed: ${error.message}`);
    }

    // Step 4: Create thread
    console.log('🧵 Step 4: Creating thread');
    let threadId;
    try {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      testResults.steps.thread_creation = {
        status: 'success',
        thread_id: threadId
      };
      console.log('✅ Thread created successfully:', threadId);
    } catch (error) {
      testResults.steps.thread_creation = {
        status: 'error',
        error: error.message
      };
      testResults.errors.push(`Thread creation failed: ${error.message}`);
    }

    // Step 5: Add message to thread
    if (threadId) {
      console.log('💬 Step 5: Adding message to thread');
      try {
        const message = await openai.beta.threads.messages.create(threadId, {
          role: 'user',
          content: 'Olá, você pode me ajudar com um plano terapêutico simples?'
        });
        testResults.steps.message_creation = {
          status: 'success',
          message_id: message.id
        };
        console.log('✅ Message added successfully:', message.id);
      } catch (error) {
        testResults.steps.message_creation = {
          status: 'error',
          error: error.message
        };
        testResults.errors.push(`Message creation failed: ${error.message}`);
      }
    }

    // Step 6: Create and wait for run
    if (threadId) {
      console.log('▶️ Step 6: Creating run');
      try {
        const run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: assistantId
        });
        
        testResults.steps.run_creation = {
          status: 'success',
          run_id: run.id,
          initial_status: run.status
        };
        console.log('✅ Run created successfully:', run.id);

        // Step 7: Wait for completion
        console.log('⏳ Step 7: Waiting for run completion (max 60s)');
        let runStatus = run;
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max

        while (runStatus.status === 'running' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
          attempts++;
          
          if (attempts % 10 === 0) {
            console.log(`⏳ Still waiting... attempt ${attempts}/${maxAttempts}, status: ${runStatus.status}`);
          }
        }

        testResults.steps.run_completion = {
          status: runStatus.status,
          attempts: attempts,
          final_status: runStatus.status
        };

        // Step 8: Get response if completed
        if (runStatus.status === 'completed') {
          console.log('📜 Step 8: Getting response messages');
          const messages = await openai.beta.threads.messages.list(threadId);
          const assistantMessage = messages.data.find(msg => msg.role === 'assistant' && msg.run_id === run.id);
          
          if (assistantMessage && assistantMessage.content[0]?.text?.value) {
            testResults.steps.response_retrieval = {
              status: 'success',
              response_length: assistantMessage.content[0].text.value.length,
              response_preview: assistantMessage.content[0].text.value.substring(0, 200) + '...'
            };
            console.log('✅ Response retrieved successfully');
            testResults.final_status = 'success';
          } else {
            testResults.steps.response_retrieval = {
              status: 'error',
              error: 'No assistant message found'
            };
            testResults.errors.push('No assistant message found in response');
            testResults.final_status = 'partial_success';
          }
        } else {
          testResults.errors.push(`Run did not complete successfully. Final status: ${runStatus.status}`);
          testResults.final_status = 'timeout_or_error';
        }

      } catch (error) {
        testResults.steps.run_creation = {
          status: 'error',
          error: error.message
        };
        testResults.errors.push(`Run creation/execution failed: ${error.message}`);
        testResults.final_status = 'error';
      }
    }

    console.log('🏁 Test completed. Final status:', testResults.final_status);
    res.json(testResults);

  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      final_status: 'exception',
      error: error.message,
      stack: error.stack
    });
  }
};