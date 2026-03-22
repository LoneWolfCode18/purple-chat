@echo off
REM Script para ejecutar Chat Secreto en desarrollo
REM Ejecuta servidor y cliente simultáneamente

echo.
echo ╔════════════════════════════════════════════════╗
echo ║    🔐 CHAT SECRETO - Iniciando...              ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Verificar que estamos en la carpeta correcta
if not exist "package.json" (
    echo ❌ ERROR: Debes estar en la carpeta: c:\Users\SHADY\Documents\Proyectos_devops\purple
    echo.
    pause
    exit /b 1
)

echo ✓ Carpeta correcta
echo.

REM Verificar si node está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo Descargalo de: https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js instalado
echo.

REM Verificar si npm está instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no está instalado
    pause
    exit /b 1
)

echo ✓ npm instalado
echo.

REM Verificar si dependencias están instaladas
if not exist "node_modules" (
    echo ⏳ Instalando dependencias raíz...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR instalando dependencias
        pause
        exit /b 1
    )
)

if not exist "server\node_modules" (
    echo ⏳ Instalando dependencias del servidor...
    cd server
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR instalando dependencias del servidor
        pause
        exit /b 1
    )
    cd ..
)

if not exist "client\node_modules" (
    echo ⏳ Instalando dependencias del cliente...
    cd client
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR instalando dependencias del cliente
        pause
        exit /b 1
    )
    cd ..
)

echo ✓ Todas las dependencias instaladas
echo.
echo ╔════════════════════════════════════════════════╗
echo ║   ✅ INICIANDO CHAT SECRETO...                 ║
echo ║                                                ║
echo ║   🖥️  Servidor: http://localhost:3000          ║
echo ║   🎨 Cliente:  http://localhost:5173          ║
echo ║                                                ║
echo ║   Presiona CTRL+C para detener                 ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Ejecutar concurrently
call npm run dev

pause
