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

// Função para executar uma migração
async function runMigration(filePath) {
  try {
    console.log(`🔄 Executando migração: ${path.basename(filePath)}`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    
    console.log(`✅ Migração concluída: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Erro na migração ${path.basename(filePath)}:`, error.message);
    throw error;
  }
}

// Função principal
async function runAllMigrations() {
  try {
    console.log('🚀 Conectando ao Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Listar arquivos de migração em ordem
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = [
      '001_create_assistants_table.sql',
      '002_create_user_packages_table.sql', 
      '003_create_user_subscriptions_table.sql',
      '004_create_conversations_table.sql',
      '005_create_messages_table.sql'
    ];
    
    console.log(`\n📋 Executando ${migrationFiles.length} migrações...\n`);
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        await runMigration(filePath);
      } else {
        console.warn(`⚠️  Arquivo não encontrado: ${file}`);
      }
    }
    
    console.log('\n🎉 Todas as migrações foram executadas com sucesso!');
    
    // Verificar tabelas criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📊 Tabelas no banco:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar assistentes inseridos
    const assistantsResult = await client.query('SELECT COUNT(*) as count FROM public.assistants');
    console.log(`\n🤖 Total de assistentes: ${assistantsResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔐 Conexão fechada.');
  }
}

// Executar migrações
runAllMigrations();