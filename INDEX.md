# 📑 ÍNDICE - Chat Secreto

Este archivo te guía por todos los documentos disponibles.

---

## 🚀 Si recién empiezas...

1. **[INICIO-RAPIDO.md](INICIO-RAPIDO.md)** ← EMPIEZA AQUÍ
   - Ejecutar localmente en 2 minutos
   - Comandos básicos
   - Troubleshooting rápido

---

## 🌐 Si quieres desplegar a Render...

2. **[CHECKLIST-DEPLOY.md](CHECKLIST-DEPLOY.md)** ← GUÍA PASO A PASO
   - Checklist completo
   - Instrucciones detalladas
   - Timeline estimado

3. **[RENDER-DEPLOY.md](RENDER-DEPLOY.md)** ← INFORMACIÓN DETALLADA
   - Explicaciones completas
   - Troubleshooting avanzado
   - Configuración avanzada

---

## ⚙️ Si quieres personalizar...

4. **[CONFIGURACION.md](CONFIGURACION.md)** ← CÓMO CAMBIAR TODO
   - Cambiar contraseña
   - Personalizar tema (colores)
   - Aumentar usuarios
   - Cambiar puertos
   - Y mucho más

5. **[VISTA-PREVIA.md](VISTA-PREVIA.md)** ← CÓMO SE VE
   - Pantallas de la app
   - Colores disponibles
   - Efectos visuales
   - Temas alternativos

---

## 📚 Documentación General

6. **[README.md](README.md)** ← DOCUMENTACIÓN COMPLETA
   - Características
   - Instalación detallada
   - Estructura del proyecto
   - Licencia

---

## 📂 Estructura del Proyecto

```
purple/
├── 📄 README.md                 ← Documentación principal
├── 📄 INICIO-RAPIDO.md          ← Empieza aquí
├── 📄 CHECKLIST-DEPLOY.md       ← Guía paso a paso deploy
├── 📄 RENDER-DEPLOY.md          ← Info detallada de Render
├── 📄 CONFIGURACION.md          ← Cómo personalizar
├── 📄 VISTA-PREVIA.md           ← Cómo se ve
├── 📄 INDEX.md                  ← Este archivo
├── .env (no incluido - crea tu propio)
├── .gitignore
├── package.json
│
├── server/
│   ├── index.js                 ← Backend (Express + Socket.io)
│   ├── package.json
│   └── .env
│
└── client/
    ├── src/
    │   ├── App.jsx              ← Componente principal React
    │   ├── App.css              ← Estilos (tema galaxia)
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env
```

---

## 🎯 Rutas Rápidas

### Necesito...

| Necesidad | Documento |
|-----------|-----------|
| Ejecutar rápido | [INICIO-RAPIDO.md](INICIO-RAPIDO.md) |
| Desplegar a Render | [CHECKLIST-DEPLOY.md](CHECKLIST-DEPLOY.md) |
| Cambiar contraseña | [CONFIGURACION.md](CONFIGURACION.md#-cambiar-contraseña-del-chat) |
| Cambiar tema/colores | [CONFIGURACION.md](CONFIGURACION.md#-personalizar-tema) |
| Ver pantallas | [VISTA-PREVIA.md](VISTA-PREVIA.md) |
| Información completa | [README.md](README.md) |
| Más usuarios | [CONFIGURACION.md](CONFIGURACION.md#-aumentar-usuarios-por-sesión) |

---

## 🔧 Comandos Principales

```bash
# Ejecutar todo (servidor + cliente)
npm run dev

# Ejecutar solo servidor
cd server && npm run dev

# Ejecutar solo cliente
cd client && npm run dev

# Build para producción
npm run build

# Ver en acción
http://localhost:5173
```

---

## 📞 Soporte Rápido

### Problema: No me funciona localmente
1. Asegúrate estar en: `c:\Users\SHADY\Documents\Proyectos_devops\purple`
2. Ejecuta: `npm run dev`
3. Abre: `http://localhost:5173`
4. Check: ¿Ambas terminales están ejecutando?

### Problema: Render no funciona
1. Lee: [CHECKLIST-DEPLOY.md](CHECKLIST-DEPLOY.md#-troubleshooting)
2. Check: URLs correctas
3. Espera: 1-2 minutos más
4. Redeploy en Render Dashboard

### Problema: Quiero cambiar algo
1. Lee: [CONFIGURACION.md](CONFIGURACION.md)
2. Edita el archivo
3. Git push (si está en Render)
4. Redeploy

---

## ✨ Características Principales

✅ Chat en tiempo real
✅ Mensajes efímeros (se borran al cerrar)
✅ Pseudónimos secretos
✅ Contraseña de acceso
✅ Tema oscuro de galaxia
✅ Responsive (funciona en móvil)
✅ Sin base de datos permanente
✅ Deploy fácil en Render

---

## 🎓 Tecnologías Usadas

- **Backend**: Express.js, Socket.io, Node.js
- **Frontend**: React, Vite, Socket.io-client
- **Styling**: CSS con animaciones (sin librerías externas)
- **Deploy**: Render

---

## 📊 Recursos

| Recurso | URL |
|---------|-----|
| Render | https://render.com |
| GitHub | https://github.com |
| Express | https://expressjs.com |
| React | https://react.dev |
| Vite | https://vitejs.dev |

---

## 🎉 ¡Listo!

Tienes una aplicación completa de chat secreto lista para:
- ✨ Ejecutar localmente
- 🚀 Desplegar a Render
- 🎨 Personalizar según tus gustos
- 🔐 Usar con privacidad total

**Empieza aquí:** [INICIO-RAPIDO.md](INICIO-RAPIDO.md)

---

Última actualización: Marzo 22, 2026
