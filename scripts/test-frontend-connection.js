#!/usr/bin/env node

/**
 * Script para testar se o frontend consegue se conectar com o backend
 */

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001';

async function testConnection() {
  console.log('🔍 TESTE DE CONEXÃO FRONTEND <-> BACKEND\n');
  console.log('=' .repeat(50) + '\n');

  const results = [];

  // Teste 1: Frontend está rodando
  console.log('1️⃣ TESTE DO FRONTEND');
  console.log('-'.repeat(40));
  try {
    const response = await fetch(FRONTEND_URL);
    if (response.ok) {
      console.log('✅ Frontend respondendo em http://localhost:5173');
      results.push({ name: 'Frontend', status: 'OK' });
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Frontend não está respondendo:', error.message);
    results.push({ name: 'Frontend', status: 'ERROR', error: error.message });
  }

  console.log();

  // Teste 2: Backend está rodando
  console.log('2️⃣ TESTE DO BACKEND');
  console.log('-'.repeat(40));
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend respondendo:', data.message);
      results.push({ name: 'Backend', status: 'OK' });
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Backend não está respondendo:', error.message);
    results.push({ name: 'Backend', status: 'ERROR', error: error.message });
  }

  console.log();

  // Teste 3: API de assistentes
  console.log('3️⃣ TESTE DA API DE ASSISTENTES');
  console.log('-'.repeat(40));
  try {
    const response = await fetch(`${BACKEND_URL}/api/assistants`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        console.log(`✅ API retornando ${data.data.length} assistentes`);
        console.log(`   📋 Primeiro: ${data.data[0].name}`);
        console.log(`   📋 Último: ${data.data[data.data.length - 1].name}`);
        results.push({ name: 'API Assistentes', status: 'OK' });
      } else {
        throw new Error('API não retornou dados válidos');
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('❌ API de assistentes com erro:', error.message);
    results.push({ name: 'API Assistentes', status: 'ERROR', error: error.message });
  }

  // Resultado Final
  console.log('\n' + '='.repeat(50));
  console.log('🏆 RESULTADO FINAL');
  console.log('='.repeat(50));

  const successCount = results.filter(r => r.status === 'OK').length;
  const totalTests = results.length;

  results.forEach(result => {
    const status = result.status === 'OK' ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });

  console.log(`\n📊 SCORE: ${successCount}/${totalTests} testes passaram`);

  if (successCount === totalTests) {
    console.log('\n🎉 SUCESSO! Frontend e Backend conectados corretamente!');
    console.log('💻 Acesse: http://localhost:5173');
    console.log('📋 Dashboard deve estar funcionando normalmente');
    console.log('🛒 Loja deve estar carregando assistentes');
    console.log('💬 Chat deve estar acessível após login');
  } else {
    console.log('\n⚠️ Alguns problemas encontrados');
    console.log('🔧 Verifique os erros acima');
  }

  console.log('\n' + '='.repeat(50));
}

// Executar teste
if (require.main === module) {
  testConnection().catch(console.error);
}

module.exports = { testConnection };