import React from 'react';
import ChatList from './ChatList';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ConnectionStatus from './ConnectionStatus';
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
  socketLoading,
  isConnected,
  loadChatMessages
}) {
  // Aktif chat objesini bul
  const activeChat = userChats.find(chat => chat.id === roomId);
  const chatTitle = activeChat?.otherUserName || 'Sohbet Seç';

  const handleRefresh = () => {
    if (typeof loadChatMessages === 'function') {
      loadChatMessages();
    }
  };

  return (
    <div className="chatroom-layout">
      {/* SOL: Sohbet Listesi */}
      <ChatList
        userChats={userChats}
        roomId={roomId}
        setRoomId={setRoomId}
        loadUserChats={loadUserChats}
        apiLoading={apiLoading}
        showNewChat={showNewChat}
        setShowNewChat={setShowNewChat}
        allUsers={allUsers}
        loadAllUsers={loadAllUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        handleStartNewChat={handleStartNewChat}
        userInfo={userInfo}
      />

      {/* SAĞ: Aktif Sohbet ve Mesajlar */}
      <section className="chatroom-main">
        <ChatHeader
          chatTitle={chatTitle}
          userInfo={userInfo}
          leaveRoom={leaveRoom}
          onRefresh={handleRefresh}
        />

        <div className="chatroom-content">
          <ConnectionStatus 
            isConnected={isConnected}
            error={error}
          />
          
          <MessageList
            messages={messages}
            typingUsers={typingUsers}
          />

          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleKeyPress={handleKeyPress}
            sendSocketMessage={sendSocketMessage}
            handleTyping={handleTyping}
            apiLoading={apiLoading}
            socketLoading={socketLoading}
          />
        </div>
      </section>
    </div>
  );
}

export default ChatRoom; 