import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { GlobalToast, Spinner } from './components/primitives';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPanel } from './pages/AdminPanel';
import { GroupsPage } from './pages/GroupsPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { EventsPage } from './pages/EventsPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { E2EEService } from './utils/crypto';
import { publicKeyApi } from './api/messages.api';

/** Blocks the route until we know, for certain, whether a real session exists on the server. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RequireStaff({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <Spinner size={28} />
    </div>
  );
}

function EnsurePublicKeyPublished() {
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (!user || user.identityPublicKey) return;
    E2EEService.getPublicKeyBase64()
      .then(async (key) => {
        await publicKeyApi.publish(key);
        setUser({ ...user, identityPublicKey: key });
      })
      .catch((err) => console.error('Failed to publish E2EE public key', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.identityPublicKey]);

  return null;
}

function AppShell() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <EnsurePublicKeyPublished />
      <Navbar />
      <Routes>
        <Route path="/auth" element={<RedirectIfAuthed><AuthPage /></RedirectIfAuthed>} />
        <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPasswordPage /></RedirectIfAuthed>} />
        <Route path="/reset-password" element={<RedirectIfAuthed><ResetPasswordPage /></RedirectIfAuthed>} />
        <Route path="/" element={<RequireAuth><FeedPage /></RequireAuth>} />
        <Route path="/profile/:username" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/groups" element={<RequireAuth><GroupsPage /></RequireAuth>} />
        <Route path="/groups/:groupId" element={<RequireAuth><GroupDetailPage /></RequireAuth>} />
        <Route path="/events" element={<RequireAuth><EventsPage /></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
        <Route path="/messages/:username" element={<RequireAuth><MessagesPage /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireStaff><AdminPanel /></RequireStaff>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalToast />
    </div>
  );
}

function LangDirWrapper({ children }: { children: ReactNode }) {
  useApp(); // keeps <html lang/dir> in sync via its own effects
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <LangDirWrapper>
          <AuthProvider>
            <SocketProvider>
              <AppShell />
            </SocketProvider>
          </AuthProvider>
        </LangDirWrapper>
      </AppProvider>
    </BrowserRouter>
  );
}
