import React from 'react';
import './ChatHeader.css';

function ChatHeader({ chatTitle, userInfo, leaveRoom }) {
  return (
    <header className="chatheader">
      <div className="chatheader-info">
        <span className="chatheader-title">{chatTitle}</span>
        <span className="chatheader-user">{userInfo?.email}</span>
      </div>
      <button className="chatheader-leave" onClick={leaveRoom}>
        Çıkış
      </button>
    </header>
  );
}

export default ChatHeader; 