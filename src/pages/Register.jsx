import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    try {
      await authApi.register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.status === 0 ? err.message : 'Could not create the account. That email may already be registered.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">Vault Ledger</div>
        <h1>Create account</h1>
        <p className="muted">It takes under a minute.</p>

        <label className="field">
          <span>Full name</span>
          <input value={form.name} onChange={set('name')} required autoFocus autoComplete="name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </label>
        <label className="field">
          <span>Phone number</span>
          <input type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} autoComplete="tel" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={set('password')} required autoComplete="new-password" />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="auth-alt">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
