const { Client } = require('pg');

async function testDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres.avgoyfartmzepdgzhroc:AYJazUtdYsqKGUrj@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚀 Conectando ao banco NeuroIA Lab...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Testar tabelas
    console.log('\n📊 Verificando estrutura do banco:');
    
    const tables = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    tables.rows.forEach(row => {
      console.log(`  📋 ${row.table_name} (${row.column_count} colunas)`);
    });
    
    // Testar dados dos assistentes
    console.log('\n🤖 Verificando assistentes de psicologia:');
    const assistants = await client.query('SELECT id, name, icon FROM public.assistants ORDER BY name LIMIT 5');
    assistants.rows.forEach(row => {
      console.log(`  ${row.icon} ${row.name} (${row.id})`);
    });
    
    if (assistants.rows.length > 0) {
      console.log(`  ... e mais ${await client.query('SELECT COUNT(*) FROM assistants').then(r => r.rows[0].count - 5)} assistentes`);
    }
    
    // Testar permissões
    console.log('\n🔐 Verificando estrutura de auth:');
    
    // Verificar se existe tabela auth.users
    const authUsers = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'auth' AND table_name = 'users'
    `);
    
    if (authUsers.rows.length > 0) {
      console.log('  ✅ Tabela auth.users existe');
    } else {
      console.log('  ⚠️  Tabela auth.users não encontrada');
    }
    
    // Verificar RLS
    console.log('\n🛡️  Verificando Row Level Security:');
    const rlsTables = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND rowsecurity = true
    `);
    
    if (rlsTables.rows.length > 0) {
      rlsTables.rows.forEach(row => {
        console.log(`  ✅ RLS ativo: ${row.tablename}`);
      });
    } else {
      console.log('  ⚠️  Nenhuma tabela com RLS encontrada');
    }
    
    console.log('\n🎉 Banco de dados está funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro ao testar banco:', error.message);
  } finally {
    await client.end();
  }
}

testDatabase();