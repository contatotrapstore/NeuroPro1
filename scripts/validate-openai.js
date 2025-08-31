#!/usr/bin/env node

/**
 * Script para validar configuração OpenAI
 * Testa se a chave é válida e se os assistentes existem
 */

require('dotenv').config({ path: '../backend/.env' });

async function validateOpenAI() {
  console.log('🔍 Validando configuração OpenAI...\n');

  // Verificar se a chave existe
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY não encontrada no .env');
    return;
  }

  // Detectar chave placeholder
  if (apiKey.includes('placeholder') || apiKey.includes('testing')) {
    console.warn('⚠️  Chave OpenAI é placeholder - Chat não funcionará');
    console.warn('📖 Veja CONFIGURACAO_OPENAI.md para configurar\n');
    
    console.log('🔧 Para ativar o chat:');
    console.log('1. Obtenha chave em: https://platform.openai.com/api-keys');
    console.log('2. Edite backend/.env');
    console.log('3. Substitua: OPENAI_API_KEY=sk-sua-chave-real\n');
    return;
  }

  // Testar chave real
  try {
    console.log('🔑 Testando chave OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Chave OpenAI válida');
    console.log(`📊 ${data.data.length} modelos disponíveis\n`);

    // Testar assistentes
    console.log('🤖 Validando assistentes...');
    await validateAssistants(apiKey);

  } catch (error) {
    console.error('❌ Erro ao validar chave OpenAI:', error.message);
    console.log('🔧 Verifique se:');
    console.log('- A chave está correta');
    console.log('- Há créditos na conta');
    console.log('- A conta está ativa\n');
  }
}

async function validateAssistants(apiKey) {
  const assistants = [
    { id: 'asst_8kNKRg68rR8zguhYzdlMEvQc', name: 'PsicoPlano' },
    { id: 'asst_Ohn9w46OmgwLJhxw08jSbM2f', name: 'NeuroCase' },
    { id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3', name: 'Guia Ético' },
    { id: 'asst_jlRLzTb4OrBKYWLtjscO3vJN', name: 'SessãoMap' },
    { id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd', name: 'ClinReplay' },
    { id: 'asst_WdzCxpQ3s04GqyDKfUsmxWRg', name: 'CognitiMap' },
    { id: 'asst_Gto0pHqdCHdM7iBtdB9XUvkU', name: 'MindRoute' },
    { id: 'asst_9RGTNpAvpwBtNps5krM051km', name: 'TheraTrack' },
    { id: 'asst_FHXh63UfotWmtzfwdAORvH1s', name: 'NeuroLaudo' },
    { id: 'asst_ZtY1hAFirpsA3vRdCuuOEebf', name: 'PsicoTest' },
    { id: 'asst_bdfbravG0rjZfp40SFue89ge', name: 'TheraFocus' },
    { id: 'asst_nqL5L0hIfOMe2wNQn9wambGr', name: 'PsicoBase' },
    { id: 'asst_62QzPGQdr9KJMqqJIRVI787r', name: 'MindHome' },
    { id: 'asst_NoCnwSoviZBasOxgbac9USkg', name: 'ClinPrice' }
  ];

  let validCount = 0;
  let invalidCount = 0;

  for (const assistant of assistants) {
    try {
      const response = await fetch(`https://api.openai.com/v1/assistants/${assistant.id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });

      if (response.ok) {
        console.log(`✅ ${assistant.name} (${assistant.id})`);
        validCount++;
      } else {
        console.log(`❌ ${assistant.name} (${assistant.id}) - Não encontrado`);
        invalidCount++;
      }
    } catch (error) {
      console.log(`❌ ${assistant.name} - Erro: ${error.message}`);
      invalidCount++;
    }
  }

  console.log(`\n📊 Resumo da validação:`);
  console.log(`✅ ${validCount} assistentes válidos`);
  console.log(`❌ ${invalidCount} assistentes inválidos`);

  if (invalidCount > 0) {
    console.log(`\n🔧 Para corrigir assistentes inválidos:`);
    console.log(`1. Crie novos assistentes em: https://platform.openai.com/assistants`);
    console.log(`2. Ou atualize os IDs no banco de dados`);
    console.log(`3. Consulte CONFIGURACAO_OPENAI.md para detalhes`);
  }
}

// Executar validação
if (require.main === module) {
  validateOpenAI().catch(console.error);
}

module.exports = { validateOpenAI };