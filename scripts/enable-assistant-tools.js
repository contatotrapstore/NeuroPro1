/**
 * Script para habilitar file_search e code_interpreter em todos os assistentes OpenAI
 * Execução: node scripts/enable-assistant-tools.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../api/.env') });
const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Lista de assistentes obtida do banco de dados
const ASSISTANTS = [
  { name: "Alba – A Finalizadora", id: "asst_3cSqoovarIyWic4Ox9ii7FtS" },
  { name: "Amorim – O Mediador", id: "asst_wvY2PdcIkHw0W7Qu9wAdGX1q" },
  { name: "Arthur – O Redator", id: "asst_FHXh63UfotWmtzfwdAORvH1s" },
  { name: "Ben – O Treinador", id: "asst_ZuPRuYG9eqxmb6tIIcBNSSWd" },
  { name: "Bruna – A Neonatal", id: "asst_xjLPpa5gcQlSdqiMrfF3TadK" },
  { name: "Carlos – O Estrategista da Fluência", id: "asst_jZA8kO3jKkuC8ITVbzNkgLbD" },
  { name: "Cássia – A Inclusiva", id: "asst_ROZP5bOSWqg2CW7OVlKqo3j6" },
  { name: "César – O Estrategista Financeiro", id: "asst_wJE7hqjaOK9mIWNqD7SHnNqa" },
  { name: "Clara – A Conselheira", id: "asst_hH374jNSOTSqrsbC9Aq5MKo3" },
  { name: "Dante – O Analista", id: "asst_Ohn9w46OmgwLJhxw08jSbM2f" },
  { name: "Dora – A Comunicadora", id: "asst_NZY5PiCAc0Liuue83oBeMA80" },
  { name: "Elias – O Cuidador", id: "asst_Zyh0HjhaYHqdHgKwOJrayGQw" },
  { name: "Elisa – A Facilitadora", id: "asst_62QzPGQdr9KJMqqJIRVI787r" },
  { name: "Estela – A Educadora", id: "asst_vvNlv8snnStbcmRzrFTL1iVl" },
  { name: "Flora – A Planejadora", id: "asst_z70W1uDRLEjjwisXueRqJ3ip" },
  { name: "Gabriel – O Estrategista Clínico", id: "asst_bdfbravG0rjZfp40SFue89ge" },
  { name: "Gaia – A Sistêmica", id: "asst_qos6jwK9BXcoBcC5HALkBYDt" },
  { name: "Gerador de Laudo Psicopedagógico", id: "asst_83w5ukDiRsL1ApoxC4JA5Mzh" },
  { name: "Helena – A Cientista", id: "asst_nqL5L0hIfOMe2wNQn9wambGr" },
  { name: "Ícaro – O Rastreador", id: "asst_02pftrRlaFoZomKxZrQctVjc" },
  { name: "Isis – A Orientadora", id: "asst_Gto0pHqdCHdM7iBtdB9XUvkU" },
  { name: "Ivi – A Avaliadora", id: "asst_9RGTNpAvpwBtNps5krM051km" },
  { name: "Leo – O Lúdico", id: "asst_o3gPGAzu5g9V4WzHbZ0rcalN" },
  { name: "Lía – A Criadora", id: "asst_65tQQRQuvdXydrPF2IbeS0K2" },
  { name: "Lúcia – A Apoiadora Terapêutica Infantil", id: "asst_QTXlCSIzrTXChCNhKsODe1MF" },
  { name: "Luna – A Estrategista", id: "asst_8kNKRg68rR8zguhYzdlMEvQc" },
  { name: "Marco – O Motor", id: "asst_rh0OlfTFFEQ6HzBF2z4srrtA" },
  { name: "Marina – A Escolar", id: "asst_xjmzGoUfoy2vEAX1NpoAzOvu" },
  { name: "Max - Especialista em tDCS", id: "asst_Qec6YVJTQlFIVFE4C2dJbc9W" },
  { name: "Maya – A Criativa", id: "asst_WdzCxpQ3s04GqyDKfUsmxWRg" },
  { name: "Mia - Assistente de Neurofeedback", id: "asst_EkR2knX0dBIvCXdDNzcQZwZI" },
  { name: "Mila – A Digital", id: "asst_TqHydNMGxak4jEXB21LRTB6L" },
  { name: "Neurociência e Neuromodulação aplicadas ao Esporte", id: "asst_CVzmAE8y2TePJCrzGvsPb5JT" },
  { name: "Nina – A Detectora", id: "asst_2h9PMwZlR6eZcme6nddBLuYX" },
  { name: "Nora – A Estruturadora", id: "asst_jlRLzTb4OrBKYWLtjscO3vJN" },
  { name: "Otto – O Triador", id: "asst_fftkVZNHi0mZHffa4g0hKnEa" },
  { name: "Paula – A Tradutora", id: "asst_OAG818JEklegLnHv3nlYYMx3" },
  { name: "Psicologia do Esporte", id: "asst_pxxuKvI7bKxToIRql2krDYi2" },
  { name: "Psicologia Social e Dinâmica de Grupo no Esporte", id: "asst_bwyfyNZ2fzZAxt8RyOsY9U2T" },
  { name: "Renato – O Registrador", id: "asst_SEYej3t5jqTf3eLrP9QrKP2c" },
  { name: "Simulador de Anamnese Neuropsicológica Infantil", id: "asst_TLdgPs4nAsjZyPDI13qp7L66" },
  { name: "Simulador de Paciente de Psicanálise", id: "asst_9vDTodTAQIJV1mu2xPzXpBs8" },
  { name: "Sofia – A Pesquisadora", id: "asst_ZtY1hAFirpsA3vRdCuuOEebf" },
  { name: "Theo – O Estrategista ABA", id: "asst_GvcpQuokeG4CFy7Ynm9yjk4F" },
  { name: "Vera – A Guardiã da Voz", id: "asst_q8SE1nyWTKMfLoYWBHbyYY8C" },
  { name: "Victor – O Estrategista Financeiro", id: "asst_NoCnwSoviZBasOxgbac9USkg" }
];

async function enableToolsOnAllAssistants() {
  console.log('🚀 Iniciando atualização dos assistentes...\n');

  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('placeholder')) {
    console.error('❌ Erro: OPENAI_API_KEY é necessária');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  console.log(`📋 Processando ${ASSISTANTS.length} assistentes\n`);

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  for (const assistant of ASSISTANTS) {
    try {
      process.stdout.write(`🔄 ${assistant.name}... `);

      // Get current assistant config
      const currentAssistant = await openai.beta.assistants.retrieve(assistant.id);

      // Check if tools are already enabled
      const hasFileSearch = currentAssistant.tools?.some(t => t.type === 'file_search');
      const hasCodeInterpreter = currentAssistant.tools?.some(t => t.type === 'code_interpreter');

      if (hasFileSearch && hasCodeInterpreter) {
        console.log('✅ (já configurado)');
        results.skipped.push({ name: assistant.name, reason: 'already_enabled' });
        continue;
      }

      // Build new tools array
      const newTools = [];

      // Keep existing tools (like function calls)
      if (currentAssistant.tools) {
        for (const tool of currentAssistant.tools) {
          if (tool.type !== 'file_search' && tool.type !== 'code_interpreter') {
            newTools.push(tool);
          }
        }
      }

      // Add file_search and code_interpreter
      newTools.push({ type: 'file_search' });
      newTools.push({ type: 'code_interpreter' });

      // Update assistant
      await openai.beta.assistants.update(assistant.id, {
        tools: newTools
      });

      console.log('✅ Atualizado');
      results.success.push({ name: assistant.name, id: assistant.id });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (err) {
      console.log(`❌ ${err.message}`);
      results.failed.push({ name: assistant.name, error: err.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA ATUALIZAÇÃO\n');
  console.log(`✅ Atualizados: ${results.success.length} assistentes`);
  console.log(`⏭️ Já configurados: ${results.skipped.length} assistentes`);
  console.log(`❌ Falhas: ${results.failed.length} assistentes`);

  if (results.failed.length > 0) {
    console.log('\n❌ Assistentes com falha:');
    results.failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Processo concluído!\n');
}

// Run
enableToolsOnAllAssistants().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});
