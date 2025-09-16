const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração da conexão PostgreSQL
const client = new Client({
  connectionString: 'postgresql://postgres.avgoyfartmzepdgzhroc:AYJazUtdYsqKGUrj@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

// Função principal para setup de acesso admin
async function setupAdminAccess() {
  try {
    console.log('🚀 Conectando ao Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    console.log('\n🔄 Executando migration de acesso admin...');

    // Ler e executar a migration de admin
    const migrationPath = path.join(__dirname, '../database/migrations/012_setup_admin_access.sql');

    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await client.query(sql);
      console.log('✅ Migration de acesso admin executada com sucesso!');
    } else {
      console.error('❌ Arquivo de migration não encontrado:', migrationPath);
      process.exit(1);
    }

    // Verificar resultado
    console.log('\n🔍 Verificando assinaturas admin criadas...');

    const adminEmails = ['gouveiarx@gmail.com', 'psitales@gmail.com', 'psitales.sales@gmail.com'];

    for (const email of adminEmails) {
      // Buscar user ID
      const userResult = await client.query(`
        SELECT id, email FROM auth.users WHERE email = $1
      `, [email]);

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        console.log(`\n👤 Admin encontrado: ${email} (${userId})`);

        // Contar assinaturas ativas
        const subsResult = await client.query(`
          SELECT COUNT(*) as count
          FROM user_subscriptions
          WHERE user_id = $1 AND status = 'active'
        `, [userId]);

        console.log(`   📋 Assinaturas ativas: ${subsResult.rows[0].count}`);

        // Mostrar algumas assinaturas como exemplo
        const sampleSubs = await client.query(`
          SELECT us.subscription_type, us.expires_at, a.name
          FROM user_subscriptions us
          JOIN assistants a ON a.id = us.assistant_id
          WHERE us.user_id = $1 AND us.status = 'active'
          ORDER BY a.name
          LIMIT 5
        `, [userId]);

        if (sampleSubs.rows.length > 0) {
          console.log('   🤖 Exemplos de assistentes com acesso:');
          sampleSubs.rows.forEach(sub => {
            console.log(`     - ${sub.name} (${sub.subscription_type}, expira: ${sub.expires_at})`);
          });
        }
      } else {
        console.log(`⚠️  Admin não encontrado no sistema: ${email}`);
      }
    }

    // Verificar total de assistentes ativos
    const totalAssistants = await client.query(`
      SELECT COUNT(*) as count FROM assistants WHERE is_active = true
    `);

    console.log(`\n📊 Total de assistentes ativos: ${totalAssistants.rows[0].count}`);
    console.log('\n🎉 Setup de acesso admin concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao configurar acesso admin:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔐 Conexão fechada.');
  }
}

// Executar setup
setupAdminAccess();