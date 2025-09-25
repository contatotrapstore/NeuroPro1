/**
 * Simple test endpoint to verify institution data access
 */
module.exports = async function handler(req, res) {
  console.log('🧪 Institution Test API');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase configuration',
        debug: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test query without the problematic settings column
    const { data: institution, error } = await supabase
      .from('institutions')
      .select('id, name, slug, logo_url, primary_color, secondary_color, is_active, custom_message')
      .eq('slug', 'abpsi')
      .eq('is_active', true)
      .single();

    console.log('🏛️ Test query result:', { institution, error });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Database query failed',
        details: error.message
      });
    }

    if (!institution) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Institution found successfully!',
      data: {
        institution: {
          ...institution,
          welcome_message: institution.custom_message || `Bem-vindo à ${institution.name}`
        }
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};