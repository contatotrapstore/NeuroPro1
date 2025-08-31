# Guia de Desenvolvimento - NeuroIA Lab

## 1. Resumo Executivo

Este documento serve como guia de referência rápida para o desenvolvimento da plataforma NeuroIA Lab, consolidando informações técnicas, padrões de código e diretrizes de implementação.

### 1.1 Arquitetura Resumida
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco**: Supabase (PostgreSQL) + Supabase Auth
- **Cache**: Redis
- **APIs**: OpenAI GPT-4, Asaas Payment
- **Deploy**: VPS Ubuntu + Nginx + PM2

## 2. Estrutura de Pastas

### 2.1 Frontend (React)
```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes base (Button, Input, etc.)
│   ├── layout/          # Layout e navegação
│   └── features/        # Componentes específicos de funcionalidades
├── pages/               # Páginas da aplicação
│   ├── Auth/           # Login, cadastro, recuperação
│   ├── Dashboard/      # Dashboard principal
│   ├── Chat/           # Interface de chat
│   ├── Admin/          # Painel administrativo
│   └── Plans/          # Seleção de planos
├── hooks/               # Custom hooks
├── services/            # Serviços e APIs
├── utils/               # Utilitários e helpers
├── types/               # Definições TypeScript
├── contexts/            # React Contexts
└── assets/              # Imagens, ícones, etc.
```

### 2.2 Backend (Node.js)
```
src/
├── controllers/         # Controladores das rotas
│   ├── auth.controller.ts
│   ├── chat.controller.ts
│   ├── payment.controller.ts
│   └── admin.controller.ts
├── services/            # Lógica de negócio
│   ├── auth.service.ts
│   ├── chat.service.ts
│   ├── openai.service.ts
│   ├── asaas.service.ts
│   └── supabase.service.ts
├── middleware/          # Middlewares
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   └── rateLimit.middleware.ts
├── routes/              # Definição de rotas
├── types/               # Tipos TypeScript
├── utils/               # Utilitários
└── config/              # Configurações
```

## 3. Padrões de Código

### 3.1 Nomenclatura

**Arquivos e Pastas**:
- PascalCase para componentes React: `UserProfile.tsx`
- camelCase para utilitários: `formatDate.ts`
- kebab-case para páginas: `chat-interface.tsx`

**Variáveis e Funções**:
- camelCase: `getUserData`, `isAuthenticated`
- UPPER_CASE para constantes: `API_BASE_URL`
- PascalCase para tipos: `UserProfile`, `ChatMessage`

### 3.2 Estrutura de Componentes React

```typescript
// Exemplo: components/features/RobotCard.tsx
import React from 'react';
import { Robot } from '@/types/robot';
import { Button } from '@/components/ui/Button';

interface RobotCardProps {
  robot: Robot;
  onSelect: (robotId: string) => void;
  isAvailable: boolean;
}

export const RobotCard: React.FC<RobotCardProps> = ({
  robot,
  onSelect,
  isAvailable
}) => {
  const handleClick = () => {
    if (isAvailable) {
      onSelect(robot.id);
    }
  };

  return (
    <div className={`robot-card ${!isAvailable ? 'disabled' : ''}`}>
      <div className="robot-icon">{robot.icon}</div>
      <h3 className="robot-name">{robot.name}</h3>
      <p className="robot-description">{robot.description}</p>
      <Button 
        onClick={handleClick}
        disabled={!isAvailable}
        variant={isAvailable ? 'primary' : 'disabled'}
      >
        {isAvailable ? 'Conversar' : 'Upgrade Necessário'}
      </Button>
    </div>
  );
};
```

### 3.3 Estrutura de Serviços Backend

