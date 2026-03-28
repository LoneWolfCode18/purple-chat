import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
// Configuración de Socket.io con permisos para Render
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      "https://purple-chat.onrender.com",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    "https://purple-chat.onrender.com",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));

const PORT = process.env.PORT || 3000;
const CHAT_PASSWORD = process.env.CHAT_PASSWORD;

if (!CHAT_PASSWORD) {
  console.error('ERROR: CHAT_PASSWORD no definido. Configure la variable de entorno antes de iniciar el servidor.');
  process.exit(1);
}

const MAX_SESSIONS = 100;
const MAX_USERS_PER_SESSION = 2;
const MAX_MESSAGES_PER_SESSION = 100;
const MAX_NICKNAME_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 512;

// Estructura para almacenar sesiones de chat
const sessions = new Map();

const sanitizeString = (value, maxLength = 200) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
};

const isValidNickname = (value) => {
  const nickname = sanitizeString(value, MAX_NICKNAME_LENGTH);
  return nickname.length > 0;
};

const isValidMessage = (value) => {
  if (typeof value !== 'string') return false;
  const text = sanitizeString(value, MAX_MESSAGE_LENGTH);
  return text.length > 0;
};

const getAvailablePublicSessionId = () => {
  for (const [id, session] of sessions.entries()) {
    if (session.users.length < MAX_USERS_PER_SESSION && !session.roomPassword) {
      return id;
    }
  }

  return null;
};

const generateRoomPassword = (length = 12) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};

const isRoomPasswordTaken = (password) => {
  for (const session of sessions.values()) {
    if (session.roomPassword === password) {
      return true;
    }
  }
  return false;
};

const generateUniqueRoomPassword = (length = 12) => {
  let password = generateRoomPassword(length);
  let tries = 0;
  while (isRoomPasswordTaken(password) && tries < 20) {
    password = generateRoomPassword(length);
    tries += 1;
  }
  return password;
};

const findSessionByRoomPassword = (password) => {
  for (const [id, session] of sessions.entries()) {
    if (session.roomPassword === password) {
      return { id, session };
    }
  }
  return { id: null, session: null };
};

// Middleware para servir archivos estáticos
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Evento: Validar contraseña e iniciar sesión
  socket.on('join_session', (data, callback) => {
    if (typeof callback !== 'function') return;
    if (!data || typeof data !== 'object') {
      callback({ success: false, message: 'Payload inválido' });
      return;
    }

    const password = String(data.password || '');
    const nickname = sanitizeString(data.nickname, MAX_NICKNAME_LENGTH);

    if (!isValidNickname(nickname)) {
      callback({ success: false, message: 'Pseudónimo requerido' });
      return;
    }

    const { id: roomId, session: roomSession } = findSessionByRoomPassword(password);
    let sessionId = null;
    let session = null;

    if (roomSession) {
      if (roomSession.users.length >= MAX_USERS_PER_SESSION) {
        callback({ success: false, message: 'Sala llena' });
        return;
      }

      if (roomSession.users.some(u => u.nickname.toLowerCase() === nickname.toLowerCase())) {
        callback({ success: false, message: 'Este pseudónimo ya está en uso' });
        return;
      }

      sessionId = roomId;
      session = roomSession;
    } else if (password === CHAT_PASSWORD) {
      sessionId = getAvailablePublicSessionId();
      if (!sessionId) {
        if (sessions.size >= MAX_SESSIONS) {
          callback({ success: false, message: 'Capacidad máxima de sesiones alcanzada. Intenta más tarde.' });
          return;
        }

        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(sessionId, {
          users: [],
          messages: [],
          createdAt: Date.now()
        });
      }

      session = sessions.get(sessionId);

      if (session.users.some(u => u.nickname.toLowerCase() === nickname.toLowerCase())) {
        callback({ success: false, message: 'Este pseudónimo ya está en uso' });
        return;
      }
    } else {
      callback({ success: false, message: 'Contraseña incorrecta' });
      return;
    }

    const user = {
      socketId: socket.id,
      nickname,
      joinedAt: Date.now()
    };

    session.users.push(user);
    socket.join(sessionId);
    socket.sessionId = sessionId;
    socket.nickname = nickname;

    callback({
      success: true,
      sessionId,
      messages: session.messages,
      users: session.users.map(u => u.nickname),
      message: `Bienvenido ${nickname}`
    });

    io.to(sessionId).emit('user_joined', {
      nickname,
      totalUsers: session.users.length,
      users: session.users.map(u => u.nickname)
    });

    console.log(`${nickname} se unió a ${sessionId}. Usuarios en sesión: ${session.users.length}`);
  });

  socket.on('create_session', (data, callback) => {
    if (typeof callback !== 'function') return;
    if (!data || typeof data !== 'object') {
      callback({ success: false, message: 'Payload inválido' });
      return;
    }

    const nickname = sanitizeString(data.nickname, MAX_NICKNAME_LENGTH);
    if (!isValidNickname(nickname)) {
      callback({ success: false, message: 'Pseudónimo requerido para crear sala' });
      return;
    }

    if (sessions.size >= MAX_SESSIONS) {
      callback({ success: false, message: 'Capacidad máxima de sesiones alcanzada. Intenta más tarde.' });
      return;
    }

    const roomPassword = generateUniqueRoomPassword();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      users: [],
      messages: [],
      roomPassword,
      createdAt: Date.now()
    };

    const user = {
      socketId: socket.id,
      nickname,
      joinedAt: Date.now()
    };

    session.users.push(user);
    sessions.set(sessionId, session);
    socket.join(sessionId);
    socket.sessionId = sessionId;
    socket.nickname = nickname;

    callback({
      success: true,
      sessionId,
      roomPassword,
      messages: session.messages,
      users: session.users.map(u => u.nickname),
      message: `Sala creada. Comparte esta contraseña para que otro usuario se una.`
    });

    io.to(sessionId).emit('user_joined', {
      nickname,
      totalUsers: session.users.length,
      users: session.users.map(u => u.nickname),
      roomPassword
    });

    console.log(`${nickname} creó la sala ${sessionId} con contraseña ${roomPassword}`);
  });
  
  // Evento: Recibir mensaje
  socket.on('send_message', (data) => {
    if (!socket.sessionId) return;

    const session = sessions.get(socket.sessionId);
    if (!session) return;
    if (!data || typeof data !== 'object' || !isValidMessage(data.text)) return;

    const text = sanitizeString(data.text, MAX_MESSAGE_LENGTH);
    const message = {
      id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nickname: socket.nickname,
      text,
      timestamp: data.timestamp || Date.now()
    };

    session.messages.push(message);
    if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
      session.messages.shift();
    }

    io.to(socket.sessionId).emit('receive_message', message);

    console.log(`[${socket.sessionId}] ${socket.nickname}: ${text}`);
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
});
