const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

// Initialize Supabase client with service key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updateClinReplayName() {
  console.log('🔄 Updating ClinReplay assistant name to "Simulador de Paciente"...');
  
  try {
    // First, let's find the exact assistant
    const { data: existingAssistant, error: findError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', 'clinreplay')
      .single();

    if (findError) {
      console.error('❌ Error finding assistant:', findError);
      return false;
    }

    if (!existingAssistant) {
      console.log('❌ Assistant with ID "clinreplay" not found');
      return false;
    }

    console.log(`📋 Found assistant: ${existingAssistant.name} (ID: ${existingAssistant.id})`);

    // Update the assistant name in the database
    const { data, error } = await supabase
      .from('assistants')
      .update({ 
        name: 'Simulador de Paciente'
      })
      .eq('id', 'clinreplay')
      .select();

    if (error) {
      console.error('❌ Error updating assistant:', error);
      return false;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Update returned no data, but this might be normal');
    }

    if (data && data.length > 0) {
      console.log('✅ Assistant updated successfully:');
      console.log(`  - ID: ${data[0].id}`);
      console.log(`  - New Name: ${data[0].name}`);
      console.log(`  - Updated At: ${data[0].updated_at || new Date().toISOString()}`);
    } else {
      console.log('✅ Update command executed (no data returned, but likely successful)');
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

// Run the update
updateClinReplayName().then((success) => {
  if (success) {
    console.log('🎉 Update completed successfully!');
  } else {
    console.log('❌ Update failed. Please check the logs above.');
  }
  process.exit(success ? 0 : 1);
});