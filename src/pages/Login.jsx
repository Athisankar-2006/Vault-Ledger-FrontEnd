import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      // Wrong credentials usually surface as 4xx/5xx with no useful message
      setError(err.status === 0 ? err.message : err.status >= 400 && err.status < 600 && !err.message.startsWith('Signed in') ? 'Invalid email or password.' : err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">Vault Ledger</div>
        <h1>Sign in</h1>
        <p className="muted">Your personal books, kept in order.</p>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="auth-alt">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
