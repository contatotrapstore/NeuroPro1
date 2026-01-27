# 📚 Índice Mestre da Documentação - NeuroIA Lab

> **Central de documentação** completa da plataforma de assistentes de IA especializados em saúde mental

## 🚀 Quick Start

| Para que você é? | Comece aqui |
|------------------|-------------|
| **🧠 Profissional de Saúde Mental** | [Manual do Usuário](user/README.md) |
| **💻 Desenvolvedor** | [Documentação da API](api/README.md) |
| **🔧 Administrador** | [Guia do Admin](admin/ADMIN_GUIDE.md) |
| **🏗️ Arquiteto de Software** | [Arquitetura do Sistema](architecture/README.md) |

## 📖 Documentação Principal

### 🌟 **Essencial**
- **[README Principal](../README.md)** - Visão geral completa do projeto
- **[CHANGELOG](../CHANGELOG.md)** - Histórico detalhado de versões
- **[Manual do Usuário](user/README.md)** - Guia completo para profissionais
- **[Primeiros Passos](user/getting-started.md)** - Setup em 5 minutos

### 💻 **Para Desenvolvedores**
- **[API Documentation](api/README.md)** - Referência completa da API
- **[OpenAPI Spec](api/openapi.yaml)** - Especificação técnica em YAML
- **[Frontend Architecture](../frontend/README.md)** - Estrutura React/TypeScript

### 🏗️ **Arquitetura e Infraestrutura**
- **[System Architecture](architecture/README.md)** - Visão geral da arquitetura
- **[Database Schema](architecture/database-schema.md)** - Modelo de dados completo
- **[Migration Guide](migrations/apply-migration-manual.md)** - Aplicação de migrações
- **[Database README](../database/README.md)** - Estrutura do banco

### ⚙️ **Deployment e Configuração**
- **[Deploy Instructions](../DEPLOY_INSTRUCTIONS.md)** - Deploy no Vercel
- **[Environment Setup](../VERCEL_ENVIRONMENT_SETUP.md)** - Configuração de variáveis
- **[Security Guide](../SECURITY.md)** - Práticas de segurança
- **[Password Reset Flow](RESET_PASSWORD_FLOW.md)** - Sistema de reset de senha

### 👨‍💼 **Administração**
- **[Admin Guide](admin/ADMIN_GUIDE.md)** - Painel administrativo completo
- **[System Status](admin/SYSTEM_STATUS.md)** - Status do sistema em produção ✨ **NOVO**
- **[Payment Status](../PAYMENT_STATUS_2025.md)** - Status atual dos pagamentos

## 🎯 Por Área de Especialização

