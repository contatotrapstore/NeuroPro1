/**
 * Manual Subscription Activation Script
 * Para ativar assinaturas que não foram processadas pelo webhook
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function activateRecentSubscriptions() {
  console.log('🔧 Manual Subscription Activation Script');

  // Initialize Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase configuration missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Find recent pending subscriptions (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log('🔍 Searching for pending subscriptions created in last 24 hours...');

    const { data: pendingSubscriptions, error: searchError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        users!inner(email, name)
      `)
      .eq('status', 'pending')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false });

    if (searchError) {
      console.error('❌ Error searching subscriptions:', searchError);
      return;
    }

    console.log(`📋 Found ${pendingSubscriptions?.length || 0} pending subscriptions:`);

    if (pendingSubscriptions && pendingSubscriptions.length > 0) {
      pendingSubscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. ID: ${sub.id}`);
        console.log(`   User: ${sub.users.name} (${sub.users.email})`);
        console.log(`   Assistant: ${sub.assistant_id}`);
        console.log(`   Type: ${sub.subscription_type}`);
        console.log(`   Asaas ID: ${sub.asaas_subscription_id}`);
        console.log(`   Created: ${new Date(sub.created_at).toLocaleString('pt-BR')}`);
        console.log(`   Amount: R$ ${sub.amount}`);
        console.log('');
      });

      // Ask for confirmation to activate all
      console.log('🎯 Activating all pending subscriptions...');

      // Calculate expiration dates and activate
      for (const subscription of pendingSubscriptions) {
        const expirationDate = new Date();

        if (subscription.subscription_type === 'monthly') {
          expirationDate.setMonth(expirationDate.getMonth() + 1);
        } else if (subscription.subscription_type === 'semester') {
          expirationDate.setMonth(expirationDate.getMonth() + 6);
        }

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            expires_at: expirationDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`❌ Error activating subscription ${subscription.id}:`, updateError);
        } else {
          console.log(`✅ Activated subscription ${subscription.id} for ${subscription.users.email}`);
          console.log(`   Expires: ${expirationDate.toLocaleDateString('pt-BR')}`);
        }
      }

      // Also check for pending packages
      console.log('\n🔍 Searching for pending packages...');

      const { data: pendingPackages, error: packagesError } = await supabase
        .from('user_packages')
        .select(`
          *,
          users!inner(email, name)
        `)
        .eq('status', 'pending')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      if (pendingPackages && pendingPackages.length > 0) {
        console.log(`📦 Found ${pendingPackages.length} pending packages:`);

        for (const packageItem of pendingPackages) {
          const expirationDate = new Date();

          if (packageItem.subscription_type === 'monthly') {
            expirationDate.setMonth(expirationDate.getMonth() + 1);
          } else if (packageItem.subscription_type === 'semester') {
            expirationDate.setMonth(expirationDate.getMonth() + 6);
          }

          const { error: updatePackageError } = await supabase
            .from('user_packages')
            .update({
              status: 'active',
              expires_at: expirationDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', packageItem.id);

          if (updatePackageError) {
            console.error(`❌ Error activating package ${packageItem.id}:`, updatePackageError);
          } else {
            console.log(`✅ Activated package ${packageItem.id} for ${packageItem.users.email}`);
            console.log(`   Package: ${packageItem.package_type}`);
            console.log(`   Assistants: ${packageItem.assistant_ids?.length || 0}`);
            console.log(`   Expires: ${expirationDate.toLocaleDateString('pt-BR')}`);
          }
        }
      }

      console.log('\n🎉 Manual activation completed!');
      console.log('👤 Users should now have access to their subscribed assistants.');
      console.log('🔄 Please refresh the dashboard to see the changes.');

    } else {
      console.log('✅ No pending subscriptions found.');
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
activateRecentSubscriptions();