```typescript
// Exemplo: services/chat.service.ts
import { OpenAIService } from './openai.service';
import { SupabaseService } from './supabase.service';
import { ChatMessage, Conversation } from '@/types/chat';

export class ChatService {
  private openai: OpenAIService;
  private supabase: SupabaseService;

  constructor() {
    this.openai = new OpenAIService();
    this.supabase = new SupabaseService();
  }

  async sendMessage(
    userId: string,
    robotId: string,
    message: string,
    conversationId?: string
  ): Promise<ChatMessage> {
    try {
      // Validar acesso do usuário ao robô
      await this.validateUserAccess(userId, robotId);
      
      // Obter ou criar conversa
      const conversation = await this.getOrCreateConversation(
        userId, 
        robotId, 
        conversationId
      );
      
      // Salvar mensagem do usuário
      await this.saveMessage(conversation.id, 'user', message);
      
      // Obter resposta do robô
      const response = await this.openai.generateResponse(
        robotId, 
        message, 
        conversation.id
      );
      
      // Salvar resposta do robô
      const botMessage = await this.saveMessage(
        conversation.id, 
        'assistant', 
        response
      );
      
      return botMessage;
    } catch (error) {
      throw new Error(`Erro ao enviar mensagem: ${error.message}`);
    }
  }

  private async validateUserAccess(userId: string, robotId: string): Promise<void> {
    // Implementar validação de acesso
  }

  private async getOrCreateConversation(
    userId: string, 
    robotId: string, 
    conversationId?: string
  ): Promise<Conversation> {
    // Implementar lógica de conversa
  }

  private async saveMessage(
    conversationId: string, 
    role: 'user' | 'assistant', 
    content: string
  ): Promise<ChatMessage> {
    // Implementar salvamento
  }
}
```

## 4. Identidade Visual e Design System

### 4.1 Paleta de Cores Principal

**Cores Primárias do Projeto NeuroIA Lab:**
```css
/* Verde Principal - Cor principal do projeto */
--color-primary: #0E1E03;
--color-primary-hover: #1A3A0F;
--color-primary-light: #2D5A1F;

/* Cores de Apoio */
--color-secondary: #1F2937;
--color-accent: #1E40AF;
--color-white: #FFFFFF;
--color-gray-100: #F3F4F6;
--color-gray-500: #6B7280;
--color-gray-900: #111827;
```

### 4.2 Aplicação das Cores

**Botões Primários:**
- Background: `#0E1E03`
- Hover: `#1A3A0F`
- Text: `#FFFFFF`

**Cards dos Assistentes:**
- Alguns assistentes usam tons de verde como cor tema
- PsicoPlano: `#0E1E03`
- NeuroCase: `#1A3A0F`
- MindRoute: `#2D5A1F`
- TheraTrack: `#0E1E03`
- MindHome: `#1A3A0F`

**Headers e Navegação:**
- Background principal: `#0E1E03`
- Links ativos: `#2D5A1F`

### 4.3 Classes Tailwind Customizadas

```css
/* tailwind.config.js - Cores customizadas */
module.exports = {
  theme: {
    extend: {
      colors: {
        'neuro-primary': '#0E1E03',
        'neuro-primary-hover': '#1A3A0F',
        'neuro-primary-light': '#2D5A1F',
        'neuro-secondary': '#1F2937',
        'neuro-accent': '#1E40AF'
      }
    }
  }
}
```

## 5. Modelo de Preços e Pacotes

### 5.1 Estrutura de Preços

```javascript
// Configuração de preços dos assistentes
const PRICING_CONFIG = {
  individual: {
    monthly: 39.90,
    semester: 199.00
  },
  packages: {
    three_assistants: {
      monthly: 99.90, // ~16% desconto
      semester: 499.00 // ~16% desconto
    },
    six_assistants: {
      monthly: 179.90, // ~25% desconto
      semester: 899.00 // ~25% desconto
    }
  }
};

// Função para calcular preços de pacotes
const calculatePackagePrice = (assistantCount, subscriptionType) => {
  const basePrice = PRICING_CONFIG.individual[subscriptionType];
  const totalPrice = basePrice * assistantCount;
  
  if (assistantCount === 3) {
    return PRICING_CONFIG.packages.three_assistants[subscriptionType];
  } else if (assistantCount === 6) {
    return PRICING_CONFIG.packages.six_assistants[subscriptionType];
  }
  
  return totalPrice;
};
```

