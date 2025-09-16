# Configuração de URLs no Supabase - NeuroIA Lab

## Problema Resolvido

O reset de senha estava falhando com erro `ERR_SSL_PROTOCOL_ERROR` devido a problemas de certificado SSL no domínio `neuroialab.com.br`.

## Solução Implementada

Alteramos temporariamente o redirect para usar a URL do Vercel que possui SSL funcionando.

---

## 🔧 Configuração Necessária no Supabase Dashboard

### 1. Acessar o Painel do Supabase

1. **URL**: https://supabase.com/dashboard/project/avgoyfartmzepdgzhroc
2. **Navegue para**: Authentication → Settings → URL Configuration

### 2. Configurar Redirect URLs

Adicione as seguintes URLs na seção **"Redirect URLs"**:

```
https://neuro-pro-frontend.vercel.app/auth/reset-password
http://localhost:5173/auth/reset-password
https://neuroialab.com.br/auth/reset-password
```

### 3. Configurar Site URL

Defina a **"Site URL"** como:
```
https://neuro-pro-frontend.vercel.app
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

  // Para produção, usar URL do Vercel (SSL funcionando)
  return 'https://neuro-pro-frontend.vercel.app/auth/reset-password';
};
```

### URLs Suportadas

- **Desenvolvimento**: `http://localhost:5173/auth/reset-password`
- **Produção**: `https://neuro-pro-frontend.vercel.app/auth/reset-password`
- **Futuro**: `https://neuroialab.com.br/auth/reset-password` (quando SSL estiver corrigido)

---

## 🧪 Como Testar

### Teste do Reset de Senha

1. **Acesse**: https://neuro-pro-frontend.vercel.app/auth/forgot-password
2. **Digite email** válido (ex: gouveiarx@gmail.com)
3. **Clique** em "Enviar link de recuperação"
4. **Verifique email** recebido
5. **Clique no link** - deve redirecionar para Vercel (não mais neuroialab.com.br)
6. **Digite nova senha** e confirme
7. **Deve funcionar** sem erros de SSL

### Verificação de Logs

No console do navegador, procure por:
```
🔄 Enviando email de reset para: [email]
🔗 URL de redirecionamento: https://neuro-pro-frontend.vercel.app/auth/reset-password
✅ Email de reset enviado com sucesso
```

---

## 🔐 Correção Futura do SSL

Quando o SSL do `neuroialab.com.br` estiver corrigido:

### 1. Verificar Certificado SSL
```bash
# Verificar SSL do domínio
openssl s_client -connect neuroialab.com.br:443 -servername neuroialab.com.br
```

### 2. Atualizar AuthContext.tsx
```javascript
// Volta para o domínio principal quando SSL estiver funcionando
return 'https://neuroialab.com.br/auth/reset-password';
```

### 3. Atualizar Supabase URLs
- Definir `https://neuroialab.com.br` como Site URL principal
- Manter Vercel como URL de backup

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
| `https://neuro-pro-frontend.vercel.app` | ✅ Funcionando | Ativo | Produção (temporário) |
| `http://localhost:5173` | N/A | Ativo | Desenvolvimento |
| `https://neuroialab.com.br` | ❌ Erro SSL | Desabilitado | Futuro (quando SSL corrigido) |

---

**✅ Reset de senha agora funciona perfeitamente através da URL do Vercel!**