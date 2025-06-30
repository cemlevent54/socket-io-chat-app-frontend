import React from 'react';
import './ChatList.css';

function ChatList({
  userChats = [],
  roomId,
  setRoomId,
  loadUserChats,
  apiLoading,
  showNewChat,
  setShowNewChat,
  allUsers,
  loadAllUsers,
  selectedUserId,
  setSelectedUserId,
  handleStartNewChat,
  userInfo
}) {
  // Mevcut chat yapılan userId'ler
  const chattedUserIds = userChats.map(chat =>
    chat.sender_id === userInfo?.userId ? chat.receiver_id : chat.sender_id
  );
  
  // Dropdown'da sadece daha önce chat yapılmamış kullanıcılar listelensin
  const availableUsers = allUsers.filter(u => u.id !== userInfo?.userId && !chattedUserIds.includes(u.id));

  return (
    <aside className="chatlist-sidebar">
      <div className="chatlist-header">
        <h2>Sohbetler</h2>
        <button 
          className="chatlist-refresh" 
          onClick={loadUserChats} 
          disabled={apiLoading}
          title="Yenile"
        >
          &#x21bb;
        </button>
        <button 
          className="chatlist-newchat" 
          onClick={() => { 
            setShowNewChat(!showNewChat); 
            loadAllUsers(); 
          }}
        >
          + Yeni Sohbet
        </button>
      </div>
      
      {showNewChat && (
        <div className="chatlist-newchat-panel">
          <select
            className="chatlist-newchat-select"
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
          >
            <option value="">Kullanıcı seç</option>
            {availableUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.email || user.id}
              </option>
            ))}
          </select>
          <button
            className="chatlist-newchat-start"
            onClick={handleStartNewChat}
            disabled={!selectedUserId || apiLoading}
          >
            Başlat
          </button>
        </div>
      )}
      
      <div className="chatlist-items">
        {userChats.length === 0 ? (
          <div className="chatlist-empty">Sohbet yok</div>
        ) : (
          userChats.map((chat) => (
            <div
              key={chat.id}
              className={`chatlist-item${roomId === chat.id ? ' active' : ''}`}
              onClick={() => setRoomId(chat.id)}
            >
              <div className="chatlist-item-title">{chat.otherUserName}</div>
              <div className="chatlist-item-last">
                <span className="chatlist-item-message">
                  {chat.lastMessage || 'Henüz mesaj yok'}
                </span>
                {chat.lastMessageTime && (
                  <span className="chatlist-item-time">{chat.lastMessageTime}</span>
                )}
                {chat.unreadCount > 0 && (
                  <span className="chatlist-item-unread">{chat.unreadCount}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

export default ChatList; 