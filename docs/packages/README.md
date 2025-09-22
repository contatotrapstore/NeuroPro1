# Sistema de Pacotes - NeuroIA Lab

## 📦 Visão Geral

O sistema de pacotes permite que usuários adquiram múltiplos assistentes com desconto significativo em relação às assinaturas individuais.

### 💰 Planos Disponíveis

| Pacote | Assistentes | Preço Mensal | Preço Semestral | Economia |
|--------|-------------|--------------|-----------------|----------|
| **Pacote 3** | 3 assistentes personalizáveis | R$ 99,90 | R$ 499,00 | 17% |
| **Pacote 6** | 6 assistentes personalizáveis | R$ 179,90 | R$ 899,00 | 25% |
| Individual | 1 assistente | R$ 39,90 | R$ 199,00 | - |

## 🏗️ Arquitetura do Sistema

### Database Schema

```sql
-- Tabela principal de pacotes
CREATE TABLE public.user_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_type VARCHAR NOT NULL CHECK (package_type IN ('package_3', 'package_6')),
  subscription_type VARCHAR NOT NULL CHECK (subscription_type IN ('monthly', 'semester')),
  assistant_ids TEXT[] NOT NULL DEFAULT '{}', -- IDs dos assistentes selecionados
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR DEFAULT 'pending',
  asaas_subscription_id VARCHAR,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Validações Automáticas

#### 1. Constraint de Contagem
```sql
ALTER TABLE public.user_packages
ADD CONSTRAINT check_assistant_count
CHECK (
  (package_type = 'package_3' AND array_length(assistant_ids, 1) = 3) OR
  (package_type = 'package_6' AND array_length(assistant_ids, 1) = 6)
);
```

#### 2. Trigger de Validação
```sql
CREATE OR REPLACE FUNCTION validate_package_assistants()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar se não está vazio
  IF NEW.assistant_ids IS NULL OR array_length(NEW.assistant_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'assistant_ids cannot be null or empty';
  END IF;

  -- Validar contagem específica
  IF NEW.package_type = 'package_3' AND array_length(NEW.assistant_ids, 1) != 3 THEN
    RAISE EXCEPTION 'package_3 must have exactly 3 assistants, got %', array_length(NEW.assistant_ids, 1);
  END IF;

  IF NEW.package_type = 'package_6' AND array_length(NEW.assistant_ids, 1) != 6 THEN
    RAISE EXCEPTION 'package_6 must have exactly 6 assistants, got %', array_length(NEW.assistant_ids, 1);
  END IF;

  -- Impedir duplicatas
  IF array_length(NEW.assistant_ids, 1) != (SELECT COUNT(DISTINCT unnest) FROM unnest(NEW.assistant_ids)) THEN
    RAISE EXCEPTION 'assistant_ids cannot contain duplicates';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🔄 Fluxo de Compra

### 1. Frontend (PackageSelector)
- Usuário seleciona tipo de pacote (3 ou 6 assistentes)
- Interface mostra todos os assistentes disponíveis
- Validação visual do progresso (barra de progresso)
- Impede seleção além do limite
- Bloqueia assistentes quando limite atingido

```typescript
const handleProceedToCheckout = () => {
  if (selectedAssistants.length !== packageType) {
    alert(`Selecione exatamente ${packageType} assistentes`);
    return;
  }

  const checkoutData = {
    type: 'package' as const,
    package_type: `package_${packageType}` as 'package_3' | 'package_6',
    subscription_type: planType,
    selected_assistants: selectedAssistants, // Array de IDs
    total_price: packagePrice
  };

  navigate('/checkout', { state: checkoutData });
};
```

### 2. API Service
```typescript
async createPackageWithPayment(
  assistantIds: string[],
  subscriptionType: 'monthly' | 'semester',
  packageType: 'package_3' | 'package_6',
  paymentData: any
): Promise<ApiResponse<any>> {
  return this.createPayment({
    type: 'package',
    package_type: packageType,
    subscription_type: subscriptionType,
    selected_assistants: assistantIds, // Enviado para o backend
    payment_method: paymentData.payment_method,
    customer_data: paymentData.customer_data,
    card_data: paymentData.card_data
  });
}
```

### 3. Backend (payment.js)
```javascript
// Validação de entrada
if (type === 'package' && (!package_type || !selected_assistants?.length)) {
  return res.status(400).json({
    success: false,
    error: 'Tipo e assistentes do pacote são obrigatórios'
  });
}

// Criação do pacote no banco
const { data: userPackage, error: packageError } = await supabase
  .from('user_packages')
  .insert({
    user_id: userId,
    package_type: package_type,
    subscription_type: subscription_type,
    assistant_ids: selected_assistants, // Array salvo diretamente
    total_amount: totalAmount,
    status: 'pending',
    asaas_subscription_id: asaasResult.id,
    expires_at: packageExpirationDate.toISOString()
  })
  .select()
  .single();
```

## 🔒 Segurança e RLS

### Políticas de Linha (RLS)
```sql
-- Usuários só veem seus próprios pacotes
CREATE POLICY "Users can view own packages" ON public.user_packages
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios pacotes
CREATE POLICY "Users can create their own packages" ON public.user_packages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios pacotes
CREATE POLICY "Users can update their own packages" ON public.user_packages
  FOR UPDATE USING (auth.uid() = user_id);
```

## 📊 Performance

### Índices Otimizados
```sql
-- Índice GIN para consultas de array eficientes
CREATE INDEX idx_user_packages_assistant_ids
ON public.user_packages USING GIN(assistant_ids);

-- Índice composto para consultas por tipo e assistentes
CREATE INDEX idx_user_packages_type_assistants
ON public.user_packages(package_type, assistant_ids);

-- Índice para expiração
CREATE INDEX idx_user_packages_expires_at
ON public.user_packages(expires_at);
```

## 🧪 Testes de Validação

### Cenários Testados ✅

1. **Pacote 3 com 3 assistentes**: ✅ PASSA
2. **Pacote 6 com 6 assistentes**: ✅ PASSA
3. **Pacote 3 com 2 assistentes**: ❌ FALHA (esperado)
4. **Pacote 6 com 5 assistentes**: ❌ FALHA (esperado)
5. **Assistentes duplicados**: ❌ FALHA (esperado)
6. **Array vazio**: ❌ FALHA (esperado)

### Query de Teste
```sql
-- Teste bem-sucedido
INSERT INTO public.user_packages (
  user_id, package_type, subscription_type,
  assistant_ids, total_amount, status, expires_at
) VALUES (
  'user-uuid', 'package_3', 'monthly',
  ARRAY['assistant1', 'assistant2', 'assistant3'],
  99.90, 'pending', NOW() + INTERVAL '1 month'
);
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. "assistant_ids cannot be null or empty"
- **Causa**: Frontend não enviando assistentes selecionados
- **Solução**: Verificar se `selected_assistants` está preenchido

#### 2. "package_3 must have exactly 3 assistants"
- **Causa**: Contagem incorreta de assistentes
- **Solução**: Validar seleção no frontend antes do envio

#### 3. "assistant_ids cannot contain duplicates"
- **Causa**: Assistente selecionado múltiplas vezes
- **Solução**: Implementar Set() no frontend para evitar duplicatas

### Monitoramento
```sql
-- Verificar pacotes ativos
SELECT
  package_type,
  COUNT(*) as total_packages,
  AVG(total_amount) as avg_amount
FROM user_packages
WHERE status = 'active'
GROUP BY package_type;

-- Assistentes mais populares em pacotes
SELECT
  unnest(assistant_ids) as assistant_id,
  COUNT(*) as usage_count
FROM user_packages
WHERE status = 'active'
GROUP BY assistant_id
ORDER BY usage_count DESC;
```

## 🔄 Próximas Melhorias

- [ ] Dashboard administrativo para análise de pacotes
- [ ] Recomendações inteligentes de assistentes
- [ ] Pacotes pré-configurados por especialidade
- [ ] Sistema de upgrade/downgrade de pacotes
- [ ] Analytics detalhado de uso por pacote