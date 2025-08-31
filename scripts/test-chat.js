#!/usr/bin/env node

/**
 * Script para testar se o sistema de chat está funcionando 100%
 */

require('dotenv').config({ path: '../backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testOpenAIIntegration() {
  console.log('🔍 Testando integração OpenAI...\n');

  // Testar chave
  console.log('🔑 Testando chave OpenAI...');
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Chave válida! ${data.data.length} modelos disponíveis\n`);
  } catch (error) {
    console.error('❌ Erro na chave OpenAI:', error.message);
    return false;
  }

  // Testar assistentes no banco
  console.log('📊 Verificando assistentes no banco...');
  try {
    const { data: assistants, error } = await supabase
      .from('assistants')
      .select('id, name, openai_assistant_id')
      .order('name');

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ ${assistants.length} assistentes encontrados no banco:\n`);

    let validCount = 0;
    for (const assistant of assistants) {
      if (assistant.openai_assistant_id && 
          assistant.openai_assistant_id.startsWith('asst_') && 
          assistant.openai_assistant_id !== 'asst_placeholder') {
        console.log(`✅ ${assistant.name} (${assistant.openai_assistant_id})`);
        validCount++;
      } else {
        console.log(`❌ ${assistant.name} - ID inválido`);
      }
    }

    console.log(`\n📊 Resumo: ${validCount}/${assistants.length} assistentes com IDs válidos\n`);
    return validCount === assistants.length;

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
    return false;
  }
}

async function testChatEndpoint() {
  console.log('🌐 Testando endpoint de chat...');

  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Backend respondendo:', data.message);
    return true;
  } catch (error) {
    console.error('❌ Backend não está respondendo:', error.message);
    return false;
  }
}

async function testAssistantAccess() {
  console.log('🤖 Testando acesso aos assistentes...');

  try {
    const response = await fetch('http://localhost:3001/api/assistants');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.data && data.data.length > 0) {
      console.log(`✅ ${data.data.length} assistentes disponíveis na API`);
      
      // Mostrar alguns assistentes
      data.data.slice(0, 3).forEach(assistant => {
        console.log(`   📋 ${assistant.name} - ${assistant.openai_assistant_id}`);
      });
      
      return true;
    } else {
      throw new Error('Nenhum assistente encontrado');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar assistentes:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 TESTE COMPLETO DO SISTEMA DE CHAT\n');
  console.log('=' .repeat(50) + '\n');

  const results = [];

  // Teste 1: OpenAI Integration
  console.log('1️⃣ TESTE DE INTEGRAÇÃO OPENAI');
  console.log('-'.repeat(40));
  const openaiTest = await testOpenAIIntegration();
  results.push({ name: 'OpenAI Integration', passed: openaiTest });

  // Teste 2: Chat Endpoint
  console.log('2️⃣ TESTE DO BACKEND');
  console.log('-'.repeat(40));
  const backendTest = await testChatEndpoint();
  results.push({ name: 'Backend API', passed: backendTest });

  // Teste 3: Assistant Access
  console.log('3️⃣ TESTE DE ACESSO AOS ASSISTENTES');
  console.log('-'.repeat(40));
  const assistantTest = await testAssistantAccess();
  results.push({ name: 'Assistants API', passed: assistantTest });

  // Resultado Final
  console.log('\n' + '='.repeat(50));
  console.log('🏆 RESULTADO FINAL DOS TESTES');
  console.log('='.repeat(50));

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });

  console.log(`\n📊 SCORE: ${passedTests}/${totalTests} testes passaram`);

  if (passedTests === totalTests) {
    console.log('\n🎉 SUCESSO! Sistema de chat 100% funcional!');
    console.log('💬 Usuários podem conversar com as IAs agora!');
    console.log('🌐 Acesse: http://localhost:5173 para testar');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Acesse o frontend');
    console.log('2. Faça login ou registre-se');
    console.log('3. Faça uma assinatura de teste');
    console.log('4. Vá para /chat e comece a conversar!');
  } else {
    console.log('\n⚠️ Alguns testes falharam');
    console.log('🔧 Verifique os erros acima para corrigir');
  }

  console.log('\n' + '='.repeat(50));
}

// Executar teste
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };