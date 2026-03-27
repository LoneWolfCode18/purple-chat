import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
// Configuración de Socket.io con permisos para Render
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://purple-chat.onrender.com", 
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const CHAT_PASSWORD = process.env.CHAT_PASSWORD || "secret123";

// Estructura para almacenar sesiones de chat
const sessions = new Map();

// Middleware para servir archivos estáticos
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Evento: Validar contraseña e iniciar sesión
  socket.on('join_session', (data, callback) => {
    const { password, nickname } = data;
    
    if (password !== CHAT_PASSWORD) {
      callback({ success: false, message: 'Contraseña incorrecta' });
      return;
    }
    
    if (!nickname || nickname.trim() === '') {
      callback({ success: false, message: 'Pseudónimo requerido' });
      return;
    }
    
    // Crear o obtener la sesión (limitada a dos usuarios)
    let sessionId = null;
    let user1 = null;
    let user2 = null;
    
    // Buscar una sesión existente sin llenar
    for (const [id, session] of sessions.entries()) {
      if (session.users.length < 2) {
        sessionId = id;
        break;
      }
    }
    
    // Si no hay sesión disponible, crear una nueva
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessions.set(sessionId, {
        users: [],
        messages: [],
        createdAt: Date.now()
      });
    }
    
    const session = sessions.get(sessionId);
    
    // Verificar que no haya duplicados de pseudónimo
    if (session.users.some(u => u.nickname === nickname)) {
      callback({ success: false, message: 'Este pseudónimo ya está en uso' });
      return;
    }
    
    // Añadir usuario a la sesión
    const user = {
      socketId: socket.id,
      nickname: nickname,
      joinedAt: Date.now()
    };
    
    session.users.push(user);
    socket.join(sessionId);
    socket.sessionId = sessionId;
    socket.nickname = nickname;
    
    // Notificar éxito y enviar mensajes previos
    callback({
      success: true,
      sessionId,
      messages: session.messages,
      users: session.users.map(u => u.nickname),
      message: `Bienvenido ${nickname}`
    });
    
    // Notificar a otros usuarios que alguien se conectó
    io.to(sessionId).emit('user_joined', {
      nickname,
      totalUsers: session.users.length,
      users: session.users.map(u => u.nickname)
    });
    
    console.log(`${nickname} se unió a ${sessionId}. Usuarios en sesión: ${session.users.length}`);
  });
  
  // Evento: Recibir mensaje
  socket.on('send_message', (data) => {
    if (!socket.sessionId) return;
    
    const session = sessions.get(socket.sessionId);
    if (!session) return;
    
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nickname: socket.nickname,
      text: data.text,
      timestamp: Date.now()
    };
    
    session.messages.push(message);
    
    // Emitir mensaje a todos en la sesión
    io.to(socket.sessionId).emit('receive_message', message);
    
    console.log(`[${socket.sessionId}] ${socket.nickname}: ${data.text}`);
  });
  
  // Evento: Usuario se desconecta
  socket.on('disconnect', () => {
    if (socket.sessionId) {
      const session = sessions.get(socket.sessionId);
      
      if (session) {
        // Remover usuario de la sesión
        session.users = session.users.filter(u => u.socketId !== socket.id);
        
        console.log(`${socket.nickname} se desconectó. Usuarios restantes: ${session.users.length}`);
        
        if (session.users.length === 0) {
          // Si no hay usuarios, eliminar la sesión después de un tiempo
          setTimeout(() => {
            if (session.users.length === 0) {
              sessions.delete(socket.sessionId);
              console.log(`Sesión ${socket.sessionId} fue eliminada (vacía)`);
            }
          }, 5000);
          
          io.to(socket.sessionId).emit('session_closed', {
            message: 'La sesión ha sido cerrada. Todos los mensajes fueron eliminados.'
          });
        } else {
          // Notificar a otros que alguien se fue
          io.to(socket.sessionId).emit('user_left', {
            nickname: socket.nickname,
            totalUsers: session.users.length,
            users: session.users.map(u => u.nickname)
          });
        }
      }
    }
    
    console.log('Cliente desconectado:', socket.id);
  });
  
  // Evento: Cerrar sesión manualmente
  socket.on('leave_session', () => {
    if (socket.sessionId) {
      const session = sessions.get(socket.sessionId);
      
      if (session) {
        session.users = session.users.filter(u => u.socketId !== socket.id);
        
        io.to(socket.sessionId).emit('user_left', {
          nickname: socket.nickname,
          totalUsers: session.users.length,
          users: session.users.map(u => u.nickname)
        });
        
        if (session.users.length === 0) {
          sessions.delete(socket.sessionId);
          console.log(`Sesión ${socket.sessionId} fue eliminada`);
        }
      }
    }
    
    socket.leave(socket.sessionId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🔐 Servidor de chat secreto escuchando en puerto ${PORT}`);
  console.log(`📌 Contraseña: ${CHAT_PASSWORD}`);
});