### 5.2 Lógica de Assinatura Individual

```javascript
// Serviço para gerenciar assinaturas individuais
class SubscriptionService {
  static async subscribeToAssistant(userId, assistantId, subscriptionType) {
    const price = PRICING_CONFIG.individual[subscriptionType];
    const expiresAt = this.calculateExpirationDate(subscriptionType);
    
    // Criar assinatura no banco
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        assistant_id: assistantId,
        subscription_type: subscriptionType,
        amount: price,
        expires_at: expiresAt,
        status: 'pending',
        package_type: 'individual',
        package_id: null
      });
    
    if (error) throw error;
    
    // Processar pagamento via Asaas
    const payment = await AsaasService.createSubscription({
      customer: userId,
      value: price,
      cycle: subscriptionType === 'monthly' ? 'MONTHLY' : 'MONTHLY',
      description: `Assinatura ${subscriptionType} - Assistente ${assistantId}`
    });
    
    return { subscription: data, payment };
  }
  
  static calculateExpirationDate(subscriptionType) {
    const now = new Date();
    if (subscriptionType === 'monthly') {
      return new Date(now.setMonth(now.getMonth() + 1));
    } else {
      return new Date(now.setMonth(now.getMonth() + 6));
    }
  }
}

### 5.3 Lógica de Pacotes Personalizáveis

```javascript
// Serviço para gerenciar pacotes personalizados
class PackageService {
  static async createCustomPackage(userId, packageType, assistantIds, subscriptionType) {
    // Validar seleção de assistentes
    const validation = await this.validatePackageSelection(packageType, assistantIds);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const price = PRICING_CONFIG.packages[packageType][subscriptionType];
    const expiresAt = SubscriptionService.calculateExpirationDate(subscriptionType);
    
    // Criar pacote no banco
    const { data: packageData, error: packageError } = await supabase
      .from('user_packages')
      .insert({
        user_id: userId,
        package_type: packageType,
        subscription_type: subscriptionType,
        total_amount: price,
        expires_at: expiresAt,
        status: 'pending'
      })
      .select()
      .single();
    
    if (packageError) throw packageError;
    
    // Criar assinaturas individuais para cada assistente do pacote
    const subscriptions = [];
    for (const assistantId of assistantIds) {
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          assistant_id: assistantId,
          subscription_type: subscriptionType,
          amount: 0, // Valor zerado pois está incluído no pacote
          expires_at: expiresAt,
          status: 'pending',
          package_type: packageType,
          package_id: packageData.id
        });
      
