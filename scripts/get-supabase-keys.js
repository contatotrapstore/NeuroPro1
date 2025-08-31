// Script para obter as chaves corretas do Supabase
// Baseado no projeto ID extraído da URL PostgreSQL

const projectRef = 'avgoyfartmzepdgzhroc';
const supabaseUrl = `https://${projectRef}.supabase.co`;

console.log('🔍 Informações do Supabase extraídas:');
console.log('📍 Project Ref:', projectRef);
console.log('🌐 Supabase URL:', supabaseUrl);

console.log('\n📝 Atualize suas variáveis de ambiente com:');
console.log('Frontend (.env.local):');
console.log(`VITE_SUPABASE_URL=${supabaseUrl}`);

console.log('\nBackend (.env):');
console.log(`SUPABASE_URL=${supabaseUrl}`);

console.log('\n⚠️  IMPORTANTE: Você precisa obter as chaves reais do dashboard do Supabase:');
console.log('1. Acesse: https://app.supabase.com/project/' + projectRef);
console.log('2. Vá em Settings > API');
console.log('3. Copie a "anon public" key para SUPABASE_ANON_KEY');
console.log('4. Copie a "service_role" key para SUPABASE_SERVICE_KEY');

console.log('\n🔐 As chaves JWT são únicas para cada projeto!');