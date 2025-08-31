@echo off
REM NeuroIA Lab - Windows Installation Script
REM Instala todas as dependências e configura o projeto

echo 🧠 NeuroIA Lab - Installation Script
echo =====================================

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não está instalado. Instale o Node.js 18+ primeiro.
    pause
    exit /b 1
)

echo ✅ Node.js detectado
node -v

REM Instalar dependências do projeto principal
echo.
echo 📦 Instalando dependências do projeto principal...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependências do projeto principal
    pause
    exit /b 1
)

REM Instalar dependências do frontend
echo.
echo ⚛️ Instalando dependências do frontend...
cd frontend
call npm install
cd ..

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependências do frontend
    pause
    exit /b 1
)

REM Instalar dependências do backend
echo.
echo 🔧 Instalando dependências do backend...
cd backend
call npm install
cd ..

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependências do backend
    pause
    exit /b 1
)

REM Criar arquivos .env se não existirem
echo.
echo ⚙️ Configurando arquivos de ambiente...

if not exist frontend\.env.local (
    copy frontend\.env.example frontend\.env.local >nul
    echo 📝 Criado frontend/.env.local (configure suas variáveis)
) else (
    echo ✅ frontend/.env.local já existe
)

if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
    echo 📝 Criado backend/.env (configure suas variáveis)
) else (
    echo ✅ backend/.env já existe
)

REM Testar builds
echo.
echo 🔨 Testando builds...

echo Frontend build...
cd frontend
call npm run build
cd ..

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro no build do frontend
    pause
    exit /b 1
)

echo Backend build...
cd backend
call npm run build
cd ..

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro no build do backend
    pause
    exit /b 1
)

echo.
echo 🎉 Instalação concluída com sucesso!
echo.
echo 📋 Próximos passos:
echo 1. Configure as variáveis de ambiente:
echo    - frontend/.env.local (Supabase URL, API URL)
echo    - backend/.env (Supabase, OpenAI, Asaas)
echo.
echo 2. Execute as migrações do banco de dados:
echo    - Execute os arquivos em database/migrations/ no Supabase
echo.
echo 3. Inicie o projeto em desenvolvimento:
echo    npm run dev
echo.
echo 4. Ou inicie separadamente:
echo    Frontend: npm run dev:frontend
echo    Backend: npm run dev:backend
echo.
echo 🔗 URLs de desenvolvimento:
echo    Frontend: http://localhost:5173
echo    Backend: http://localhost:3001
echo    API Health: http://localhost:3001/api/health
echo.

pause