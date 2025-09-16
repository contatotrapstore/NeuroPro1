# 🔐 Fluxo de Reset de Senha - NeuroIA Lab

## Visão Geral

O sistema de reset de senha foi completamente reformulado para usar o fluxo correto do Supabase com eventos `PASSWORD_RECOVERY`. Este documento detalha o funcionamento técnico completo.

---

## 🔄 Fluxo Completo

### 1. Solicitação de Reset
```
Usuário → /auth/forgot-password → Digite email → "Enviar link"
```

**O que acontece:**
- `AuthContext.resetPassword()` é chamado
- Supabase envia email com link de recovery
- URL de redirecionamento: `https://www.neuroialab.com.br/auth/reset-password`

### 2. Clique no Link do Email
```
Email → Link clicado → Redirecionamento para app
```

**O que acontece:**
- Supabase processa tokens internamente
- Dispara evento `PASSWORD_RECOVERY` automaticamente
- Usuário é redirecionado para `/auth/reset-password`

### 3. Captura do Evento
```
AuthContext → onAuthStateChange → Detecta PASSWORD_RECOVERY
```

**Código implementado:**
```javascript
if (event === 'PASSWORD_RECOVERY') {
  console.log('🔐 Password recovery mode detected:', session?.user?.email);
  sessionStorage.setItem('password_recovery_active', 'true');
  if (session) {
    sessionStorage.setItem('password_recovery_session', JSON.stringify(session));
  }
}
```

### 4. Verificação na Página de Reset
```
ResetPassword → useEffect → Verifica sessionStorage
```

**Código implementado:**
```javascript
useEffect(() => {
  const isPasswordRecoveryActive = sessionStorage.getItem('password_recovery_active');
  const recoverySessionData = sessionStorage.getItem('password_recovery_session');

  if (isPasswordRecoveryActive === 'true' && recoverySessionData) {
    setIsRecoveryMode(true);
    setRecoverySession(JSON.parse(recoverySessionData));
    sessionStorage.removeItem('password_recovery_active');
  } else {
    setError('Link de recuperação inválido ou expirado.');
  }
}, []);
```

### 5. Alteração da Senha
```
Usuário → Digite nova senha → Submit → updatePassword()
```

**Código implementado:**
```javascript
const handleSubmit = async () => {
  if (!isRecoveryMode) {
    throw new Error('Não está em modo de recuperação de senha.');
  }

  // Usar updatePassword diretamente - já temos sessão ativa
  const { error } = await updatePassword(password);

  if (!error) {
    sessionStorage.removeItem('password_recovery_session');
    setSuccess(true);
  }
};
```

---

## 🏗️ Arquitetura Técnica

### Estados e Variáveis

#### AuthContext.tsx
- **Evento**: `PASSWORD_RECOVERY`
- **Storage**: `sessionStorage`
  - `password_recovery_active`: Flag booleana
  - `password_recovery_session`: Dados da sessão JSON

#### ResetPassword.tsx
- **Estados**:
  - `isRecoveryMode`: Se está em modo recovery
  - `recoverySession`: Dados da sessão de recovery
  - `password/confirmPassword`: Inputs do usuário

#### ProtectedRoute.tsx
- **Verificação**: Permite acesso se está em modo recovery
- **Condição**: `sessionStorage.getItem('password_recovery_active')`

### Fluxo de Dados

```
Email Link → Supabase → PASSWORD_RECOVERY Event → sessionStorage → ResetPassword Page → updatePassword() → Success
```

---

## 🎯 Vantagens da Nova Implementação

### ✅ Problemas Resolvidos

1. **Login automático**: Não faz mais `setSession()` imediatamente
2. **Redirecionamento indevido**: Não redireciona para dashboard
3. **Tokens na URL**: Não tenta ler tokens do hash da URL
4. **Estado inconsistente**: Usa sessionStorage para dados temporários

### ✅ Melhorias Implementadas

1. **Fluxo nativo**: Usa eventos corretos do Supabase
2. **UX melhorada**: Processo linear e intuitivo
3. **Logs detalhados**: Debug facilitado com console.log
4. **Cleanup automático**: Remove dados após uso

---

## 🐛 Debug e Troubleshooting

### Logs Esperados

#### Fluxo Normal
```
🔄 Enviando email de reset para: user@example.com
🔗 URL de redirecionamento: https://www.neuroialab.com.br/auth/reset-password
✅ Email de reset enviado com sucesso

Auth state changed: PASSWORD_RECOVERY user@example.com
🔐 Password recovery mode detected: user@example.com

🔍 ResetPassword useEffect - Recovery check: {isPasswordRecoveryActive: "true", hasRecoverySession: true}
✅ Password recovery session found: user@example.com

🔄 Atualizando senha no modo recovery...
✅ Senha alterada com sucesso
```

### Problemas Comuns

#### "Link inválido ou expirado"
**Causa**: sessionStorage não contém dados de recovery
**Debug**: Verificar se evento PASSWORD_RECOVERY foi disparado
```javascript
// Verificar no console
sessionStorage.getItem('password_recovery_active')
sessionStorage.getItem('password_recovery_session')
```

#### "Não está em modo de recuperação"
**Causa**: `isRecoveryMode` é false
**Debug**: Verificar se useEffect processou corretamente
```javascript
console.log('Recovery mode:', isRecoveryMode);
console.log('Recovery session:', recoverySession);
```

#### "Session issued in the future"
**Causa**: Diferença de relógio entre servidor e cliente
**Impacto**: Não afeta o funcionamento, apenas aviso

---

## 🔒 Segurança

### Proteções Implementadas

1. **sessionStorage**: Dados temporários, não persistem entre sessões
2. **Validação de modo**: Verifica `isRecoveryMode` antes de permitir alteração
3. **Cleanup automático**: Remove dados após uso bem-sucedido
4. **Timeout natural**: sessionStorage é limpo quando aba é fechada

### Fluxo Seguro

1. **Autenticação pelo email**: Apenas quem tem acesso ao email pode iniciar
2. **Tokens únicos**: Cada link é único e de uso único
3. **Sessão temporária**: Dados não ficam persistidos indefinidamente
4. **Validação no backend**: Supabase valida tokens internamente

---

## 📝 Manutenção

### Monitoramento

- **Logs de console**: Acompanhar eventos PASSWORD_RECOVERY
- **Taxa de sucesso**: Monitorar conversão de reset para login
- **Supabase Auth**: Verificar logs no dashboard

### Atualizações Futuras

- **Templates de email**: Customizar no Supabase Dashboard
- **Timeout de sessão**: Configurar expiração se necessário
- **Fallbacks**: Adicionar URLs de backup se requerido

---

**✅ Sistema totalmente funcional e robusto implementado!**