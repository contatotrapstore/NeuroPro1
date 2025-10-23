/**
 * OpenAI Diagnostics Endpoint
 * Tests OpenAI API connection, key validity, and assistant accessibility
 *
 * Usage: GET /api/debug/openai-test
 * Auth: Requires admin privileges
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { applyCors } = require('../utils/cors');
const { ADMIN_EMAILS } = require('../config/admin');

module.exports = async function handler(req, res) {
  console.log('🔍 OpenAI Diagnostics Test Started');

  // Apply CORS
  const corsHandled = applyCors(req, res);
  if (corsHandled) return;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase configuration missing'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Validate user
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    console.log('👑 Admin user verified:', user.email);

    // Run diagnostics
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        openAIKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 8) + '...' : 'NOT_SET',
        nodeVersion: process.version,
        platform: process.platform
      },
      tests: []
    };

    // Test 1: OpenAI API Key validity
    console.log('🧪 Test 1: Checking OpenAI API Key...');
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder')) {
        diagnostics.tests.push({
          name: 'OpenAI API Key Check',
          status: 'FAILED',
          error: 'API key is missing or contains placeholder',
          severity: 'CRITICAL'
        });
      } else {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Try to list models to verify key works
        const models = await openai.models.list();

        diagnostics.tests.push({
          name: 'OpenAI API Key Check',
          status: 'PASSED',
          message: 'API key is valid and working',
          modelsCount: models.data?.length || 0
        });
      }
    } catch (error) {
      diagnostics.tests.push({
        name: 'OpenAI API Key Check',
        status: 'FAILED',
        error: error.message,
        errorCode: error.code,
        errorType: error.type,
        severity: 'CRITICAL'
      });
    }

    // Test 2: Fetch and validate assistants from database
    console.log('🧪 Test 2: Checking assistants in database...');
    try {
      const { data: assistants, error: assistantsError } = await supabase
        .from('assistants')
        .select('id, name, openai_assistant_id, is_active')
        .eq('is_active', true);

      if (assistantsError) throw assistantsError;

      diagnostics.tests.push({
        name: 'Database Assistants Check',
        status: 'PASSED',
        assistantsCount: assistants.length,
        assistants: assistants.map(a => ({
          id: a.id,
          name: a.name,
          openai_assistant_id: a.openai_assistant_id
        }))
      });

      // Test 3: Verify each assistant exists in OpenAI
      console.log('🧪 Test 3: Verifying assistants in OpenAI...');
      if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const assistantResults = [];

        for (const assistant of assistants) {
          try {
            const openaiAssistant = await openai.beta.assistants.retrieve(assistant.openai_assistant_id);
            assistantResults.push({
              dbId: assistant.id,
              name: assistant.name,
              openaiId: assistant.openai_assistant_id,
              status: 'FOUND',
              openaiName: openaiAssistant.name,
              model: openaiAssistant.model
            });
          } catch (error) {
            assistantResults.push({
              dbId: assistant.id,
              name: assistant.name,
              openaiId: assistant.openai_assistant_id,
              status: 'NOT_FOUND',
              error: error.message,
              errorCode: error.code
            });
          }
        }

        const allFound = assistantResults.every(r => r.status === 'FOUND');
        diagnostics.tests.push({
          name: 'OpenAI Assistants Validation',
          status: allFound ? 'PASSED' : 'FAILED',
          assistants: assistantResults,
          summary: {
            total: assistantResults.length,
            found: assistantResults.filter(r => r.status === 'FOUND').length,
            notFound: assistantResults.filter(r => r.status === 'NOT_FOUND').length
          }
        });
      }
    } catch (error) {
      diagnostics.tests.push({
        name: 'Database Assistants Check',
        status: 'FAILED',
        error: error.message,
        severity: 'HIGH'
      });
    }

    // Test 4: Create test thread
    console.log('🧪 Test 4: Testing thread creation...');
    try {
      if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const thread = await openai.beta.threads.create();

        diagnostics.tests.push({
          name: 'Thread Creation Test',
          status: 'PASSED',
          threadId: thread.id,
          message: 'Successfully created test thread'
        });

        // Clean up: We don't need to delete the thread as OpenAI doesn't charge for threads
      }
    } catch (error) {
      diagnostics.tests.push({
        name: 'Thread Creation Test',
        status: 'FAILED',
        error: error.message,
        errorCode: error.code,
        severity: 'HIGH'
      });
    }

    // Overall status
    const failedTests = diagnostics.tests.filter(t => t.status === 'FAILED');
    const criticalFailures = failedTests.filter(t => t.severity === 'CRITICAL');

    diagnostics.summary = {
      overallStatus: failedTests.length === 0 ? 'HEALTHY' : (criticalFailures.length > 0 ? 'CRITICAL' : 'DEGRADED'),
      totalTests: diagnostics.tests.length,
      passed: diagnostics.tests.filter(t => t.status === 'PASSED').length,
      failed: failedTests.length,
      criticalIssues: criticalFailures.length
    };

    console.log('✅ Diagnostics completed:', diagnostics.summary);

    return res.json({
      success: true,
      diagnostics
    });

  } catch (error) {
    console.error('❌ Diagnostics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Diagnostic test failed',
      details: error.message
    });
  }
};
