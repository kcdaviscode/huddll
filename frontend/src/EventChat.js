import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import theme from './theme';

const EventChat = ({ eventId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isMinimized, setIsMinimized] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const wsUrl = `ws://localhost:8000/ws/chat/${eventId}/?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'chat_history':
          setMessages(data.messages);
          break;

        case 'chat_message':
          setMessages(prev => [...prev, data.message]);
          // Increment unread count if minimized and message is from someone else
          if (isMinimized && data.message.user.id !== currentUser.id) {
            setUnreadCount(prev => prev + 1);
          }
          break;

        case 'user_join':
          setOnlineUsers(prev => new Set(prev).add(data.user.id));
          break;

        case 'user_leave':
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.user.id);
            return newSet;
          });
          break;

        case 'user_typing':
          setTypingUsers(prev => new Set(prev).add(data.user.first_name));

          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.user.first_name);
              return newSet;
            });
          }, 3000);
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [eventId, currentUser.id, isMinimized]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || !isConnected) return;

    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: inputMessage.trim()
    }));

    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (wsRef.current && isConnected) {
      clearTimeout(typingTimeoutRef.current);

      wsRef.current.send(JSON.stringify({
        type: 'typing'
      }));

      typingTimeoutRef.current = setTimeout(() => {
        // Typing stopped
      }, 1000);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      // When minimizing, do nothing to unread count
    } else {
      // When expanding, reset unread count
      setUnreadCount(0);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isMinimized ? 'auto' : '500px',
      backgroundColor: theme.slateLight,
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${theme.border}`,
      transition: 'height 0.3s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header - Always Visible */}
      <div
        onClick={toggleMinimize}
        style={{
          padding: '16px 20px',
          backgroundColor: theme.slate,
          borderBottom: isMinimized ? 'none' : `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MessageCircle size={20} color={theme.skyBlue} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? theme.success : theme.error,
              boxShadow: isConnected ? `0 0 8px ${theme.success}` : 'none'
            }} />
            <span style={{ color: theme.textMain, fontWeight: '600' }}>Event Chat</span>
          </div>

          {/* Unread Badge */}
          {isMinimized && unreadCount > 0 && (
            <div style={{
              backgroundColor: theme.error,
              color: 'white',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: '700',
              minWidth: '20px',
              textAlign: 'center',
              boxShadow: `0 0 12px ${theme.error}80`
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isMinimized && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.textSecondary, fontSize: '14px' }}>
              <Users size={16} />
              <span>{onlineUsers.size} online</span>
            </div>
          )}

          {isMinimized ? (
            <ChevronDown size={20} color={theme.textSecondary} />
          ) : (
            <ChevronUp size={20} color={theme.textSecondary} />
          )}
        </div>
      </div>

      {/* Chat Content - Hidden When Minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: theme.deepNavy
          }}>
            {messages.map((msg, idx) => {
              const isOwnMessage = msg.user.id === currentUser.id;

              return (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                  }}
                >
                  {!isOwnMessage && (
                    <div style={{
                      fontSize: '12px',
                      color: theme.textSecondary,
                      marginBottom: '4px',
                      paddingLeft: '12px'
                    }}>
                      {msg.user.first_name} {msg.user.last_name}
                    </div>
                  )}

                  <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    backgroundColor: isOwnMessage ? theme.skyBlue : theme.slateLight,
                    color: isOwnMessage ? 'white' : theme.textMain,
                    wordWrap: 'break-word',
                    boxShadow: isOwnMessage ? `0 0 20px ${theme.skyBlue}40` : 'none'
                  }}>
                    {msg.message}
                  </div>

                  <div style={{
                    fontSize: '11px',
                    color: theme.textLight,
                    marginTop: '4px',
                    paddingLeft: '12px',
                    paddingRight: '12px'
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              );
            })}

            {typingUsers.size > 0 && (
              <div style={{
                fontSize: '13px',
                color: theme.textSecondary,
                fontStyle: 'italic',
                paddingLeft: '12px'
              }}>
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: theme.slate,
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: theme.slateLight,
                border: `1px solid ${theme.border}`,
                borderRadius: '24px',
                color: theme.textMain,
                fontSize: '14px',
                outline: 'none'
              }}
            />

            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || !isConnected}
              style={{
                padding: '12px',
                background: inputMessage.trim() && isConnected ? theme.accentGradient : theme.slateLight,
                border: 'none',
                borderRadius: '50%',
                cursor: inputMessage.trim() && isConnected ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                opacity: inputMessage.trim() && isConnected ? 1 : 0.5,
                boxShadow: inputMessage.trim() && isConnected ? `0 4px 12px ${theme.skyBlue}40` : 'none'
              }}
            >
              <Send size={18} color="white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EventChat;