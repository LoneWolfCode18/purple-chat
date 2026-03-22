# 🔐 CHAT SECRETO - Conexión Segura

Aplicación de chat privado y efímero con tema oscuro de galaxia. Los mensajes se borran automáticamente cuando termina la sesión.

## ✨ Características

- ✅ **Chat privado**: Acceso solo con contraseña
- ✅ **Pseudónimos**: Identidades secretas para ambos usuarios
- ✅ **Mensajes efímeros**: Se borran completamente al cerrar sesión
- ✅ **Tema oscuro**: Diseño de galaxia con animaciones
- ✅ **Tiempo real**: WebSockets para chat instantáneo
- ✅ **Notificaciones**: Ver cuándo alguien se conecta/desconecta
- ✅ **Responsive**: Funciona en pc y móvil

## 🚀 Instalación Local

### Requisitos
- Node.js 16+
- npm

### Paso 1: Clonar/Descargar
```bash
cd purple
```

### Paso 2: Instalar dependencias del servidor
```bash
cd server
npm install
```

### Paso 3: Instalar dependencias del cliente
```bash
cd ../client
npm install
```

### Paso 4: Configurar variables (Opcional)
Edit `server/.env`:
```
PORT=3000
CHAT_PASSWORD=secret123
CLIENT_URL=http://localhost:5173
```

Edit `client/.env`:
```
VITE_SOCKET_SERVER=http://localhost:3000
```

### Paso 5: Ejecutar en desarrollo

**Terminal 1 - Servidor:**
```bash
cd server
npm run dev
# o para producción: npm start
```

**Terminal 2 - Cliente:**
```bash
cd client
npm run dev
```

Abre: `http://localhost:5173`

## 📝 Cómo usar

1. **Ambos usuarios** ingresan el mismo pseudónimo y contraseña
2. **Escriben sus mensajes** en tiempo real
3. **Al cerrar** o desconectarse, todos los mensajes se borran automáticamente
4. **Sin historial**: No hay registro permanente

## 🌐 Desplegar en Render

### Opción 1: Monorepo (Recomendado)

#### 1. Crear repos en GitHub
```bash
# Repo combinado
git init
git add .
git commit -m "Chat secreto - versión inicial"
git remote add origin https://github.com/tuusuario/purple-chat.git
git push -u origin main
```

#### 2. Crear el servicio en Render

**Ir a:** https://render.com

**Dashboard → New + → Web Service**

```
Name: purple-chat-server
Repository: https://github.com/tuusuario/purple-chat.git

Build Command: cd server && npm install
Start Command: cd server && npm start

Environment Variables:
- PORT=3000
- CHAT_PASSWORD=secret123
- CLIENT_URL=https://tu-app.onrender.com
- NODE_ENV=production
```

**Save Web Service** → Espera que build termine

#### 3. Obtener URL del servidor
- Copiar: `https://tu-app.onrender.com`

#### 4. Crear segundo servicio para el cliente

**Dashboard → New + → Static Site** (o Vite preview)

```
Name: purple-chat-client
Repository: https://github.com/tuusuario/purple-chat.git

Build Command: cd client && npm install && npm run build
Publish Directory: client/dist

Environment Variables:
- VITE_SOCKET_SERVER=https://tu-app-server.onrender.com
```

#### 5. Configurar CORS en servidor

En `server/index.js`, actualizar:
```javascript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "https://tu-app-client.onrender.com",
    methods: ["GET", "POST"]
  }
});
```

---

### Opción 2: Deploy separado

**Servidor:** Render Web Service
**Cliente:** Vercel, Netlify, o Render Static

---

## ⚙️ Estructura del Proyecto

```
purple/
├── server/
│   ├── index.js          # Servidor Express + Socket.io
│   ├── package.json
│   └── .env
├── client/
│   ├── src/
│   │   ├── App.jsx       # Componente principal
│   │   ├── App.css       # Estilos (tema galaxia)
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env
└── README.md
```

## 🔒 Seguridad

- Contraseña compartida entre usuarios (cambiar en .env)
- Mensajes en memoria (no guardados permanentemente)
- HTTPS recomendado en producción
- CORS configurado solo para acceso autorizado

## 🎨 Personalización

### Cambiar contraseña
Edit `server/.env`:
```
CHAT_PASSWORD=micontraseñaSegura123
```

### Cambiar colores del tema
Edit `client/src/App.css`:
```css
/* Cambiar colores principales */
--primary: #a855f7;  /* Púrpura */
--accent: #ec4899;   /* Rosa */
```

### Agregar más usuarios
Modificar en `server/index.js`:
```javascript
if (session.users.length < 3) {  // Cambiar de 2 a 3
```

## 📦 Dependencias

**Servidor:**
- express 4.18.2
- socket.io 4.5.4
- cors 2.8.5

**Cliente:**
- react 18.2.0
- react-dom 18.2.0
- socket.io-client 4.5.4
- vite 4.2.0

## 🐛 Solución de problemas

**Problema:** "Cannot connect to server"
- Verificar que servidor está corriendo en `http://localhost:3000`
- Verificar URL en `VITE_SOCKET_SERVER`

**Problema:** "Contraseña incorrecta"
- Asegurar que ambos usuarios usan la misma contraseña
- Check `CHAT_PASSWORD` en `.env`

**Problema:** Mensajes no aparecen
- Verificar CORS en `server/index.js`
- Check versión de Socket.io (debe ser 4.5+)

## 📄 Licencia

Libre para usar y modificar.

---

**Hecho con 💜 para chats secretos**
