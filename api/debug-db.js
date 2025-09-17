/**
 * Debug Database Schema - Check user_subscriptions table
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log('🔍 Debug Database Schema');

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: 'Supabase configuration missing',
        debug: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check if table exists and get structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(1);

    if (tableError) {
      return res.status(500).json({
        error: 'Error accessing user_subscriptions table',
        tableError: {
          code: tableError.code,
          message: tableError.message,
          details: tableError.details,
          hint: tableError.hint
        }
      });
    }

    // 2. Get sample data to understand structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(3);

    // 3. Check assistants table
    const { data: assistantsData, error: assistantsError } = await supabase
      .from('assistants')
      .select('id, name')
      .limit(5);

    // 4. Try to get a valid user_id from auth
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    return res.status(200).json({
      success: true,
      debug: {
        userSubscriptionsTable: {
          exists: !tableError,
          sampleCount: sampleData?.length || 0,
          sampleData: sampleData || [],
          structure: tableInfo ? Object.keys(tableInfo[0] || {}) : []
        },
        assistantsTable: {
          exists: !assistantsError,
          count: assistantsData?.length || 0,
          sampleAssistants: assistantsData || []
        },
        users: {
          exists: !usersError,
          count: usersData?.users?.length || 0,
          sampleUsers: usersData?.users?.slice(0, 2)?.map(u => ({
            id: u.id,
            email: u.email
          })) || []
        },
        errors: {
          table: tableError,
          sample: sampleError,
          assistants: assistantsError,
          users: usersError
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};