### 🧠 **Psicologia** (Área Principal)
- **14 assistentes especializados** em diferentes abordagens
- Planejamento de sessões, análise de casos, treinamento
- [Ver assistentes específicos →](user/README.md#psicologia-14-assistentes)

### 📚 **Psicopedagogia**
- Dificuldades de aprendizagem e avaliação psicopedagógica
- [Ver assistentes específicos →](user/README.md#psicopedagogia-2-assistentes)

### 🗣️ **Fonoaudiologia**
- Distúrbios da comunicação e reabilitação da fala
- [Ver assistentes específicos →](user/README.md#fonoaudiologia-2-assistentes)

### ⚡ **Neuromodulação** (NOVO!)
- Estimulação cerebral e protocolos de neurofeedback
- [Ver assistentes específicos →](user/README.md#neuromodulação-novo)

### 🖐️ **Terapia Ocupacional** (NOVO!)
- Reabilitação funcional e adaptações ambientais
- [Ver assistentes específicos →](user/README.md#terapia-ocupacional-novo)

## 🔄 Documentação por Funcionalidade

### 🤖 **Assistentes de IA**
- [Lista completa de assistentes](../README.md#🤖-19-assistentes-especializados)
- [Como conversar com assistentes](user/README.md#💬-como-conversar-com-os-assistentes)
- [Dicas para melhores resultados](user/README.md#2-dicas-para-melhores-resultados)

### 💳 **Sistema de Pagamentos**
- [Status atual do sistema](../PAYMENT_STATUS_2025.md)
- [Planos e preços](user/README.md#💳-planos-e-assinaturas)
- [API de pagamentos](api/README.md#6-pagamentos)

### 🔐 **Autenticação e Segurança**
- [Sistema de autenticação](api/README.md#🔐-autenticação)
- [Row Level Security](architecture/database-schema.md#🔒-row-level-security-rls)
- [Práticas de segurança](../SECURITY.md)

### 📱 **Interface do Usuário**
- [Design System](../README.md#🎨-identidade-visual)
- [Responsividade móbile](user/README.md#📱-usando-no-celular)
- [Componentes React](../frontend/README.md)

## 🔧 Guias Técnicos

### 🚀 **Desenvolvimento Local**
```bash
# Setup rápido
git clone <repository>
cd neuroai-lab
npm run install:all
npm run dev
```
[Guia completo →](../README.md#🚀-como-executar)

### 📊 **Banco de Dados**
- [Schema completo](architecture/database-schema.md)
- [Database README](../database/README.md) - Migrations e estrutura completa
- [Migrações](migrations/apply-migration-manual.md)
- [RLS Policies](architecture/database-schema.md#🔒-row-level-security-rls)

### 🌐 **Deploy em Produção**
- [Vercel Deploy](../DEPLOY_INSTRUCTIONS.md)
- [Environment Variables](api/README.md#configuração-de-produção)
- [URLs de produção](../README.md#🌐-urls-de-produção)

## 📈 Status e Métricas

### ✅ **Sistema Atual (v3.4.1)**
- **Frontend**: 100% funcional
- **Backend**: 100% funcional
- **Admin Dashboard**: 100% funcional
- **Sistema ABPSI**: 100% funcional com auto-aprovação ✨ **ATUALIZADO**
- **Pagamentos PIX**: 100% funcional
- **Pagamentos Cartão**: Temporariamente desabilitado

### 📊 **Estatísticas de Produção**
- **19 assistentes** especializados
- **5 áreas** de especialização
- **Sistema Institucional**: ABPSI operacional
- **Auto-Aprovação**: Implementada em setembro 2025
- **Zero erros críticos** - Sistema 100% estável

## 🆘 Suporte e Ajuda

### 📧 **Contato**
- **Email**: suporte@neuroialab.com.br
- **Dev Team**: dev@neuroialab.com.br
- **WhatsApp**: (11) 9 9999-9999

### 🔍 **FAQ Rápido**
- **Não consegue fazer login?** → [Password Reset Guide](supabase-password-reset-config.md)
- **Erro na API?** → [API Error Codes](api/README.md#📊-códigos-de-resposta)
- **Problema no deploy?** → [Deploy Troubleshooting](../DEPLOY_INSTRUCTIONS.md)
- **Dúvida de uso?** → [User Manual](user/README.md)

### 🎓 **Recursos de Aprendizado**
- **[Getting Started](user/getting-started.md)** - Setup em 5 minutos
- **[Best Practices](user/README.md#dicas-para-melhores-resultados)** - Como usar efetivamente
- **[Architecture Deep Dive](architecture/README.md)** - Entenda a arquitetura

## 🔄 Versionamento da Documentação

| Versão | Data | Principais Mudanças |
|--------|------|---------------------|
| **v3.4.1** | 2025-09-27 | Sistema de auto-aprovação ABPSI + Limpeza de arquivos |
| **v3.1.0** | 2025-01-18 | Novas áreas + Documentação completa |
| **v3.0.1** | 2025-01-17 | Sistema de pagamentos |
| **v2.3.2** | 2025-09-16 | Reset de senha reformulado |

### 📝 **Como Contribuir com a Documentação**
1. **Fork** o repositório
2. **Edite** os arquivos .md relevantes
3. **Teste** os links e formatação
4. **Envie** pull request com descrição clara

---

## 🎯 Navegação Rápida

<table>
<tr>
<td width="25%">

### 👤 **Usuários**
- [Manual Completo](user/README.md)
- [Primeiros Passos](user/getting-started.md)
- [Suporte](user/README.md#📞-suporte-e-ajuda)

</td>
<td width="25%">

### 💻 **Desenvolvedores**
- [API Docs](api/README.md)
- [OpenAPI Spec](api/openapi.yaml)
- [Frontend Guide](../frontend/README.md)

</td>
<td width="25%">

### 🏗️ **Arquitetos**
- [System Architecture](architecture/README.md)
- [Database Schema](architecture/database-schema.md)
- [Security](../SECURITY.md)

</td>
<td width="25%">

### ⚙️ **DevOps**
- [Deploy Guide](../DEPLOY_INSTRUCTIONS.md)
- [Migrations](migrations/apply-migration-manual.md)
- [Admin Panel](admin/ADMIN_GUIDE.md)

</td>
</tr>
</table>

---

**📚 Documentação mantida atualizada** | **🚀 Versão**: v3.4.1 | **📅 Última atualização**: 27 de Setembro 2025

> **💡 Dica**: Use `Ctrl+F` para buscar rapidamente por tópicos específicos neste índice!