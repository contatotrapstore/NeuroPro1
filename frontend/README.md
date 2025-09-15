# NeuroIA Lab - Frontend

Frontend da aplicação NeuroIA Lab construído com React + TypeScript + Vite.

## 🚀 Stack Tecnológica

- **React 18** + TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** com tema customizado
- **React Router** com rotas protegidas e públicas
- **Supabase Client** para autenticação e dados
- **Framer Motion** para animações
- **React Hot Toast** para notificações
- **Lucide React** para ícones

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── auth/               # Componentes de autenticação
│   │   └── AuthModal.tsx   # Modal de login/registro
│   ├── checkout/           # Componentes de checkout
│   ├── icons/              # Ícones customizados SVG
│   ├── landing/            # Componentes de landing page
│   │   └── LandingDashboard.tsx  # Dashboard para usuários não-logados
│   ├── layout/             # Componentes de layout
│   │   ├── ModernLayout.tsx      # Layout principal
│   │   ├── ProtectedRoute.tsx    # Rotas protegidas
│   │   ├── PublicRoute.tsx       # Rotas públicas (NOVO)
│   │   └── AdminProtectedRoute.tsx
│   └── ui/                 # Componentes UI reutilizáveis
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── AssistantIcon.tsx
├── hooks/                  # Custom hooks
│   └── useAuthModal.tsx    # Hook para modal de autenticação (NOVO)
├── contexts/               # React contexts
│   └── AuthContext.tsx     # Contexto de autenticação
├── pages/                  # Páginas da aplicação
│   ├── Auth/               # Páginas de autenticação
│   ├── Admin/              # Páginas administrativas
│   │   ├── AssistantManager.tsx
│   │   └── AssistantEditor.tsx   # Editor com validação de caracteres
│   ├── ChatPage.tsx
│   ├── Dashboard.tsx
│   ├── Store.tsx           # Loja com preços dinâmicos
│   └── Profile.tsx
├── services/               # Serviços e APIs
│   ├── api.service.ts
│   ├── admin.service.ts
│   └── supabase.ts
├── config/                 # Configurações
│   └── pricing.ts          # Configuração de preços dinâmica
└── utils/                  # Utilitários
    └── cn.ts               # Utility para classes CSS
```

## 🆕 Novos Componentes (v2.3.0)

### AuthModal
**Localização**: `src/components/auth/AuthModal.tsx`

Modal profissional para login e registro:
- Design responsivo com gradientes
- Validação completa de formulários
- Suporte a login e registro no mesmo componente
- Integração com useAuth context
- Mensagens de erro específicas

### PublicRoute
**Localização**: `src/components/layout/PublicRoute.tsx`

Componente para rotas que permitem acesso público:
- Não requer autenticação obrigatória
- Exibe loading state durante verificação
- Compatível com usuários logados e não-logados

### LandingDashboard
**Localização**: `src/components/landing/LandingDashboard.tsx`

Dashboard específico para usuários não-autenticados:
- Apresenta valor da plataforma
- CTAs estratégicos para cadastro
- Preview dos assistentes disponíveis

### useAuthModal Hook
**Localização**: `src/hooks/useAuthModal.tsx`

Hook customizado para gerenciar autenticação:
```typescript
const {
  modalState,
  isLoggedIn,
  showAuthModal,
  hideAuthModal,
  switchMode,
  executeIntendedAction,
  requireAuth
} = useAuthModal();
```

**Funcionalidades**:
- `requireAuth()` - Executa ação apenas se autenticado
- `showAuthModal()` - Exibe modal com mensagem personalizada
- `executeIntendedAction()` - Executa ação preservada após login

## 💰 Sistema de Preços Dinâmicos

### Antes vs Depois

**ANTES** - Preços hardcoded:
```typescript
// pricing.ts
export const INDIVIDUAL_PRICING = {
  monthly: 39.90,  // Valor fixo
  semester: 199.00 // Valor fixo
};
```

**DEPOIS** - Preços dinâmicos:
```typescript
// pricing.ts
export const getAssistantPricingInfo = (assistant?: {
  monthly_price?: number;
  semester_price?: number;
}) => {
  const monthlyPrice = getIndividualPrice('monthly', assistant);
  // Usa preço do assistente ou fallback para default
};
```

### Componentes Atualizados

**AssistantCard.tsx**:
```typescript
// Agora recebe dados do assistente
const pricingInfo = getAssistantPricingInfo(assistant);
```

**Store.tsx**:
```typescript
// handleSubscribe usa preços reais do banco
const price = type === 'monthly'
  ? assistant.monthly_price || DEFAULT_MONTHLY_PRICE
  : assistant.semester_price || DEFAULT_SEMESTER_PRICE;
