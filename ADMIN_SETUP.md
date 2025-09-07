# NeuroIA Lab - Configuração do Painel Administrativo

## 📋 Visão Geral

Este guia descreve como configurar e usar o painel administrativo completo para gerenciar assistentes de IA da plataforma NeuroIA Lab. O painel permite controle total sobre assistentes, incluindo criação, edição, upload de ícones, configuração de preços e organização por áreas profissionais.

## 🚀 Funcionalidades Implementadas

- ✅ CRUD completo de assistentes de IA
- ✅ Upload de ícones/imagens personalizados
- ✅ Seletor de cores para temas
- ✅ Organização por áreas (Psicologia, Psicopedagogia, Fonoaudiologia)
- ✅ Sistema de estatísticas por assistente
- ✅ Sincronização automática com loja e painéis
- ✅ Auditoria de alterações
- ✅ Sistema de cache inteligente

## 🔧 Configuração Inicial

### 1. Migrações do Banco de Dados

Execute as migrações na ordem correta:

```bash
# Executar no Supabase SQL Editor ou via CLI
cat database/migrations/010_add_area_field_to_assistants.sql | supabase db reset --db-url YOUR_DB_URL
cat database/migrations/011_enhance_assistants_table.sql | supabase db reset --db-url YOUR_DB_URL
```

**Principais alterações:**
- Campo `area` para categorização profissional
- Campos `icon_url` e `icon_type` para ícones personalizados
- Campo `full_description` para descrições detalhadas
- Campo `features` (JSONB) para recursos dos assistentes
- Campos de auditoria (`created_by`, `updated_by`)
- Tabela `admin_audit_log` para rastreamento

### 2. Configuração do Supabase Storage

Configure o bucket para upload de ícones:

```sql
-- Criar bucket público para ícones de assistentes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assistant-icons', 'assistant-icons', true);

-- Política de acesso para admin
CREATE POLICY "Admin can upload assistant icons" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assistant-icons' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email = 'admin@neuroia.lab' 
    OR raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política de leitura pública
CREATE POLICY "Public can view assistant icons" ON storage.objects
FOR SELECT USING (bucket_id = 'assistant-icons');
```

### 3. Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# Supabase Storage
VITE_SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1

# Admin Configuration
ADMIN_EMAIL=admin@neuroia.lab
ADMIN_ROLE=admin

# Upload Configuration
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/svg+xml,image/webp
```

### 4. Instalação de Dependências

```bash
cd frontend
npm install react-colorful formidable multer
```

## 🎯 Como Usar o Painel Admin

### Acesso

1. Faça login com conta admin (`admin@neuroia.lab`)
2. Navegue para `/admin`
3. Clique na aba "Gerenciar IAs"

### Gerenciamento de Assistentes

#### Criar Novo Assistente

1. Clique em "Novo Assistente"
2. Preencha as informações básicas:
   - **Nome**: Nome do assistente
   - **Descrição**: Descrição curta para cards
   - **Descrição Completa**: Descrição detalhada (opcional)
   - **Área**: Psicologia, Psicopedagogia ou Fonoaudiologia

3. Configure visual:
   - **Ícone**: Upload de imagem ou selecione ícone SVG
   - **Cor do Tema**: Use o seletor de cores

4. Defina preços:
   - **Preço Mensal**: Valor em R$
   - **Preço Semestral**: Valor em R$ (com desconto)

5. Adicione recursos (opcional):
   - Lista de funcionalidades do assistente

#### Editar Assistente Existente

1. Localize o assistente na lista
2. Clique no ícone de edição ✏️
3. Modifique os campos desejados
4. Salve as alterações

#### Upload de Ícones

**Formatos suportados:**
- PNG, JPG, JPEG, SVG, WEBP
- Tamanho máximo: 5MB
- Resolução recomendada: 256x256px

**Processo:**
1. No editor, clique em "Upload de Ícone"
2. Selecione o arquivo
3. O sistema redimensiona automaticamente
4. URL é salva em `icon_url`

#### Filtros e Busca

- **Por Área**: Filtre por Psicologia, Psicopedagogia, Fonoaudiologia
- **Por Status**: Ativos, Inativos, Todos
- **Busca**: Por nome ou descrição
- **Ordenação**: Por nome, data de criação, última atualização

### Sistema de Estatísticas

Cada assistente possui métricas em tempo real:

- **Assinantes**: Número total de usuários inscritos
- **Conversas**: Total de conversas iniciadas
- **Receita Mensal**: Receita estimada
- **Atividade Recente**: Últimas interações
- **Última Utilização**: Data da última conversa

### Auditoria e Logs

Todas as ações administrativas são registradas:

```sql
-- Visualizar logs de auditoria
SELECT 
  al.*,
  u.email as admin_email,
  a.name as assistant_name
