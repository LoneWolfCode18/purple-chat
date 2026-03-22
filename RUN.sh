#!/bin/bash
# Script para ejecutar Chat Secreto en desarrollo (macOS/Linux)

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║    🔐 CHAT SECRETO - Iniciando...              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Debes estar en la carpeta purple"
    exit 1
fi

echo "✓ Carpeta correcta"
echo ""

# Verificar si node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js no está instalado"
    exit 1
fi

echo "✓ Node.js instalado"
echo ""

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "⏳ Instalando dependencias..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "⏳ Instalando dependencias del servidor..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "⏳ Instalando dependencias del cliente..."
    cd client && npm install && cd ..
fi

echo "✓ Todas las dependencias instaladas"
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   ✅ INICIANDO CHAT SECRETO...                 ║"
echo "║                                                ║"
echo "║   🖥️  Servidor: http://localhost:3000          ║"
echo "║   🎨 Cliente:  http://localhost:5173          ║"
echo "║                                                ║"
echo "║   Presiona CTRL+C para detener                 ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Ejecutar
npm run dev
