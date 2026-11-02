import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="26" height="26">
              <rect width="32" height="32" rx="7" fill="currentColor" />
              <path d="M9 10h14M9 16h14M9 22h8" stroke="#f4efe6" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="brand-name">Vault Ledger</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>Overview</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <NavLink to="/categories">Categories</NavLink>
        </nav>
        <div className="who">
          <span className="who-name">{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
