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
    // Crear socket una sola vez al montar
    const socket = io(SOCKET_SERVER, { transports: ['websocket'], reconnection: true });
    setSocket(socket);

    // Manejador receive_message con prevención de duplicados
    const handleReceiveMessage = (msg) => {
      setMessages(prev => {
        const isDuplicate = prev.some(m => m.id === msg.id);
        return isDuplicate ? prev : [...prev, msg];
      });
    };

    // Manejador user_joined con ID único
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

    // Manejador user_left con ID único
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

    // Registrar todos los listeners
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);

    // Cleanup: desregistrar listeners y desconectar
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
    if (!nickname.trim() || !password.trim()) {
      setLoginError('Pseudónimo y contraseña obligatorios');
      return;
    }
    socket.emit('join_session', { nickname: nickname.trim(), password }, (res) => {
      if (res.success) {
        setIsConnected(true);
        setMessages(res.messages || []);
        setUsers(res.users || []);
        setPassword('');
        setLoginError('');
      } else {
        setLoginError(res.message);
      }
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const localMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      nickname,
      text: inputValue.trim(),
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, localMsg]);
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
