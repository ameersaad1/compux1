import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Avatar, CompuxLogo } from './primitives';
import { SearchModal } from './SearchModal';

export function Navbar() {
  const { t, toggleTheme, theme } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/auth', { replace: true });
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur"
      style={{ background: 'color-mix(in srgb, var(--background) 85%, transparent)', borderBottom: '1px solid var(--border)' }}
    >
      <Link to="/" className="flex items-center gap-2">
        <CompuxLogo size={28} />
        <span className="font-extrabold text-lg" style={{ color: 'var(--foreground)' }}>{t.appName}</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
        <NavLink to="/">{t.home}</NavLink>
        <NavLink to="/groups">{t.groups}</NavLink>
        <NavLink to="/events">{t.events}</NavLink>
        {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && <NavLink to="/admin">{t.admin}</NavLink>}
      </nav>

      <div className="flex items-center gap-2">
        {user && (
          <button onClick={() => setSearchOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--muted)' }} aria-label="search">
            🔍
          </button>
        )}
        <button onClick={toggleTheme} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--muted)' }} aria-label="toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {user ? (
          <>
            <Link to="/messages" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--muted)' }} aria-label="messages">
              ✉️
            </Link>
            <Link to="/notifications" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--muted)' }} aria-label="notifications">
              🔔
            </Link>
            <Link to={`/profile/${user.username}`}>
              <Avatar src={user.avatarUrl} name={user.fullName} size={36} />
            </Link>
            <Link to="/settings" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--muted)' }} aria-label="settings">
              ⚙️
            </Link>
            <button onClick={handleLogout} className="text-sm font-semibold" style={{ color: '#ef4444' }}>
              {t.logout}
            </button>
          </>
        ) : (
          <Link to="/auth" className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}>
            {t.login}
          </Link>
        )}
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="px-3 py-2 rounded-lg" style={{ color: 'var(--foreground)' }}>
      {children}
    </Link>
  );
}