FROM admin_audit_log al
JOIN auth.users u ON al.admin_id = u.id
LEFT JOIN assistants a ON al.assistant_id = a.id
ORDER BY al.created_at DESC;
```

## 🔄 Sincronização Automática

O sistema implementa sincronização em tempo real:

### Cache Inteligente

- **TTL**: 60 segundos para dados dinâmicos
- **Invalidação**: Automática após modificações
- **Eventos**: Sistema de eventos para UI updates

### Atualizações Automáticas

Quando um assistente é modificado:

1. Cache é invalidado
2. Eventos são disparados
3. Componentes são atualizados
4. Loja reflete alterações instantaneamente
5. Painéis de usuário são sincronizados

## 🛡️ Segurança

### Controle de Acesso

```typescript
// Verificação de admin
const isAdmin = user?.email === 'admin@neuroia.lab' || 
                user?.user_metadata?.role === 'admin';
```

### Row Level Security (RLS)

Políticas implementadas para:
- Leitura pública de assistentes ativos
- Modificação apenas por admins
- Auditoria protegida

### Validação de Dados

- Campos obrigatórios validados
- Preços devem ser positivos
- Áreas devem ser válidas
- Arquivos de imagem validados

## 🧪 Testando a Implementação

### 1. Teste de Criação

```javascript
// Criar assistente via API
const newAssistant = {
  name: "Teste Assistant",
  description: "Assistente de teste",
  area: "Psicologia",
  color_theme: "#4F46E5",
  monthly_price: 39.90,
  semester_price: 199.90,
  is_active: true
};

const result = await adminService.createAssistant(newAssistant);
```

### 2. Teste de Upload

```javascript
// Upload de ícone
const file = new File(["fake-image"], "icon.png", { type: "image/png" });
const uploadResult = await adminService.uploadAssistantIcon("assistant-id", file);
```

### 3. Verificar Sincronização

1. Crie/edite um assistente no admin
2. Verifique se aparece na loja imediatamente
3. Confirme atualização no dashboard do usuário
4. Teste filtros por área

## 🎨 Personalização

### Cores por Área

```typescript
const areaConfig = {
  'Psicologia': { color: '#2D5A1F', icon: 'brain' },
  'Psicopedagogia': { color: '#1E40AF', icon: 'book' },
  'Fonoaudiologia': { color: '#7C3AED', icon: 'mic' }
};
```

### Adicionando Novas Áreas

1. Atualize constraint no banco:
```sql
ALTER TABLE assistants 
DROP CONSTRAINT IF EXISTS assistants_area_check;

ALTER TABLE assistants 
ADD CONSTRAINT assistants_area_check 
CHECK (area IN ('Psicologia', 'Psicopedagogia', 'Fonoaudiologia', 'NovaArea'));
```

2. Atualize tipos TypeScript
3. Adicione configuração visual

## 📝 Logs e Debug

### Logs de Sistema

```javascript
// Habilitar logs detalhados
localStorage.setItem('debug', 'admin:*');

// Logs são exibidos no console:
// admin:cache Cache invalidated: assistants
// admin:events Event emitted: assistant:create
// admin:sync Syncing assistant data...
```

### Debug de Upload

```javascript
// Verificar configuração de upload
console.log('Upload config:', {
  maxSize: import.meta.env.VITE_MAX_FILE_SIZE,
  allowedTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES,
  storageUrl: import.meta.env.VITE_SUPABASE_STORAGE_URL
});
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Upload falha**: Verificar configuração do bucket
2. **Sync não funciona**: Verificar eventos no console
3. **Cache não invalida**: Limpar localStorage
4. **Permissões negadas**: Verificar RLS policies

### Reset do Sistema

```sql
-- Limpar cache e reinicar
DELETE FROM admin_audit_log WHERE created_at < NOW() - INTERVAL '30 days';
TRUNCATE TABLE assistants RESTART IDENTITY CASCADE; -- ⚠️ CUIDADO!
```

## 📚 Referências

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [React Colorful](https://github.com/omgovich/react-colorful)
- [Formidable Upload](https://github.com/node-formidable/formidable)

---

**Desenvolvido para NeuroIA Lab** 🧠✨