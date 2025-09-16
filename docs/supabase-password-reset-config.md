# Configuração de Redefinição de Senha - Supabase

## Problema Resolvido
O sistema de "esqueci minha senha" estava com erro porque o link do email redirecionava para uma página que não funcionava corretamente.

## Soluções Implementadas

### 1. ✅ Correção no Código
- **AuthContext.tsx**: Atualizado para usar URLs de produção corretas
- **ResetPassword.tsx**: Melhorado tratamento de erros e logs para debug

### 2. 🔧 Configuração Necessária no Supabase

Para completar a correção, é necessário configurar as URLs de redirecionamento no painel do Supabase:

#### Passo a Passo:

1. **Acesse o painel do Supabase:**
   - URL: https://supabase.com/dashboard/project/avgoyfartmzepdgzhroc
   - Faça login com a conta admin

2. **Navegue para Authentication → URL Configuration:**
   - No menu lateral: Authentication → Settings → URL Configuration

3. **Adicione as seguintes URLs na seção "Redirect URLs":**
   ```
   https://neuroialab.com.br/auth/reset-password
   https://www.neuroialab.com.br/auth/reset-password
   https://neuro-pro-frontend.vercel.app/auth/reset-password
   http://localhost:5173/auth/reset-password
   ```

4. **Verifique a "Site URL":**
   - Deve estar configurada como: `https://neuroialab.com.br`

### 3. 📧 Template de Email (Opcional)
Se quiser personalizar o email de recuperação:

1. **Vá para Authentication → Email Templates**
2. **Selecione "Reset Password"**
3. **Use este template personalizado:**

```html
<h2>Redefinir Senha - NeuroIA Lab</h2>
<p>Olá!</p>
<p>Você solicitou a redefinição de sua senha no NeuroIA Lab.</p>
<p>Clique no link abaixo para definir uma nova senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Minha Senha</a></p>
<p>Este link expira em 1 hora.</p>
<p>Se você não solicitou esta alteração, ignore este email.</p>
<p>Atenciosamente,<br>Equipe NeuroIA Lab</p>
```

## 4. 🧪 Como Testar

1. **Acesse:** https://neuroialab.com.br/auth/login
2. **Clique em "Esqueci minha senha"**
3. **Digite um email válido e envie**
4. **Verifique o email recebido**
5. **Clique no link do email**
6. **Deve abrir a página de redefinição funcionando**

## 5. 🔍 Debug

Para identificar problemas, verifique o console do navegador:
- Os logs começam com 🔄, ✅ ou ❌
- URLs de redirecionamento são exibidas
- Erros do Supabase são logados com detalhes

## URLs Importantes

- **Painel Supabase:** https://supabase.com/dashboard/project/avgoyfartmzepdgzhroc
- **Site Principal:** https://neuroialab.com.br
- **Página de Reset:** https://neuroialab.com.br/auth/reset-password

## Status

- ✅ **Código corrigido** - URLs de produção configuradas
- ✅ **Tratamento de erro melhorado** - Logs e mensagens mais claras
- 🔧 **Configuração Supabase pendente** - Adicionar URLs no painel

Após configurar as URLs no Supabase, o sistema de redefinição de senha funcionará perfeitamente.