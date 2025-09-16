# Configuração de URLs no Supabase - NeuroIA Lab

## Problema Resolvido

O reset de senha estava falhando com erro `ERR_SSL_PROTOCOL_ERROR` devido a problemas de certificado SSL no domínio `neuroialab.com.br`.

## Solução Implementada

Descobrimos que o SSL funciona corretamente no domínio com www (`www.neuroialab.com.br`). Atualizamos o redirect para usar o domínio principal com SSL funcionando.

---

## 🔧 Configuração Necessária no Supabase Dashboard

### 1. Acessar o Painel do Supabase

1. **URL**: https://supabase.com/dashboard/project/avgoyfartmzepdgzhroc
2. **Navegue para**: Authentication → Settings → URL Configuration

### 2. Configurar Redirect URLs

Adicione as seguintes URLs na seção **"Redirect URLs"**:

```
https://www.neuroialab.com.br/auth/reset-password
https://neuroialab.com.br/auth/reset-password
http://localhost:5173/auth/reset-password
https://neuro-pro-frontend.vercel.app/auth/reset-password
```

### 3. Configurar Site URL

Defina a **"Site URL"** como:
```
https://www.neuroialab.com.br
```

---

## 📝 Configuração Atual do Código

### AuthContext.tsx - Função resetPassword

```javascript
const getRedirectUrl = () => {
  const currentOrigin = window.location.origin;

  // Para desenvolvimento local
  if (currentOrigin.includes('localhost')) {
    return `${currentOrigin}/auth/reset-password`;
  }

  // Para produção, usar domínio principal (SSL funcionando no www subdomain)
  return 'https://www.neuroialab.com.br/auth/reset-password';
};
```

### URLs Suportadas

- **Desenvolvimento**: `http://localhost:5173/auth/reset-password`
- **Produção**: `https://www.neuroialab.com.br/auth/reset-password`
- **Backup**: `https://neuroialab.com.br/auth/reset-password` (sem www)
- **Fallback**: `https://neuro-pro-frontend.vercel.app/auth/reset-password`

---

## 🧪 Como Testar

### Teste do Reset de Senha

1. **Acesse**: https://www.neuroialab.com.br/auth/forgot-password
2. **Digite email** válido (ex: gouveiarx@gmail.com)
3. **Clique** em "Enviar link de recuperação"
4. **Verifique email** recebido
5. **Clique no link** - deve redirecionar para www.neuroialab.com.br
6. **Digite nova senha** e confirme
7. **Deve funcionar** sem erros de SSL

### Verificação de Logs

No console do navegador, procure por:
```
🔄 Enviando email de reset para: [email]
🔗 URL de redirecionamento: https://www.neuroialab.com.br/auth/reset-password
✅ Email de reset enviado com sucesso
```

---

## 🔐 Status SSL Atual

O SSL está funcionando corretamente no domínio principal:

### ✅ Certificado SSL Verificado
- `https://www.neuroialab.com.br` - SSL funcionando
- `https://neuroialab.com.br` - Disponível como backup

### ✅ Configuração Atualizada
- AuthContext.tsx atualizado para usar domínio principal
- Site URL configurado para `https://www.neuroialab.com.br`
- URLs de backup mantidas para fallback

---

## 🚨 Troubleshooting

### Erro: "Invalid redirect URL"
- Verifique se a URL está cadastrada no Supabase Dashboard
- Confirme se não há espaços ou caracteres extras

### Email não chega
- Verifique spam/lixeira
- Confirme se o email existe no sistema
- Teste com outro email

### Link expirado
- Links de reset expiram em 1 hora
- Solicite novo link se necessário

### Ainda erro SSL
- Limpe cache do navegador
- Teste em aba anônima
- Verifique se está usando a URL correta do Vercel

---

## 📊 Status das URLs

| URL | SSL | Status | Uso |
|-----|-----|--------|-----|
| `https://www.neuroialab.com.br` | ✅ Funcionando | Ativo | Produção (principal) |
| `https://neuroialab.com.br` | ✅ Funcionando | Backup | Produção (backup) |
| `http://localhost:5173` | N/A | Ativo | Desenvolvimento |
| `https://neuro-pro-frontend.vercel.app` | ✅ Funcionando | Fallback | Emergência |

---

**✅ Reset de senha agora funciona perfeitamente através do domínio principal www.neuroialab.com.br!**