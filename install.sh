#!/bin/bash

# NeuroIA Lab - Installation Script
# Instala todas as dependências e configura o projeto

echo "🧠 NeuroIA Lab - Installation Script"
echo "====================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Instale o Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detectada. É necessário Node.js 18 ou superior."
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependências do projeto principal
echo ""
echo "📦 Instalando dependências do projeto principal..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do projeto principal"
    exit 1
fi

# Instalar dependências do frontend
echo ""
echo "⚛️ Instalando dependências do frontend..."
cd frontend && npm install && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do frontend"
    exit 1
fi

# Instalar dependências do backend
echo ""
echo "🔧 Instalando dependências do backend..."
cd backend && npm install && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend"
    exit 1
fi

# Criar arquivos .env se não existirem
echo ""
echo "⚙️ Configurando arquivos de ambiente..."

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo "📝 Criado frontend/.env.local (configure suas variáveis)"
else
    echo "✅ frontend/.env.local já existe"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "📝 Criado backend/.env (configure suas variáveis)"
else
    echo "✅ backend/.env já existe"
fi

# Testar builds
echo ""
echo "🔨 Testando builds..."

echo "Frontend build..."
cd frontend && npm run build && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend"
    exit 1
fi

echo "Backend build..."
cd backend && npm run build && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do backend"
    exit 1
fi

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente:"
echo "   - frontend/.env.local (Supabase URL, API URL)"
echo "   - backend/.env (Supabase, OpenAI, Asaas)"
echo ""
echo "2. Execute as migrações do banco de dados:"
echo "   - Execute os arquivos em database/migrations/ no Supabase"
echo ""
echo "3. Inicie o projeto em desenvolvimento:"
echo "   npm run dev"
echo ""
echo "4. Ou inicie separadamente:"
echo "   Frontend: npm run dev:frontend"
echo "   Backend: npm run dev:backend"
echo ""
echo "🔗 URLs de desenvolvimento:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:3001"
echo "   API Health: http://localhost:3001/api/health"