# 🔐 INICIO RÁPIDO - Chat Secreto

## 🚀 Opción 1: Ejecutar Localmente (Desarrollo)

### Paso 1: Abrir PowerShell en la carpeta del proyecto
```powershell
cd c:\Users\SHADY\Documents\Proyectos_devops\purple
```

### Paso 2: Instalar (ya está hecho, pero si necesitas reinstalar)
```powershell
npm install
```

### Paso 3: Ejecutar TODO (servidor + cliente)
```powershell
npm run dev
```

Esto abrirá:
- 🖥️ **Cliente:** http://localhost:5173
- 🔌 **Servidor:** http://localhost:3000

### Paso 4: Usar la aplicación
1. Ambos usuarios usan: `Pseudónimo` y `Contraseña: secret123`
2. Escriben mensajes
3. Al cerrar se borran todos los mensajes ✓

---

## 🌐 Opción 2: Desplegar en Render (Producción)

### ⚠️ Prerequisitos
- Cuenta en GitHub (gratis)
- Cuenta en Render (gratis)
- El código está listo para deploy

### Pasos

#### 1️⃣ Subir a GitHub
```powershell
# Desde c:\Users\SHADY\Documents\Proyectos_devops\purple

cd c:\Users\SHADY\Documents\Proyectos_devops\purple
git init
git add .
git commit -m "Chat secreto - lista para deploy"
git remote add origin https://github.com/TU_USUARIO/purple-chat.git
git branch -M main
git push -u origin main
```

#### 2️⃣ Crear Web Service en Render

**Ir a:** https://render.com/dashboard

**Crear Servidor:**
- New Web Service
- Conectar repo: `purple-chat`
- Name: `purple-chat-server`
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables:
  ```
  PORT=3000
  CHAT_PASSWORD=secret123
  NODE_ENV=production
  ```
- Deploy

#### 3️⃣ Copiar URL del Servidor
Después de terminar el build, copiar URL tipo:
```
https://purple-chat-server.onrender.com
```

#### 4️⃣ Crear Cliente en Render

**New Web Service**
- Mismo repo
- Name: `purple-chat-client`
- Root Directory: `client`
- Build Command: `npm install && npm run build`
- Start Command: Para Static Site usar `npm run preview`
- Environment Variables:
  ```
  VITE_SOCKET_SERVER=https://purple-chat-server.onrender.com
  ```
- Deploy

#### 5️⃣ Actualizar CORS en GitHub

Editar `server/index.js`:
```javascript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "https://purple-chat-client.onrender.com",
    methods: ["GET", "POST"]
  }
});
```

Guardar y push:
```powershell
git add server/index.js
git commit -m "Actualizar CORS para Render"
git push
```

Render redesplegará automáticamente.

---

## 📋 Resumen

| Acción | Comando |
|--------|---------|
| Ejecutar local | `npm run dev` |
| Ejecutar solo servidor | `cd server && npm run dev` |
| Ejecutar solo cliente | `cd client && npm run dev` |
| Build para producción | `npm run build` |
| Ver cambios | Abre http://localhost:5173 |

---

## 🔧 Cambiar Contraseña

**Local:**
- Editar `server/.env`
- Cambiar `CHAT_PASSWORD=nuevaContraseña`
- Reiniciar servidor

**En Render:**
- Dashboard → purple-chat-server
- Settings → Environment
- Cambiar `CHAT_PASSWORD`
- Redeploy

---

## ❓ Ayuda

**No puedo acceder a localhost:5173**
```powershell
# Verificar que npm run dev está ejecutándose en otra ventana
# Estar en c:\Users\SHADY\Documents\Proyectos_devops\purple
# Y ejecutar: npm run dev
```

**Render: "Failed to connect to server"**
- Esperar 1-2 minutos después de deploy
- Verificar que CORS está actualizado
- Verificar URL de VITE_SOCKET_SERVER

**Quiero cambiar el tema**
- Editar `client/src/App.css`
- Cambiar colores de galaxia
- Guardar y el navegador se actualiza automáticamente

---

🎉 **¡Listo!** Tu chat secreto está funcionando.
