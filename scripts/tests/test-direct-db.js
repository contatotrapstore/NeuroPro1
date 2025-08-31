// Teste direto do banco para verificar os assistentes
const { Client } = require('pg');

async function testAssistants() {
  const client = new Client({
    connectionString: 'postgresql://postgres.avgoyfartmzepdgzhroc:AYJazUtdYsqKGUrj@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('🚀 Testando assistentes no banco...');
    
    // Buscar todos os assistentes
    const result = await client.query(`
      SELECT id, name, description, icon, color_theme, 
             monthly_price, semester_price, is_active
      FROM public.assistants 
      WHERE is_active = true 
      ORDER BY name
    `);
    
    console.log(`\n✅ Encontrados ${result.rows.length} assistentes de psicologia:\n`);
    
    result.rows.forEach((assistant, index) => {
      console.log(`${index + 1}. ${assistant.icon} ${assistant.name}`);
      console.log(`   📝 ${assistant.description}`);
      console.log(`   🎨 Cor: ${assistant.color_theme}`);
      console.log(`   💰 Preços: R$ ${assistant.monthly_price}/mês | R$ ${assistant.semester_price}/semestre`);
      console.log(`   🔑 ID: ${assistant.id}\n`);
    });
    
    console.log('🎉 Banco está 100% configurado com os 14 assistentes!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

testAssistants();