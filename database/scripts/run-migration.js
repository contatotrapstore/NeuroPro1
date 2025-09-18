const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Conectar diretamente ao PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.avgoyfartmzepdgzhroc:SN2bfdiLqCMqQ00wmydkZK9a6iEmOEy4Po4kWWN8nDO1Dfri0eKgG94V3d7pXu4aMokmvqgzK%2FLUmVdv48wyGA%3D%3D@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'
});

async function runMigration(migrationFile) {
  try {
    console.log(`🔄 Executando migração: ${migrationFile}`);
    
    // Conectar ao banco
    await client.connect();
    
    // Ler o arquivo SQL
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar a migração
    await client.query(sql);
    
    console.log(`✅ Migração ${migrationFile} executada com sucesso!`);
    
  } catch (error) {
    console.error(`❌ Erro na migração ${migrationFile}:`, error);
  } finally {
    await client.end();
  }
}

// Verificar se foi passado um arquivo específico
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Por favor, especifique o arquivo de migração');
  console.log('Exemplo: node run-migration.js 006_setup_rls_policies.sql');
  process.exit(1);
}

runMigration(migrationFile);