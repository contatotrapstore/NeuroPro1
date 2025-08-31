// Teste de autenticação do Supabase com chaves reais
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://avgoyfartmzepdgzhroc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseAuth() {
  try {
    console.log('🚀 Testando autenticação Supabase...');
    
    // Teste 1: Verificar conexão com API
    console.log('\n📡 Testando conexão com API Supabase...');
    const { data: tables, error: tablesError } = await supabase
      .from('assistants')
      .select('count')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ Erro na conexão:', tablesError.message);
    } else {
      console.log('✅ Conexão com API funcionando');
    }
    
    // Teste 2: Listar assistentes via Supabase Client
    console.log('\n🤖 Testando consulta aos assistentes...');
    const { data: assistants, error: assistantsError } = await supabase
      .from('assistants')
      .select('id, name, icon')
      .eq('is_active', true)
      .limit(5);
    
    if (assistantsError) {
      console.error('❌ Erro ao buscar assistentes:', assistantsError.message);
    } else {
      console.log(`✅ Encontrados ${assistants.length} assistentes:`);
      assistants.forEach(assistant => {
        console.log(`   ${assistant.icon} ${assistant.name}`);
      });
    }
    
    // Teste 3: Testar sistema de autenticação (sem criar usuário)
    console.log('\n🔐 Testando sistema de autenticação...');
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (authError && authError.message.includes('session')) {
      console.log('✅ Sistema de autenticação está funcionando (nenhum usuário logado)');
    } else if (authError) {
      console.error('❌ Erro no sistema de auth:', authError.message);
    } else {
      console.log('✅ Usuário logado:', authUser.user.email);
    }
    
    console.log('\n🎉 Testes do Supabase concluídos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testSupabaseAuth();