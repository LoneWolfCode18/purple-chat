# 🚀 Guía de Deploy en Render

## Paso 1: Preparar el repositorio en GitHub

```bash
# Desde la carpeta purple
cd c:\Users\SHADY\Documents\Proyectos_devops\purple
git init
git add .
git commit -m "Chat secreto - listo para deploy"
git remote add origin https://github.com/TU_USUARIO/purple-chat.git
git push -u origin main
```

## Paso 2: Deploy del Servidor en Render

1. **Ir a** https://render.com y loguear/registrar
2. **Dashboard → New + → Web Service**
3. **Conectar repositorio de GitHub**
4. **Llenar formulario:**
   - Name: `purple-chat-server`
   - Root Directory: `server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

5. **Environment Variables (agregar):**
   ```
   PORT=3000
   CHAT_PASSWORD=secret123
   CLIENT_URL=https://tudominio.onrender.com (opcional, se actualizará después)
   NODE_ENV=production
   ```

6. **Deploy** ✅

7. **Copiar URL del servidor:** `https://purple-chat-server.onrender.com`

## Paso 3: Deploy del Cliente en Render

1. **Dashboard → New + → Web Service** (o Static Site)
2. **Conectar mismo repositorio**
3. **Llenar formulario:**
   - Name: `purple-chat-client`
   - Root Directory: `client`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: Para Static Site, usar `npm run preview` o configurar como Static

4. **Environment Variables:**
   ```
   VITE_SOCKET_SERVER=https://purple-chat-server.onrender.com
   ```

5. **Deploy** ✅

## Paso 4: Actualizar CORS (Importante)

1. Ir al servidor (purple-chat-server) en Render Dashboard
2. **Settings → Code & Env → Redeploy**
3. En tu código local, editar `server/index.js`:

```javascript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "https://purple-chat-client.onrender.com",
    methods: ["GET", "POST"]
  }
});
```

4. Push a GitHub:
```bash
git add server/index.js
git commit -m "Actualizar CORS para Render"
git push
```

Render redesplegará automáticamente.

## Paso 5: Actualizar URL del Cliente en Servidor

En el Dashboard de Render (servidor):
- **Settings → Environment**
- **CLIENT_URL:** `https://purple-chat-client.onrender.com`
- **Redeploy**

## ✅ ¡Listo!

Ambas aplicaciones deberían estar funcionando:
- **Chat:** https://purple-chat-client.onrender.com
- **Server:** https://purple-chat-server.onrender.com

## 🔧 Troubleshooting

**Mensajes: "Cannot connect to server"**
- ✓ Verificar que CORS está actualizado
- ✓ Verificar que VITE_SOCKET_SERVER apunta a servidor correcto
- ✓ Esperar 1-2 minutos después de redeploy

**Build error en cliente**
- ✓ Verificar que `client/.env` existe
- ✓ Verificar que package.json tiene vite en devDependencies

**Servidor no inicia**
- ✓ Verificar logs en Render Dashboard
- ✓ Asegurar que `PORT=3000` en env

## 🔐 Cambiar contraseña en Render

1. Dashboard → purple-chat-server
2. **Settings → Environment → CHAT_PASSWORD**
3. Cambiar valor
4. **Redeploy**

---

**Tiempo de deploy:** ~5-10 minutos por servicio
**Gratis:** Primer mes incluye 750 horas (suficiente para aplicaciones pequeñas)