      if (subError) throw subError;
      subscriptions.push(subData);
    }
    
    // Processar pagamento via Asaas
    const payment = await AsaasService.createSubscription({
      customer: userId,
      value: price,
      cycle: subscriptionType === 'monthly' ? 'MONTHLY' : 'MONTHLY',
      description: `Pacote ${packageType} - ${subscriptionType} - ${assistantIds.length} assistentes`
    });
    
    // Atualizar pacote com ID da assinatura Asaas
    await supabase
      .from('user_packages')
      .update({ asaas_subscription_id: payment.id })
      .eq('id', packageData.id);
    
    return { package: packageData, subscriptions, payment };
  }
  
  static async validatePackageSelection(packageType, assistantIds) {
    const expectedCount = packageType === 'package_3' ? 3 : 6;
    
    // Validar quantidade
    if (assistantIds.length !== expectedCount) {
      return {
        isValid: false,
        error: `Pacote ${packageType} deve ter exatamente ${expectedCount} assistentes. Selecionados: ${assistantIds.length}`
      };
    }
    
    // Validar IDs únicos
    const uniqueIds = [...new Set(assistantIds)];
    if (uniqueIds.length !== assistantIds.length) {
      return {
        isValid: false,
        error: 'Não é possível selecionar o mesmo assistente mais de uma vez'
      };
    }
    
    // Validar se assistentes existem
    const { data: assistants, error } = await supabase
      .from('assistants')
      .select('id')
      .in('id', assistantIds);
    
    if (error || assistants.length !== assistantIds.length) {
      return {
        isValid: false,
        error: 'Um ou mais assistentes selecionados são inválidos'
      };
    }
    
    return { isValid: true };
  }
  
  static async getUserPackages(userId) {
    const { data, error } = await supabase
      .from('user_packages')
      .select(`
        *,
        user_subscriptions(
          assistant_id,
          assistants(name, icon, color)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) throw error;
    return data;
  }
}
```

### 5.4 Validação de Acesso a Assistentes

```javascript
// Middleware para validar acesso a assistentes
class AccessValidationService {
  static async validateAssistantAccess(userId, assistantId) {
    // Verificar assinatura individual ativa
    const { data: individualSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('assistant_id', assistantId)
      .eq('package_type', 'individual')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single();
    
    if (individualSub) {
      return { hasAccess: true, accessType: 'individual', subscription: individualSub };
    }
    
    // Verificar acesso via pacote
    const { data: packageSub } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        user_packages(*)
      `)
      .eq('user_id', userId)
      .eq('assistant_id', assistantId)
      .in('package_type', ['package_3', 'package_6'])
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single();
    
    if (packageSub) {
      return { 
        hasAccess: true, 
        accessType: 'package', 
        subscription: packageSub,
        package: packageSub.user_packages
      };
    }
    
    return { hasAccess: false, accessType: null };
  }
  
  static async getUserAvailableAssistants(userId) {
    // Buscar todos os assistentes com acesso ativo
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select(`
        assistant_id,
        package_type,
        assistants(id, name, icon, color, description)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString());
    
    // Extrair assistentes únicos
    const assistantMap = new Map();
    subscriptions?.forEach(sub => {
      if (sub.assistants && !assistantMap.has(sub.assistant_id)) {
        assistantMap.set(sub.assistant_id, {
          ...sub.assistants,
          accessType: sub.package_type
        });
      }
    });
    
    return Array.from(assistantMap.values());
  }
}

// Middleware Express para validação
const validateAssistantAccess = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { assistantId } = req.params;
    
    const access = await AccessValidationService.validateAssistantAccess(userId, assistantId);
    
    if (!access.hasAccess) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não possui assinatura ativa para este assistente'
      });
    }
    
    req.assistantAccess = access;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao validar acesso' });
  }
};
```

## 6. Configurações de Ambiente

### 6.1 Variáveis de Ambiente Frontend

```env
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3001/api
VITE_ENVIRONMENT=development
```

### 6.2 Variáveis de Ambiente Backend

```env
# .env
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_ORGANIZATION=your-org-id

# Asaas
ASAAS_API_KEY=your-asaas-key
ASAAS_ENVIRONMENT=sandbox
ASAAS_WEBHOOK_SECRET=your-webhook-secret

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

## 5. Scripts de Desenvolvimento

### 5.1 Package.json Frontend

```json
{
  "name": "neuroai-lab-frontend",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}
```

### 5.2 Package.json Backend

```json
{
  "name": "neuroai-lab-backend",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "@supabase/supabase-js": "^2.38.0",
    "openai": "^4.20.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "redis": "^4.6.0",
    "dotenv": "^16.3.0",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.2"
  }
}
```

## 6. Comandos de Desenvolvimento

### 6.1 Setup Inicial

```bash
# Clonar repositório
git clone <repository-url>
cd neuroai-lab

# Instalar dependências frontend
cd frontend
npm install

# Instalar dependências backend
cd ../backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Executar migrações do banco
npm run db:migrate
```

### 6.2 Desenvolvimento

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Redis (se local)
redis-server
```

### 6.3 Build e Deploy

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build

# Deploy (exemplo com PM2)
pm2 start ecosystem.config.js
```

## 7. Testes

### 7.1 Estrutura de Testes

```
tests/
├── unit/               # Testes unitários
├── integration/        # Testes de integração
├── e2e/               # Testes end-to-end
└── fixtures/          # Dados de teste
```

### 7.2 Exemplo de Teste Unitário

```typescript
// tests/unit/services/chat.service.test.ts
import { ChatService } from '@/services/chat.service';
import { mockSupabase, mockOpenAI } from '../mocks';

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
  });

  describe('sendMessage', () => {
    it('should send message and return response', async () => {
      // Arrange
      const userId = 'user-123';
      const robotId = 'robot_juridico';
      const message = 'Olá, preciso de ajuda jurídica';

      // Act
      const result = await chatService.sendMessage(userId, robotId, message);

      // Assert
      expect(result).toBeDefined();
      expect(result.role).toBe('assistant');
      expect(result.content).toContain('jurídico');
    });

    it('should throw error for invalid robot access', async () => {
      // Arrange
      const userId = 'user-basic';
      const robotId = 'robot_premium_only';
      const message = 'Test message';

      // Act & Assert
      await expect(
        chatService.sendMessage(userId, robotId, message)
      ).rejects.toThrow('Acesso negado ao robô');
    });
  });
});
```

## 8. Monitoramento e Logs

### 8.1 Configuração de Logs

```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export { logger };
```

### 8.2 Métricas Importantes

- **Performance**: Tempo de resposta das APIs
- **Uso**: Mensagens por usuário/robô
- **Erros**: Taxa de erro por endpoint
- **Custos**: Uso da API OpenAI
- **Usuários**: Usuários ativos, conversões

## 9. Segurança

### 9.1 Checklist de Segurança

- [ ] Validação de entrada em todas as APIs
- [ ] Rate limiting implementado
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (Helmet)
- [ ] Sanitização de dados
- [ ] Logs de auditoria
- [ ] Criptografia de dados sensíveis
- [ ] Validação de JWT tokens
- [ ] RLS configurado no Supabase

### 9.2 Middleware de Segurança

```typescript
// middleware/security.middleware.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const securityMiddleware = [
  helmet(),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: 'Muitas tentativas, tente novamente em 15 minutos'
  })
];
```

## 10. Troubleshooting

### 10.1 Problemas Comuns

**Erro de CORS**:
```typescript
// Verificar configuração no backend
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

