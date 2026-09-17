import { useState, useRef, type ChangeEvent, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users.api';
import { authApi } from '../api/auth.api';
import { uploadsApi } from '../api/misc.api';
import { verificationApi } from '../api/messages.api';
import { ApiClientError } from '../lib/apiClient';
import { Avatar, Toggle, Spinner, ErrorBanner } from '../components/primitives';
import type { AllowDM } from '../types';

type Section = 'profile' | 'privacy' | 'appearance' | 'security';

export function SettingsPage() {
  const { t, lang, setLang, theme, toggleTheme, showToast } = useApp();
  const { user, refreshUser, logout, setUser } = useAuth();
  const [section, setSection] = useState<Section>('profile');

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
      <nav className="space-y-1">
        {(
          [
            ['profile', '👤', t.profileSettings],
            ['privacy', '🔒', t.privacySettings],
            ['appearance', '🎨', t.appearance],
            ['security', '🛡️', t.changePassword],
          ] as [Section, string, string][]
        ).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-start"
            style={section === id ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--foreground)' }}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-start" style={{ color: '#ef4444' }}>
          🚪 {t.logout}
        </button>
      </nav>

      <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {section === 'profile' && <ProfileSection onSaved={refreshUser} />}
        {section === 'privacy' && (
          <PrivacySection
            isPrivate={user.isPrivate}
            allowDM={user.allowDM}
            onChange={async (patch) => {
              const { profile } = await usersApi.updateProfile(patch);
              setUser({ ...user, ...profile });
              showToast(t.saved);
            }}
          />
        )}
        {section === 'appearance' && (
          <AppearanceSection lang={lang} setLang={setLang} theme={theme} toggleTheme={toggleTheme} />
        )}
        {section === 'security' && <SecuritySection />}
        {section === 'privacy' && <VerificationRow />}
      </div>
    </div>
  );
}

function VerificationRow() {
  const { t, showToast } = useApp();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;
  const status = user.verificationBadge?.status;

  async function handleRequest(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const idCardUrl = await uploadsApi.uploadFile(file);
      await verificationApi.request(idCardUrl);
      showToast(t.verifyPending);
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'تعذر إرسال الطلب.');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="pt-5 mt-5" style={{ borderTop: '1px solid var(--border)' }}>
      <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--foreground)' }}>{t.verificationTitle}</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>{t.verificationDesc}</p>
      {status === 'APPROVED' ? (
        <span className="text-sm font-semibold" style={{ color: '#7c3aed' }}>{t.verifyApproved}</span>
      ) : status === 'PENDING' ? (
        <span className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>{t.verifyPending}</span>
      ) : (
        <label className="text-sm font-bold cursor-pointer" style={{ color: 'var(--primary)' }}>
          {busy ? <Spinner size={16} /> : t.requestVerify}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleRequest} />
        </label>
      )}
    </div>
  );
}

function ProfileSection({ onSaved }: { onSaved: () => Promise<void> }) {
  const { t, showToast } = useApp();
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const avatarUrl = await uploadsApi.uploadFile(file);
      const { profile } = await usersApi.updateProfile({ avatarUrl });
      setUser({ ...user, ...profile });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const { profile } = await usersApi.updateProfile({ fullName, bio });
      setUser({ ...user, ...profile });
      await onSaved();
      showToast(t.saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t.profileSettings}</h2>
      <div className="flex items-center gap-4">
        <Avatar src={user.avatarUrl} name={user.fullName} size={64} />
        <label className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--primary)' }}>
          {uploading ? <Spinner size={16} /> : t.editProfile}
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
      </div>
      <label className="block">
        <span className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>{t.fullName}</span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full py-2.5 px-4 rounded-xl outline-none" style={fieldStyle} />
      </label>
      <label className="block">
        <span className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>{t.bio}</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} placeholder={t.bioPlaceholder} className="w-full py-2.5 px-4 rounded-xl outline-none resize-none" style={fieldStyle} />
      </label>
      <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-white" style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}>
        {saving ? <Spinner size={16} /> : t.saveChanges}
      </button>
    </div>
  );
}

function PrivacySection({
  isPrivate,
  allowDM,
  onChange,
}: {
  isPrivate: boolean;
  allowDM: AllowDM;
  onChange: (patch: { isPrivate?: boolean; allowDM?: AllowDM }) => void;
}) {
  const { t } = useApp();
  return (
    <div className="space-y-5">
      <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t.privacySettings}</h2>
      <Row label={t.privateProfile}>
        <Toggle checked={isPrivate} onChange={() => onChange({ isPrivate: !isPrivate })} />
      </Row>
      <Row label={t.allowDMs}>
        <Toggle checked={allowDM !== 'NONE'} onChange={() => onChange({ allowDM: allowDM === 'NONE' ? 'EVERYONE' : 'NONE' })} />
      </Row>
    </div>
  );
}

function AppearanceSection({
  lang,
  setLang,
  theme,
  toggleTheme,
}: {
  lang: 'en' | 'ar';
  setLang: (l: 'en' | 'ar') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}) {
  const { t } = useApp();
  return (
    <div className="space-y-5">
      <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t.appearance}</h2>
      <Row label={t.darkMode}>
        <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
      </Row>
      <Row label={t.language}>
        <select value={lang} onChange={(e) => setLang(e.target.value as 'en' | 'ar')} className="rounded-lg px-3 py-1.5 text-sm" style={fieldStyle}>
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
      </Row>
    </div>
  );
}

function SecuritySection() {
  const { t, showToast } = useApp();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmNew) return setError(t.passMismatch);
    setBusy(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      showToast(t.passwordUpdated);
      await logout();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOutAll() {
    if (signingOutAll || !window.confirm(t.signOutAllDevices + '؟')) return;
    setSigningOutAll(true);
    try {
      await authApi.logoutAll();
      await logout();
    } finally {
      setSigningOutAll(false);
    }
  }

  return (
    <div className="space-y-8 max-w-sm">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t.changePassword}</h2>
        {error && <ErrorBanner message={error} />}
        <input type="password" required placeholder={t.currentPassword} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full py-2.5 px-4 rounded-xl outline-none" style={fieldStyle} />
        <input type="password" required minLength={8} placeholder={t.newPassword} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full py-2.5 px-4 rounded-xl outline-none" style={fieldStyle} />
        <input type="password" required placeholder={t.confirmNew} value={confirmNew} onChange={(e) => setConfirmNew(e.target.value)} className="w-full py-2.5 px-4 rounded-xl outline-none" style={fieldStyle} />
        <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl font-bold text-white" style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}>
          {busy ? <Spinner size={16} /> : t.updatePassword}
        </button>
      </form>

      <div className="pt-6 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t.signOutAllDevices}</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.signOutAllDevicesDesc}</p>
        <button
          type="button"
          onClick={handleSignOutAll}
          disabled={signingOutAll}
          className="px-5 py-2.5 rounded-xl font-bold disabled:opacity-50"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
        >
          {signingOutAll ? <Spinner size={16} /> : t.signOutAllDevices}
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</span>
      {children}
    </div>
  );
}

const fieldStyle: CSSProperties = {
  background: 'var(--input-background, var(--muted))',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
};
