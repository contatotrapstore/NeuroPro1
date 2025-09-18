# NeuroIA Lab API Documentation

## 📋 Visão Geral

A API da NeuroIA Lab oferece endpoints robustos para integração com assistentes de IA especializados em saúde mental. Esta documentação cobre todos os endpoints disponíveis, autenticação e exemplos de uso.

## 🔗 URLs Base

### Produção
```
https://neuro-pro-backend-phi.vercel.app
```

### Desenvolvimento
```
http://localhost:3000
```

## 🔐 Autenticação

A API utiliza **JWT (JSON Web Tokens)** para autenticação. Todos os endpoints protegidos requerem o header de autorização:

```http
Authorization: Bearer <jwt_token>
```

### Obtendo Token de Acesso

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@email.com",
      "name": "Nome do Usuário"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## 📚 Endpoints Principais

### 1. Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/auth/login` | Login do usuário |
| `POST` | `/auth/register` | Registro de novo usuário |
| `POST` | `/auth/logout` | Logout do usuário |
| `POST` | `/auth/refresh` | Renovar token |

### 2. Assistentes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/assistants` | Listar todos os assistentes |
| `GET` | `/assistants/:id` | Obter assistente específico |
| `GET` | `/assistants/area/:area` | Assistentes por área |

### 3. Conversas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/conversations` | Listar conversas do usuário |
| `POST` | `/conversations` | Criar nova conversa |
| `GET` | `/conversations/:id` | Obter conversa específica |
| `DELETE` | `/conversations/:id` | Deletar conversa |

### 4. Mensagens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/messages/send` | Enviar mensagem para assistente |
| `GET` | `/messages/:conversationId` | Obter mensagens da conversa |

### 5. Assinaturas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/subscriptions/user` | Assinaturas do usuário |
| `POST` | `/subscriptions/create` | Criar nova assinatura |
| `PUT` | `/subscriptions/:id/cancel` | Cancelar assinatura |

### 6. Pagamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/payments/create` | Criar cobrança |
| `POST` | `/payments/webhook` | Webhook Asaas |
| `GET` | `/payments/:id/status` | Status do pagamento |

## 🏥 Endpoints por Área Especializada

### Psicologia
```http
GET /assistants/area/Psicologia
```

### Psicopedagogia
```http
GET /assistants/area/Psicopedagogia
```

### Fonoaudiologia
```http
GET /assistants/area/Fonoaudiologia
```

### Neuromodulação (NOVO!)
```http
GET /assistants/area/Neuromodulação
```

### Terapia Ocupacional (NOVO!)
```http
GET /assistants/area/Terapia%20Ocupacional
```

## 📝 Exemplos de Uso

### Listar Assistentes por Área

```javascript
// Buscar assistentes de Neuromodulação
const response = await fetch('/assistants/area/Neuromodulação', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const assistants = await response.json();
```

### Enviar Mensagem

```javascript
const message = await fetch('/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    conversationId: 'conv-id',
    assistantId: 'assistant-id',
    message: 'Olá, preciso de ajuda com...'
  })
});
```

## 📊 Códigos de Resposta

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Erro de validação |
| `401` | Não autorizado |
| `403` | Acesso negado |
| `404` | Não encontrado |
| `429` | Muitas requisições |
| `500` | Erro interno do servidor |

## 🔄 Rate Limiting

- **Limite**: 100 requisições por minuto por usuário
- **Headers de resposta**:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp do reset

## 📋 Formato de Resposta Padrão

```json
{
  "success": true,
  "data": {
    // Dados da resposta
  },
  "message": "Mensagem opcional",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Formato de Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "email",
        "message": "Email é obrigatório"
      }
    ]
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 🛠️ SDKs e Integrações

### JavaScript/TypeScript
```bash
npm install @neuroialab/api-client
```

### Python
```bash
pip install neuroialab-api
```

## 📞 Suporte

- **Email**: dev@neuroialab.com.br
- **Documentação**: https://docs.neuroialab.com.br
- **Status**: https://status.neuroialab.com.br

---

**Última atualização**: Janeiro 2025 | **Versão API**: v3.1.0