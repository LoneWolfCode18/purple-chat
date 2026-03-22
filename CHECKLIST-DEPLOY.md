# ✅ Checklist de Deploy a Render

## 📋 Pre-Deploy (Local)

- [ ] El código está en `c:\Users\SHADY\Documents\Proyectos_devops\purple`
- [ ] Ejecuté: `npm run dev` y funciona localmente
- [ ] Cambié contraseña en `server/.env` si lo deseé
- [ ] Personalicé tema en `client/src/App.css` si lo deseé
- [ ] Tengo cuenta de GitHub (https://github.com)
- [ ] Tengo cuenta de Render (https://render.com)

## 🔧 Preparación de GitHub

### Paso 1: Git Config (Primera vez)
```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### Paso 2: Crear Repositorio
- [ ] Ir a: https://github.com/new
- [ ] Name: `purple-chat`
- [ ] Private o Public (tu elección)
- [ ] Click: Create repository

### Paso 3: Subir Código
```powershell
cd c:\Users\SHADY\Documents\Proyectos_devops\purple

git init
git add .
git commit -m "Chat secreto - lista para deploy"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/purple-chat.git
git push -u origin main
```

- [ ] El código está en GitHub
- [ ] Puedo ver los archivos en https://github.com/TU_USUARIO/purple-chat

## 🚀 Deploy en Render

### Paso 1: Crear Servidor
1. [ ] Ir a: https://render.com/dashboard
2. [ ] Click: "New +" → "Web Service"
3. [ ] Seleccionar repositorio: `purple-chat`
4. [ ] Llenar:
   - Name: `purple-chat-server`
   - Root Directory: `server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

5. [ ] Environment Variables:
   ```
   PORT=3000
   CHAT_PASSWORD=secret123
   NODE_ENV=production
   ```
6. [ ] Clickear: Deploy
7. [ ] Esperar... (⏳ 5-10 minutos)
8. [ ] Check: Build succeeded ✓
9. [ ] Copiar URL: `https://purple-chat-server.onrender.com`

### Paso 2: Crear Cliente
1. [ ] Click: "New +" → "Web Service"
2. [ ] Seleccionar repositorio: `purple-chat`
3. [ ] Llenar:
   - Name: `purple-chat-client`
   - Root Directory: `client`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`

4. [ ] Environment Variables:
   ```
   VITE_SOCKET_SERVER=https://purple-chat-server.onrender.com
   ```
   (Reemplazar con URL del servidor del Paso 1)

5. [ ] Deploy
6. [ ] Esperar... (⏳ 5-10 minutos)
7. [ ] Check: Build succeeded ✓
8. [ ] Copiar URL: `https://purple-chat-client.onrender.com`

### Paso 3: Actualizar CORS
1. [ ] Editar localmente: `server/index.js`
2. [ ] Buscar: `const io = new SocketIOServer`
3. [ ] Reemplazar `origin` con:
   ```javascript
   origin: "https://purple-chat-client.onrender.com"
   ```
4. [ ] Git push:
   ```powershell
   git add server/index.js
   git commit -m "Actualizar CORS para Render"
   git push
   ```
5. [ ] Esperar a que Render redeploy automáticamente (⏳ 2-5 min)
6. [ ] Verificar en Dashboard que build está done

### Paso 4: Probar
1. [ ] Abrir en navegador: `https://purple-chat-client.onrender.com`
2. [ ] Pseudónimo: `Test1`
3. [ ] Contraseña: `secret123`
4. [ ] Click: CONECTAR
5. [ ] ¿Funciona? ✓

## 🐛 Troubleshooting

### "Cannot GET /"
- [ ] Verificar que Build Command es correcto
- [ ] Esperar 2-3 minutos más
- [ ] Recargar página

### "Cannot connect to server"
- [ ] Verificar que VITE_SOCKET_SERVER es correcto
- [ ] Verificar que CORS está actualizado
- [ ] Verificar que servidor está running (check Render Dashboard)

### "Socket connection failed"
- [ ] Esperar 1-2 minutos después de ambos deploys
- [ ] Verificar que puerto 3000 es correcto
- [ ] Verificar logs en Render Dashboard

### Build fails
- [ ] Ir a: Service → Logs
- [ ] Leer el error
- [ ] Común: Falta instalar dependencias (revisar package.json)

## 🔐 Post-Deploy

- [ ] Cambiar contraseña en Render:
  - Settings → Environment → CHAT_PASSWORD
  - Redeploy

- [ ] Personalizar si quieres:
  - Cambiar tema
  - Edit repo → Push → Render se actualiza automáticam

- [ ] Compartir URL con tu amiga:
  ```
  Acceso en: https://purple-chat-client.onrender.com
  Pseudónimo y Contraseña: compartidos en privado
  ```

## 📊 URLs Finales

```
Chat:    https://purple-chat-client.onrender.com
Server:  https://purple-chat-server.onrender.com
GitHub:  https://github.com/TU_USUARIO/purple-chat
```

## 🎯 Próximos Pasos (Opcional)

- [ ] Agregar dominio personalizado
- [ ] Cambiar plan a pagado si Render da límite
- [ ] Automatizar con GitHub Actions
- [ ] Agregar logs/monitoreo
- [ ] Mejorar base de datos

---

## ⏱️ Timeline Estimado

| Paso | Tiempo |
|------|--------|
| Setup GitHub | 5 min |
| Deploy Servidor | 10 min |
| Deploy Cliente | 10 min |
| Actualizar CORS | 5 min |
| **Total** | **~30 minutos** |

---

✅ **¡Listo para deploy!**

Si algo falla, revisar:
1. Logs en Render Dashboard
2. Verificar URLs y passwords
3. Esperar un poco más (Render a veces es lento)
4. Reintentar con Redeploy
