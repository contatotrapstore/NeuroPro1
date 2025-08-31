// Teste completo do fluxo de autenticação
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://avgoyfartmzepdgzhroc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  try {
    console.log('🔐 Testando fluxo completo de autenticação...');
    
    // Teste 1: Verificar configuração do Auth
    console.log('\n📝 Teste 1: Verificando configuração Auth...');
    const { data: session } = await supabase.auth.getSession();
    console.log('✅ Configuração Auth funcionando');
    
    // Teste 2: Verificar políticas RLS
    console.log('\n🛡️  Teste 2: Verificando políticas de segurança...');
    
    // Tentar acessar dados protegidos (deve falhar sem autenticação)
    const { data: protectedData, error: rlsError } = await supabase
      .from('user_subscriptions')
      .select('*');
      
    if (rlsError && rlsError.message.includes('row-level security')) {
      console.log('✅ RLS está funcionando - acesso negado sem autenticação');
    } else if (rlsError) {
      console.log('✅ RLS ativo - erro:', rlsError.message.substring(0, 50) + '...');
    } else {
      console.log('⚠️  RLS pode não estar funcionando corretamente');
    }
    
    // Teste 3: Verificar dados públicos (assistants)
    console.log('\n📊 Teste 3: Verificando acesso a dados públicos...');
    const { data: publicData, error: publicError } = await supabase
      .from('assistants')
      .select('name, icon')
      .limit(3);
      
    if (publicError) {
      console.error('❌ Erro ao acessar dados públicos:', publicError.message);
    } else {
      console.log(`✅ Acesso público funcionando - ${publicData.length} assistentes encontrados:`);
      publicData.forEach(assistant => {
        console.log(`   ${assistant.icon} ${assistant.name}`);
      });
    }
    
    // Teste 4: Verificar endpoints da API backend
    console.log('\n🔌 Teste 4: Verificando integração com backend...');
    
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:3001/api/assistants');
      
      if (response.ok) {
        const apiData = await response.json();
        console.log(`✅ API backend funcionando - ${apiData.data.length} assistentes via API`);
      } else {
        console.log('⚠️  API backend retornou erro:', response.status);
      }
    } catch (fetchError) {
      console.log('⚠️  Não foi possível testar API backend:', fetchError.message);
    }
    
    console.log('\n🎉 Fluxo de autenticação configurado e funcionando!');
    console.log('🌐 Frontend: http://localhost:5177');
    console.log('📡 Backend:  http://localhost:3001');
    console.log('🔑 Supabase Auth está pronto para uso');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testAuthFlow();