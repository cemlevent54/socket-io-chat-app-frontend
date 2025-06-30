import React from 'react';
import './MessageInput.css';

function MessageInput({
  newMessage,
  setNewMessage,
  handleKeyPress,
  sendSocketMessage,
  handleTyping,
  apiLoading,
  socketLoading
}) {
  return (
    <form
      className="messageinput-form"
      onSubmit={e => { 
        e.preventDefault(); 
        sendSocketMessage(); 
      }}
    >
      <textarea
        className="messageinput-textarea"
        value={newMessage || ''}
        onChange={e => {
          setNewMessage(e.target.value);
          handleTyping(true);
        }}
        onBlur={() => handleTyping(false)}
        onKeyPress={handleKeyPress}
        placeholder="Mesajınızı yazın..."
        rows={1}
        disabled={apiLoading || socketLoading}
      />
      <button 
        type="submit" 
        className="messageinput-send"
        disabled={(!newMessage || newMessage.trim() === '') || apiLoading || socketLoading}
        title="Gönder"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </form>
  );
}

export default MessageInput; 