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
const MAX_SESSIONS = 100;
const MAX_USERS_PER_SESSION = 2;
const MAX_MESSAGES_PER_SESSION = 1000;
const MAX_NICKNAME_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 512;
const MAX_IMAGE_SIZE_BYTES = 512 * 1024; // 512 KB
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

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

const getBase64PayloadSize = (base64String) => {
  const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
  return Math.floor((base64String.length * 3) / 4) - padding;
};

const isValidImagePayload = (value) => {
  if (typeof value !== 'string') return false;
  const match = value.match(/^data:(image\/(png|jpe?g|webp|gif));base64,([A-Za-z0-9+/]+=*)$/i);
  if (!match) return false;
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) return false;
  const payload = match[3];
  return getBase64PayloadSize(payload) <= MAX_IMAGE_SIZE_BYTES;
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

    const passwordTrimmed = password.trim();
    if (!passwordTrimmed) {
      callback({ success: false, message: 'Clave de sala requerida' });
      return;
    }

    const { id: roomId, session: roomSession } = findSessionByRoomPassword(passwordTrimmed);
    if (!roomSession) {
      callback({ success: false, message: 'Clave de sala inválida' });
      return;
    }

    if (roomSession.users.length >= MAX_USERS_PER_SESSION) {
      callback({ success: false, message: 'Sala llena' });
      return;
    }

    if (roomSession.users.some(u => u.nickname.toLowerCase() === nickname.toLowerCase())) {
      callback({ success: false, message: 'Este pseudónimo ya está en uso' });
      return;
    }

    const sessionId = roomId;
    const session = roomSession;

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
    if (!data || typeof data !== 'object') return;

    const message = {
      id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nickname: socket.nickname,
      timestamp: data.timestamp || Date.now(),
      type: data.type === 'image' ? 'image' : 'text'
    };

    if (message.type === 'image') {
      if (!isValidImagePayload(data.image)) return;
      message.image = data.image;
      message.text = typeof data.text === 'string'
        ? sanitizeString(data.text, MAX_MESSAGE_LENGTH)
        : '';
    } else {
      if (!isValidMessage(data.text)) return;
      message.text = sanitizeString(data.text, MAX_MESSAGE_LENGTH);
    }

    session.messages.push(message);
    if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
      session.messages.shift();
    }

    io.to(socket.sessionId).emit('receive_message', message);

    console.log(`[${socket.sessionId}] ${socket.nickname}: ${message.type === 'image' ? '📷 imagen enviada' : message.text}`);
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
          sessions.delete(socket.sessionId);
          console.log(`Sesión ${socket.sessionId} eliminada porque no hay usuarios conectados`);
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
          console.log(`Sesión ${socket.sessionId} eliminada manualmente tras cerrar la sala`);
        }
      }
    }
    
    socket.leave(socket.sessionId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🔐 Servidor de chat secreto escuchando en puerto ${PORT}`);
});
