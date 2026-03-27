import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const SOCKET_SERVER = import.meta.env.VITE_SOCKET_SERVER || 'http://localhost:3000';

  useEffect(() => {
    // 🔌 INICIALIZACIÓN DEL SOCKET
    // Crear socket una sola vez al montar el componente
    // reconnection: true permite reintentar automáticamente si se pierde conexión
    const socket = io(SOCKET_SERVER, { transports: ['websocket'], reconnection: true });
    setSocket(socket);

    // 📨 MANEJADOR: Recibir mensajes con prevención de eco/duplicados
    // Valida que no exista un mensaje con el mismo ID antes de agregarlo
    // Esto previene que un mismo mensaje aparezca dos veces (local + servidor)
    const handleReceiveMessage = (msg) => {
      setMessages(prev => {
        const isDuplicate = prev.some(m => m.id === msg.id);
        return isDuplicate ? prev : [...prev, msg];
      });
    };

    // 👤 MANEJADOR: Usuario se unió a la sesión
    // Genera un ID único para el mensaje del sistema para evitar duplicados
    const handleUserJoined = (data) => {
      setUsers(data.users || []);
      setMessages(prev => [...prev, {
        id: `sys-joined-${data.nickname}-${Date.now()}`,
        nickname: 'SISTEMA',
        text: `✓ ${data.nickname} se unió`,
        timestamp: Date.now(),
        isSystem: true
      }]);
    };

    // 🚪 MANEJADOR: Usuario se desconectó de la sesión
    // También con ID único del sistema para mantener integridad de duplicados
    const handleUserLeft = (data) => {
      setUsers(data.users || []);
      setMessages(prev => [...prev, {
        id: `sys-left-${data.nickname}-${Date.now()}`,
        nickname: 'SISTEMA',
        text: `✗ ${data.nickname} se desconectó`,
        timestamp: Date.now(),
        isSystem: true
      }]);
    };

    // 🎧 REGISTRAR TODOS LOS LISTENERS
    // Se registran los manejadores específicos para que socket.off() funcione correctamente
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);

    // 🧹 CLEANUP: Desregistrar listeners y desconectar al desmontar
    // Previene memory leaks y acumulación de listeners múltiples
    // Si el componente se remonta, los listeners antiguos se eliminan primero
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.disconnect();
    };
  }, [SOCKET_SERVER]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
  }, [messages]);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // ✅ VALIDACIÓN: Pseudónimo y contraseña requeridos
    if (!nickname.trim() || !password.trim()) {
      setLoginError('Pseudónimo y contraseña obligatorios');
      return;
    }
    
    // 🔐 EMITIR JOIN_SESSION al servidor
    // El servidor valida la contraseña y asigna el usuario a una sesión
    // Responde con success: true y los mensajes previos de esa sesión
    socket.emit('join_session', { nickname: nickname.trim(), password }, (res) => {
      if (res.success) {
        // ✨ LOGIN EXITOSO
        // Marcar como conectado y cargar los datos de la sesión
        setIsConnected(true);
        setMessages(res.messages || []);
        setUsers(res.users || []);
        setPassword('');
        setLoginError('');
      } else {
        // ❌ LOGIN FALLÓ
        // Mostrar error (contraseña incorrecta, pseudónimo duplicado, etc.)
        setLoginError(res.message);
      }
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // 💬 CREAR MENSAJE LOCAL CON ID ÚNICO
    // Se genera un ID único combinando timestamp + random para evitar colisiones
    // Este ID se usará para validar duplicados cuando el servidor retransmita
    const localMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      nickname,
      text: inputValue.trim(),
      timestamp: Date.now()
    };
    
    // ⚡ AGREGAR LOCALMENTE DE INMEDIATO
    // El mensaje aparece al instante en la UI sin esperar confirmación del servidor
    // Mejora UX: el usuario ve su mensaje inmediatamente
    setMessages(prev => [...prev, localMsg]);
    
    // 📤 EMITIR AL SERVIDOR
    // El servidor recibe el mensaje y lo retransmite a otros usuarios
    // Cuando vuelve por socket, la prevención de duplicados lo ignora (mismo ID)
    socket.emit('send_message', { text: inputValue.trim() });
    setInputValue('');
  };

  const handleLogout = () => {
    socket.emit('leave_session');
    setIsConnected(false);
    setMessages([]);
    setUsers([]);
    setNickname('');
    setPassword('');
  };

  // 🌌 PANTALLA DE LOGIN CON FONDO DE GALAXIA
  // Se muestra antes de conectarse; tiene overlay oscuro con efecto galaxia animado
  if (!isConnected) {
    return (
      <div className="login-container">
        <div className="login-panel">
          <h1>Chat Seguro</h1>
          <form onSubmit={handleLogin}>
            <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Pseudónimo" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit">Conectar</button>
          </form>
        </div>
      </div>
    );
  }

  // 💬 PANTALLA DE CHAT (MODAL CENTRADO)
  // Se muestra después del login exitoso
  // Modal flotante centrado con scroll interno en mensajes
  return (
    <div className="modal-overlay">
      <div className="chat-modal">
        <header className="top-bar">
          <div>
            <h2>🔐 Chat</h2>
            <small>{users.length} en línea</small>
          </div>
          <button onClick={handleLogout}>Cerrar</button>
        </header>

        <section className="message-area">
          {messages.length === 0 && <div className="empty-state">No hay mensajes</div>}
          {messages.map((msg) => (
            <div key={msg.id} className={`bubble ${msg.isSystem ? 'system' : msg.nickname === nickname ? 'self' : 'other'}`}>
              <div className="bubble-meta">
                <span>{msg.isSystem ? 'Sistema' : msg.nickname}</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <p>{msg.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </section>

        <form className="input-bar" onSubmit={handleSendMessage}>
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
            autoComplete="off"
          />
          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  );
}

export default App;
