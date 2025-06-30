import React from 'react';
import './Login.css';

function Login({ email, password, setEmail, setPassword, handleLogin, error }) {
  return (
    <div className="login">
      <h2>Giriş Yap</h2>
      <form onSubmit={handleLogin} className="login__form">
        <input
          type="email"
          placeholder="E-posta"
          value={email || ''}
          onChange={e => setEmail(e.target.value)}
          className="login__input"
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password || ''}
          onChange={e => setPassword(e.target.value)}
          className="login__input"
          autoComplete="current-password"
        />
        <button type="submit" className="login__button">Giriş Yap</button>
      </form>
      {error && <div className="login__error">{error}</div>}
    </div>
  );
}

export default Login; 