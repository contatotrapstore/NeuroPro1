#!/bin/bash

echo ""
echo "============================================"
echo "   NEUROIA LAB - SISTEMA DE IA PARA PSICOLOGIA"
echo "============================================"
echo ""
echo "Inicializando sistema..."
echo ""

echo "[1/3] Verificando dependências..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do backend..."
    npm install
fi

cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do frontend..."
    npm install
fi

echo ""
echo "[2/3] Iniciando backend (porta 3001)..."
cd ../backend
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

echo "Aguardando backend inicializar..."
sleep 3

echo ""
echo "[3/3] Iniciando frontend (porta 5173)..."
cd ../frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "🌐 Acesse: http://localhost:5173"
echo "📡 API: http://localhost:3001/api/health"
echo ""
echo "📊 PIDs dos processos:"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 Para parar o sistema:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📋 Logs disponíveis em:"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""