import React, { useEffect, useRef } from 'react';
import './MessageList.css';

function MessageList({ messages = [], typingUsers = [] }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mesajları veritabanı created_at alanına göre sırala
  const sortedMessages = [...messages].sort((a, b) => {
    const getTimestamp = (msg) => {
      // created_at varsa onu kullan, yoksa diğerlerini sırayla dene
      return (
        msg.created_at ||
        msg.createdAt ||
        msg.timestamp ||
        msg.originalTimestamp ||
        0
      );
    };
    const dateA = new Date(getTimestamp(a));
    const dateB = new Date(getTimestamp(b));
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateA.getTime() - dateB.getTime();
    }
    return (a.id || 0) - (b.id || 0);
  });

  return (
    <div className="messagelist-container">
      {sortedMessages.length === 0 ? (
        <div className="messagelist-empty">Henüz mesaj yok</div>
      ) : (
        sortedMessages.map((msg) => (
          <div
            key={msg.id}
            className={`messagelist-message${msg.isOwn ? ' own' : ' other'}${msg.type === 'system' ? ' system' : ''}${msg.status === 'sending' ? ' sending' : ''}`}
          >
            {msg.type === 'system' ? (
              <div className="messagelist-message-system">{msg.content}</div>
            ) : (
              <>
                <div className="messagelist-message-meta">
                  <span className="messagelist-message-sender">
                    {msg.isOwn ? 'Sen' : msg.senderName}
                  </span>
                  <span className="messagelist-message-time">
                    {msg.createdAt}
                    {msg.isOwn && (
                      <span className={`messagelist-message-status${(msg.status === 'read' || msg.isRead) ? ' read' : ''}`}>
                        {msg.status === 'sending' ? '⏳' : 
                         msg.status === 'read' || msg.isRead ? '✓✓' : 
                         msg.status === 'sent' ? '✓' : ''}
                      </span>
                    )}
                  </span>
                </div>
                <div className="messagelist-message-content">{msg.content}</div>
              </>
            )}
          </div>
        ))
      )}
      
      {typingUsers.length > 0 && (
        <div className="messagelist-typing">
          {typingUsers.map(u => u.userId).join(', ')} yazıyor...
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList; 