import React from 'react';
import './ChatHeader.css';

function ChatHeader({ chatTitle, userInfo, leaveRoom, onRefresh }) {
  return (
    <header className="chatheader">
      <div className="chatheader-info">
        <span className="chatheader-title">{chatTitle}</span>
        <span className="chatheader-user">{userInfo?.email}</span>
      </div>
      <div className="chatheader-actions">
        <button className="chatheader-refresh" onClick={onRefresh}>
          Yenile
        </button>
        <button className="chatheader-leave" onClick={leaveRoom}>
          Çıkış
        </button>
      </div>
    </header>
  );
}

export default ChatHeader; 