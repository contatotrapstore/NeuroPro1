const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  try {
    // Load environment variables
    require('dotenv').config();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    console.log('🚀 Connecting to Supabase...');

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/013_fix_admin_update_permissions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Applying migration 013: Fix Admin Update Permissions...');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration 013 applied successfully!');
    console.log('✅ Admin users can now update assistants and upload icons');

  } catch (error) {
    console.error('💥 Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();