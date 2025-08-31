@echo off
echo.
echo ============================================
echo   NEUROIA LAB - SISTEMA DE IA PARA PSICOLOGIA
echo ============================================
echo.
echo Inicializando sistema...
echo.

echo [1/3] Verificando dependências...
cd backend
if not exist node_modules (
    echo Instalando dependências do backend...
    npm install
)

cd ../frontend
if not exist node_modules (
    echo Instalando dependências do frontend...
    npm install
)

echo.
echo [2/3] Iniciando backend (porta 3001)...
cd ../backend
start "NeuroIA Backend" cmd /k "npm run dev"

echo Aguardando backend inicializar...
timeout /t 3 > nul

echo.
echo [3/3] Iniciando frontend (porta 5173)...
cd ../frontend
start "NeuroIA Frontend" cmd /k "npm run dev"

echo.
echo ✅ Sistema iniciado com sucesso!
echo.
echo 🌐 Acesse: http://localhost:5173
echo 📡 API: http://localhost:3001/api/health
echo.
echo ⚠️ Mantenha ambas as janelas abertas para usar o sistema.
echo.
pause