# ⚙️ Configuración - Chat Secreto

## 🔐 Cambiar Contraseña del Chat

### Opción 1: Ambiente Local

**Archivo:** `server/.env`
```
CHAT_PASSWORD=miContraseñaSegura123
```

Después cambiar, reiniciar el servidor.

### Opción 2: En Render (Producción)

1. Ir a: https://render.com/dashboard
2. Seleccionar: `purple-chat-server`
3. Ir a: **Settings → Environment**
4. Cambiar: `CHAT_PASSWORD` a tu nueva contraseña
5. Botón: **Redeploy**

---

## 🎨 Personalizar Tema

### Colores de la Galaxia

Editar: `client/src/App.css`

**Paleta por defecto:**
- Fondo oscuro: `#0a0e27`
- Púrpura principal: `#a855f7`
- Rosa: `#ec4899`
- Verde limón: `#9333ea`

### Ejemplos de cambios

**Tema Ciberpunk (Neón Azul/Rosa):**
```css
/* En login-container, cambiar background a: */
background: linear-gradient(135deg, #0f0621 0%, #1a0a2e 25%, #16213e 50%, #0f3460 75%, #0f0621 100%);

/* Cambiar colores de inputs y botones de #a855f7 a #00d4ff */
```

**Tema Bosque Oscuro (Verde):**
```css
border-color: #10b981;  /* Cambiar purple a green */
background: linear-gradient(135deg, #0d2818 0%, #164e30 25%, #1a562e 50%, #0d2818 100%);
```

---

## 👥 Aumentar Usuarios por Sesión

Por defecto máximo 2 usuarios. Para permitir más:

### Opción 1: Local

Editar: `server/index.js`

Buscar línea: `if (session.users.length < 2) {`

Cambiar a: `if (session.users.length < 4) {`  (o el número que quieras)

También cambiar:
```javascript
if (password !== CHAT_PASSWORD) {
  callback({ success: false, message: 'Contraseña incorrecta' });
  return;
}
```

A validar múltiples usuarios.

### Opción 2: En Render

1. Editar archivo localmente
2. Git push a GitHub
3. Render redesplegará automáticamente

---

## 🔌 Cambiar Puerto

### Servidor

Editar: `server/.env`
```
PORT=5000  # Cambiar de 3000 a 5000
```

### Cliente

Editar: `client/.env`
```
VITE_SOCKET_SERVER=http://localhost:5000  # Cambiar puerto
```

---

## 📊 Cambiar Timeout de Sesión

¿Cuánto tiempo espera el servidor antes de limpiar una sesión vacía?

Editar: `server/index.js`

Buscar: `setTimeout(() => {`

Cambiar: `5000` (milisegundos) a lo que quieras

```javascript
setTimeout(() => {
  if (session.users.length === 0) {
    sessions.delete(socket.sessionId);
  }
}, 30000);  // 30 segundos en lugar de 5
```

---

## 🔒 Modo Solo Lectura

Para crear sesiones donde solo se puede ver pero no escribir:

Editar: `client/src/App.jsx`

En la sección de input:
```jsx
<input
  type="text"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  placeholder="Solo lectura..."
  disabled={true}  // Agregar esto
  className="message-input"
/>
```

---

## 📱 Nombre de la Aplicación

Cambiar título en el navegador:

Editar: `client/index.html`
```html
<title>🔐 Chat Secreto - Conexión Segura</title>
<!-- Cambiar a lo que quieras -->
```

---

## 🌍 Dominio Personalizado

Si usas Render y quieres dominio propio:

1. Ir a: Settings → Custom Domain
2. Seguir instrucciones
3. Actualizar URLs en ambos servicios

Ejemplo:
- Cliente: `chat-secreto.com`
- Servidor: `api.chat-secreto.com`

---

## 📧 Base de datos (Opcional)

Actualmente los mensajes se guardan en memoria y se borran.

Si quieres persistencia temporal con SQLite:

```bash
npm install sqlite3
```

Luego en `server/index.js`:
```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');
```

---

## 🔔 Notificaciones

Cambiar mensajes del sistema:

Editar: `server/index.js`

```javascript
io.to(sessionId).emit('user_joined', {
  nickname,
  totalUsers: session.users.length,
  users: session.users.map(u => u.nickname),
  message: `🟢 ${nickname} entró en el chat`  // Cambiar texto aquí
});
```

---

## 💾 Autoguardado en Archivo

Si quieres guardar histórico temporalmente:

```javascript
const fs = require('fs');

// Al recibir mensaje
session.messages.push(message);
fs.writeFileSync(`session_${socket.sessionId}.json`, JSON.stringify(session.messages));

// Al cerrar
fs.unlinkSync(`session_${socket.sessionId}.json`);
```

---

¿Tienes más dudas? Consulta `README.md` o `RENDER-DEPLOY.md`
