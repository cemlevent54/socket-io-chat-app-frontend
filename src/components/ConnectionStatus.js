import React from 'react';
import './ConnectionStatus.css';

function ConnectionStatus({ isConnected, error }) {
  return (
    <div className="connectionstatus">
      <div className="connectionstatus-status">
        <span className={`connectionstatus-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '●' : '○'}
        </span>
        <span className="connectionstatus-text">
          {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
        </span>
      </div>
      {error && (
        <div className="connectionstatus-error">
          {error}
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus; 