**Erro de Autenticação Supabase**:
```typescript
// Verificar se o token está sendo enviado
const token = localStorage.getItem('supabase.auth.token');
if (!token) {
  // Redirecionar para login
}
```

**Erro de Rate Limit OpenAI**:
```typescript
// Implementar retry com backoff
const retryWithBackoff = async (fn: Function, retries = 3) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
};
```

### 10.2 Comandos de Debug

```bash
# Verificar logs do backend
tail -f logs/combined.log

# Verificar status do Redis
redis-cli ping

# Verificar conexão com Supabase
curl -H "Authorization: Bearer $SUPABASE_KEY" $SUPABASE_URL/rest/v1/

# Verificar uso da API OpenAI
curl -H "Authorization: Bearer $OPENAI_KEY" https://api.openai.com/v1/usage
```

## 11. Deploy em Produção

### 11.1 Configuração do VPS

```bash
# Instalar dependências
sudo apt update
sudo apt install nodejs npm nginx redis-server

# Instalar PM2
npm install -g pm2

# Configurar Nginx
sudo nano /etc/nginx/sites-available/neuroai-lab

# Configurar SSL com Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 11.2 Configuração PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'neuroai-lab-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};
```

### 11.3 Configuração Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend
    location / {
        root /var/www/neuroai-lab/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 12. Próximos Passos

### 12.1 Após Setup Inicial
1. Configurar monitoramento (Sentry, LogRocket)
2. Implementar analytics (Google Analytics, Mixpanel)
3. Configurar backup automático
4. Implementar testes automatizados
5. Configurar CI/CD pipeline

### 12.2 Melhorias Futuras
1. Implementar WebSockets para chat em tempo real
2. Adicionar suporte a anexos/imagens
3. Implementar sistema de feedback
4. Criar API pública para integrações
5. Adicionar suporte a múltiplos idiomas

Este guia deve ser atualizado conforme o projeto evolui e novas práticas são adotadas.