import React from 'react';
import './ChatRoom.css';

function ChatRoom({
  userInfo,
  userChats = [],
  messages = [],
  newMessage,
  setNewMessage,
  handleKeyPress,
  sendSocketMessage,
  leaveRoom,
  loadUserChats,
  roomId,
  setRoomId,
  apiLoading,
  typingUsers = [],
  error,
  showNewChat,
  setShowNewChat,
  allUsers,
  loadAllUsers,
  selectedUserId,
  setSelectedUserId,
  handleStartNewChat,
  handleTyping,
  socketLoading
}) {
  // Aktif chat objesini bul
  const activeChat = userChats.find(chat => chat.id === roomId);
  const chatTitle = activeChat?.otherUserName || 'Sohbet Seç';

  // Mevcut chat yapılan userId'ler
  const chattedUserIds = userChats.map(chat =>
    chat.sender_id === userInfo?.userId ? chat.receiver_id : chat.sender_id
  );
  // Dropdown'da sadece daha önce chat yapılmamış kullanıcılar listelensin
  const availableUsers = allUsers.filter(u => u.id !== userInfo?.userId && !chattedUserIds.includes(u.id));

  return (
    <div className="chatroom-layout">
      {/* SOL: Sohbet Listesi */}
      <aside className="chatroom-sidebar">
        <div className="chatroom-sidebar-header">
          <h2>Sohbetler</h2>
          <button className="chatroom-refresh" onClick={loadUserChats} disabled={apiLoading}>
            &#x21bb;
          </button>
          <button className="chatroom-newchat" onClick={() => { setShowNewChat(!showNewChat); loadAllUsers(); }}>
            + Yeni Sohbet
          </button>
        </div>
        {showNewChat && (
          <div className="chatroom-newchat-panel">
            <select
              className="chatroom-newchat-select"
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
            >
              <option value="">Kullanıcı seç</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name || user.email || user.id}</option>
              ))}
            </select>
            <button
              className="chatroom-newchat-start"
              onClick={handleStartNewChat}
              disabled={!selectedUserId || apiLoading}
            >
              Başlat
            </button>
          </div>
        )}
        <div className="chatroom-chatlist">
          {userChats.length === 0 ? (
            <div className="chatroom-empty">Sohbet yok</div>
          ) : (
            userChats.map((chat) => (
              <div
                key={chat.id}
                className={`chatroom-chatlist-item${roomId === chat.id ? ' active' : ''}`}
                onClick={() => setRoomId(chat.id)}
              >
                <div className="chatroom-chatlist-title">{chat.otherUserName}</div>
                <div className="chatroom-chatlist-last">
                  <span>{chat.lastMessage || 'Henüz mesaj yok'}</span>
                  {chat.lastMessageTime && (
                    <span className="chatroom-chatlist-time">{chat.lastMessageTime}</span>
                  )}
                  {chat.unreadCount > 0 && (
                    <span className="chatroom-chatlist-unread">{chat.unreadCount}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* SAĞ: Aktif Sohbet ve Mesajlar */}
      <section className="chatroom-main">
        <header className="chatroom-header">
          <div className="chatroom-header-info">
            <span className="chatroom-header-title">{chatTitle}</span>
            <span className="chatroom-header-user">{userInfo?.email}</span>
          </div>
          <button className="chatroom-leave" onClick={leaveRoom}>Çıkış</button>
        </header>

        <div className="chatroom-messages-container">
          {messages.length === 0 ? (
            <div className="chatroom-empty">Henüz mesaj yok</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatroom-message${msg.isOwn ? ' own' : ' other'}${msg.type === 'system' ? ' system' : ''}${msg.status === 'sending' ? ' sending' : ''}`}
              >
                {msg.type === 'system' ? (
                  <div className="chatroom-message-system">{msg.content}</div>
                ) : (
                  <>
                    <div className="chatroom-message-meta">
                      <span className="chatroom-message-sender">{msg.isOwn ? 'Sen' : msg.senderName}</span>
                      <span className="chatroom-message-time">
                        {msg.createdAt}
                        {msg.isOwn && (
                          <span className="chatroom-message-status">
                            {msg.status === 'sending' ? '⏳' : msg.status === 'sent' ? '✓' : msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="chatroom-message-content">{msg.content}</div>
                  </>
                )}
              </div>
            ))
          )}
          {typingUsers.length > 0 && (
            <div className="chatroom-typing">{typingUsers.map(u => u.userId).join(', ')} yazıyor...</div>
          )}
        </div>

        <form
          className="chatroom-inputbar"
          onSubmit={e => { e.preventDefault(); sendSocketMessage(); }}
        >
          <textarea
            className="chatroom-input"
            value={newMessage || ''}
            onChange={e => {
              setNewMessage(e.target.value);
              handleTyping(true);
            }}
            onBlur={() => handleTyping(false)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            rows={1}
          />
          <button type="submit" className="chatroom-send"
            disabled={(!newMessage || newMessage.trim() === '') || apiLoading || socketLoading}
          >
          </button>
        </form>
        {error && <div className="chatroom-error">{error}</div>}
      </section>
    </div>
  );
}

export default ChatRoom; 