```

## 🛡️ Sistema de Validação de Caracteres

### AssistantEditor.tsx

Implementação completa de validação de formulários:

#### Constantes de Limite
```typescript
const FIELD_LIMITS = {
  id: 100,
  name: 100,
  area: 50,
  icon: 50,
  color_theme: 30,
  icon_type: 10,
  specialization: 100,
  description: 1000,
  full_description: 5000
};
```

#### CharacterCounter Component
```typescript
const CharacterCounter = ({ current, max }: {
  current: number;
  max: number;
}) => (
  <div className={cn(
    'text-xs mt-1 text-right',
    current > max ? 'text-red-600' : 'text-gray-500'
  )}>
    {current}/{max} caracteres
    {current > max && <span>(excede em {current - max})</span>}
  </div>
);
```

#### Input com Validação
```typescript
<Input
  value={formData.name || ''}
  onChange={(e) => handleInputChange('name', e.target.value)}
  maxLength={FIELD_LIMITS.name}
/>
<CharacterCounter current={formData.name?.length || 0} max={FIELD_LIMITS.name} />
```

#### Validação Pré-envio
```typescript
const handleSave = async () => {
  // Validação de todos os campos
  const fieldErrors: string[] = [];
  Object.keys(FIELD_LIMITS).forEach(field => {
    const validation = validateField(field, formData[field]);
    if (!validation.isValid) {
      fieldErrors.push(validation.error!);
    }
  });

  if (fieldErrors.length > 0) {
    toast.error('Erro de validação: ' + fieldErrors.join(', '));
    return;
  }
  // Continuar com salvamento...
};
```

## 🔄 Roteamento Atualizado

### App.tsx

**Rotas Públicas**:
```typescript
// Dashboard público
<Route path="/dashboard" element={
  <PublicRoute>
    <ModernLayout>
      <Dashboard />
    </ModernLayout>
  </PublicRoute>
} />

// Store público
<Route path="/store" element={
  <PublicRoute>
    <ModernLayout>
      <Store />
    </ModernLayout>
  </PublicRoute>
} />
```

**Redirect Padrão**:
```typescript
// Mudança: "/" redireciona para /store (público)
<Route path="/" element={<Navigate to="/store" replace />} />
```

## 🎨 Design System

### Tema Customizado

**Cores Principais**:
- `neuro-primary`: #2D5A1F (Verde principal)
- `neuro-primary-hover`: #4A9A3F (Verde hover)
- `neuro-background`: Gradiente de fundo
- `neuro-surface`: Superfícies de cartões

### Componentes UI

**Button.tsx**:
- Variantes: primary, secondary, outline
- Estados: loading, disabled
- Tamanhos: sm, md, lg

**Input.tsx**:
- Suporte a ícones (leftIcon, rightIcon)
- Estados de erro e sucesso
- Contadores de caracteres integrados
- Validação visual em tempo real

**Card.tsx**:
- Design glass morphism
- Sombras e bordas suaves
- Responsivo por padrão

## 🔧 Configuração de Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
```

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Configuração do Vite

**vite.config.ts**:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
```

## 📱 Responsividade

### Breakpoints

- **sm**: 640px+
- **md**: 768px+
- **lg**: 1024px+
- **xl**: 1280px+

### Componentes Responsivos

Todos os componentes principais são mobile-first:
- **ModernLayout**: Sidebar colapsível
- **AuthModal**: Ajusta-se a diferentes tamanhos de tela
- **Dashboard**: Grid responsivo
- **Store**: Cards adaptativos

## 🚀 Performance

### Otimizações Implementadas

1. **Lazy Loading**: Componentes carregados sob demanda
2. **Code Splitting**: Bundle otimizado por rota
3. **Memoização**: `useCallback` e `useMemo` em hooks
4. **Debouncing**: Prevenção de calls desnecessários

### Bundle Size

- **Frontend**: ~765KB (pode ser otimizado com code splitting)
- **Chunks**: Separação por rotas e vendors
- **Tree Shaking**: Remoção de código não utilizado

## 🧪 Testes (Futuro)

### Estrutura Recomendada

```
src/
├── __tests__/
│   ├── components/
│   ├── hooks/
│   └── pages/
└── test-utils/
    └── setup.ts
```

### Ferramentas Sugeridas

- **Vitest** para unit tests
- **React Testing Library** para component testing
- **Cypress** para e2e testing

---

**NeuroIA Lab Frontend** - Interface moderna, responsiva e robusta para democratizar o acesso a assistentes de IA especializados em psicologia.