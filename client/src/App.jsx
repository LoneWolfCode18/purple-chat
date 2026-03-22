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
    const newSocket = io(SOCKET_SERVER);
    setSocket(newSocket);

    newSocket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('user_joined', (data) => {
      setUsers(data.users);
      setMessages(prev => [...prev, {
        id: `system_${Date.now()}`,
        nickname: 'SISTEMA',
        text: `✓ ${data.nickname} se conectó`,
        timestamp: Date.now(),
        isSystem: true
      }]);
    });

    newSocket.on('user_left', (data) => {
      setUsers(data.users);
      setMessages(prev => [...prev, {
        id: `system_${Date.now()}`,
        nickname: 'SISTEMA',
        text: `✗ ${data.nickname} se desconectó`,
        timestamp: Date.now(),
        isSystem: true
      }]);
    });

    newSocket.on('session_closed', () => {
      handleLogout();
    });

    return () => newSocket.close();
  }, [SOCKET_SERVER]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!nickname.trim()) {
      setLoginError('Ingresa un pseudónimo');
      return;
    }

    if (!password) {
      setLoginError('Ingresa la contraseña');
      return;
    }

    socket.emit('join_session', { password, nickname: nickname.trim() }, (response) => {
      if (response.success) {
        setIsConnected(true);
        setMessages(response.messages || []);
        setUsers(response.users || []);
        setPassword('');
        setLoginError('');
      } else {
        setLoginError(response.message);
      }
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

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
        <div className="login-card">
          <div className="login-icon">🔐</div>
          <h1>CONEXIÓN SEGURA</h1>
          <p className="subtitle">Chat secreto con pseudónimos</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Tu pseudónimo"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input-field"
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                placeholder="Contraseña secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>

            {loginError && <div className="error-message">{loginError}</div>}
            
            <button type="submit" className="login-btn">CONECTAR</button>
          </form>

          <p className="hint">La contraseña será compartida solo entre ustedes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-info">
          <h1>🔐 CHAT SECRETO</h1>
          <p>Pseudónimo: <strong>{nickname}</strong></p>
        </div>
        <div className="users-online">
          <span>🟢 En línea ({users.length}):</span>
          {users.map((user, idx) => (
            <span key={idx} className="user-pill">{user}</span>
          ))}
        </div>
        <button onClick={handleLogout} className="logout-btn">✕ CERRAR</button>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💫</div>
            <p>Esperando mensajes...</p>
            <p className="empty-hint">Todo lo que se escriba aquí desaparecerá cuando termines</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.isSystem ? 'system-message' : ''} ${msg.nickname === nickname ? 'own-message' : ''}`}
          >
            <div className="message-header">
              <span className="message-nickname">
                {msg.isSystem ? '⚡' : '✦'} {msg.nickname}
              </span>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="message-text">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escribe aquí... (se borrará después de cerrar)"
          className="message-input"
        />
        <button type="submit" className="send-btn">ENVIAR</button>
      </form>

      <div className="footer-info">
        ⚠️ Todos los mensajes se eliminarán cuando cierres la sesión
      </div>
    </div>
  );
}

export default App;
