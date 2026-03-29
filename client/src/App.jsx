import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [roomCreated, setRoomCreated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [chatError, setChatError] = useState('');
  const [mode, setMode] = useState('join');
  const messageIdsRef = useRef(new Set());
  const MAX_IMAGE_SIZE_BYTES = 512 * 1024; // 512 KB
  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
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

    const addMessage = (msg) => {
      if (!msg || !msg.id) return;
      if (messageIdsRef.current.has(msg.id)) return;
      messageIdsRef.current.add(msg.id);
      setMessages(prev => [...prev, msg]);
    };

    // 📨 MANEJADOR: Recibir mensajes con prevención de eco/duplicados
    // Valida que no exista un mensaje con el mismo ID antes de agregarlo
    const handleReceiveMessage = (msg) => {
      addMessage(msg);
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
    socket.off('receive_message', handleReceiveMessage);
    socket.off('user_joined', handleUserJoined);
    socket.off('user_left', handleUserLeft);
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
    
    // ✅ VALIDACIÓN: Pseudónimo y clave de sala requeridos
    if (!nickname.trim() || !password.trim()) {
      setLoginError('Pseudónimo y clave de sala obligatorios');
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
        messageIdsRef.current = new Set((res.messages || []).map((m) => m.id).filter(Boolean));
        setUsers(res.users || []);
        setPassword('');
        setGeneratedPassword('');
        setRoomCreated(false);
        setLoginError('');
        setChatError('');
        setStatusMessage('Has entrado a la sala correctamente');
      } else {
        // ❌ LOGIN FALLÓ
        // Mostrar error (contraseña incorrecta, pseudónimo duplicado, etc.)
        setLoginError(res.message);
        setChatError('');
        setStatusMessage('');
      }
    });
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!nickname.trim()) {
      setLoginError('Pseudónimo requerido para crear sala');
      return;
    }

    if (!socket) return;

    socket.emit('create_session', { nickname: nickname.trim() }, (res) => {
      if (res.success) {
        setIsConnected(true);
        setMessages(res.messages || []);
        messageIdsRef.current = new Set((res.messages || []).map((m) => m.id).filter(Boolean));
        setUsers(res.users || []);
        setGeneratedPassword(res.roomPassword || '');
        setRoomCreated(true);
        setPassword('');
        setLoginError('');
        setChatError('');
        setStatusMessage('Sala creada. Comparte la clave con quien quieras invitar.');
      } else {
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
      type: 'text',
      text: inputValue.trim(),
      timestamp: Date.now()
    };
    
    // ⚡ AGREGAR LOCALMENTE DE INMEDIATO
    // El mensaje aparece al instante en la UI sin esperar confirmación del servidor
    if (!messageIdsRef.current.has(localMsg.id)) {
      messageIdsRef.current.add(localMsg.id);
      setMessages(prev => [...prev, localMsg]);
    }
    
    // 📤 EMITIR AL SERVIDOR CON SU PROPIO ID
    // Usamos el mismo ID local para que el eco del servidor no genere un duplicado
    socket.emit('send_message', {
      id: localMsg.id,
      type: 'text',
      text: localMsg.text,
      timestamp: localMsg.timestamp
    });
    setInputValue('');
  };

  const handleImageSelected = (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setChatError('');
    setStatusMessage('');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setChatError('Formato de imagen no admitido. Usa PNG, JPG, WEBP o GIF.');
      input.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setChatError('La imagen es demasiado grande. Máx 512 KB.');
      input.value = '';
      return;
    }

    if (!socket) {
      setChatError('No estás conectado al servidor.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.startsWith('data:image/')) {
        setChatError('No se pudo procesar la imagen.');
        input.value = '';
        return;
      }

      const localMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        nickname,
        type: 'image',
        image: result,
        timestamp: Date.now(),
        text: ''
      };

      if (!messageIdsRef.current.has(localMsg.id)) {
        messageIdsRef.current.add(localMsg.id);
        setMessages(prev => [...prev, localMsg]);
      }

      socket.emit('send_message', {
        id: localMsg.id,
        type: 'image',
        image: result,
        timestamp: localMsg.timestamp
      });

      setStatusMessage('Imagen enviada');
      setLoginError('');
      setChatError('');
      input.value = '';
    };

    reader.onerror = () => {
      setChatError('Error leyendo la imagen.');
      input.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setLoginError('');
    setChatError('');
    setStatusMessage('');
    setPassword('');
  };

  const handleCopyRoomPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword).then(() => {
      setStatusMessage('Clave copiada al portapapeles');
      setLoginError('');
    }).catch(() => {
      setLoginError('No se pudo copiar la clave automáticamente');
      setStatusMessage('');
    });
  };

  const handleLogout = () => {
    socket.emit('leave_session');
    setIsConnected(false);
    setMessages([]);
    messageIdsRef.current.clear();
    setUsers([]);
    setNickname('');
    setPassword('');
    setGeneratedPassword('');
    setRoomCreated(false);
    setLoginError('');
    setChatError('');
    setStatusMessage('');
  };

  // 🌌 PANTALLA DE LOGIN CON FONDO DE GALAXIA
  // Se muestra antes de conectarse; tiene overlay oscuro con efecto galaxia animado
  if (!isConnected) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <h1>💜 Chat Seguro</h1>
          <p>Selecciona crear una sala privada o entrar con una clave existente.</p>
          
          <form onSubmit={mode === 'join' ? handleLogin : handleCreateRoom}>
            <div className="mode-switch">
              <button
                type="button"
                className={mode === 'join' ? 'active' : ''}
                onClick={() => { setMode('join'); setLoginError(''); setStatusMessage(''); setPassword(''); }}
              >
                Entrar a sala
              </button>
              <button
                type="button"
                className={mode === 'create' ? 'active' : ''}
                onClick={() => { setMode('create'); setLoginError(''); setStatusMessage(''); setPassword(''); }}
              >
                Crear sala segura
              </button>
            </div>

            <div className="input-group">
              <input 
                type="text" 
                value={nickname} 
                onChange={e => setNickname(e.target.value)} 
                placeholder="Pseudónimo..." 
              />
              {mode === 'join' && (
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Clave de sala..." 
                />
              )}
            </div>

            {mode === 'create' && (
              <p className="login-note">Al crear sala, se generará una clave privada para compartir.</p>
            )}
            {loginError && <p className="login-error">{loginError}</p>}
            {statusMessage && !loginError && <p className="login-status">{statusMessage}</p>}
            <div className="login-actions">
              <button type="submit" className="btn-connect">
                {mode === 'join' ? 'CONECTAR' : 'CREAR SALA'}
              </button>
            </div>
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
            {roomCreated && generatedPassword && (
              <div className="room-info">
                Contraseña de sala: <strong>{generatedPassword}</strong>
                <button type="button" className="btn-copy" onClick={handleCopyRoomPassword} title="Copiar clave">
                  📋
                </button>
              </div>
            )}
          </div>
          <button onClick={handleLogout}>Cerrar</button>
        </header>

        {(chatError || statusMessage) && (
          <div className="chat-feedback">
            {chatError && <p className="login-error">{chatError}</p>}
            {!chatError && statusMessage && <p className="login-status">{statusMessage}</p>}
          </div>
        )}

        <section className="message-area">
          {messages.length === 0 && <div className="empty-state">No hay mensajes</div>}
          {messages.map((msg) => (
            <div key={msg.id} className={`bubble ${msg.isSystem ? 'system' : msg.nickname === nickname ? 'self' : 'other'}`}>
              <div className="bubble-meta">
                <span>{msg.isSystem ? 'Sistema' : msg.nickname}</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              {msg.type === 'image' && msg.image ? (
                <div className="image-message">
                  <img src={msg.image} alt={msg.text || 'Imagen compartida'} />
                  {msg.text && <p>{msg.text}</p>}
                </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </section>

        <form className="input-bar" onSubmit={handleSendMessage}>
          <label htmlFor="image-upload" className="photo-button" title="Enviar foto">📷</label>
          <input
            id="image-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="file-input"
            onChange={handleImageSelected}
          />
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
