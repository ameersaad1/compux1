import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi } from '../api/auth.api';
import { ApiClientError } from '../lib/apiClient';
import { CompuxLogo, Spinner, ErrorBanner } from '../components/primitives';

export function ResetPasswordPage() {
  const { t, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    if (newPassword !== confirmNew) return setError(t.passMismatch);
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setDone(true);
      showToast(t.resetSuccessTitle);
      setTimeout(() => navigate('/auth', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'تعذر الاتصال بالخادم. حاول مجدداً.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <CompuxLogo size={48} />
        </div>

        <div className="rounded-3xl p-7" style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)' }}>
          {!token ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">⚠️</div>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>{t.invalidResetLink}</p>
              <Link to="/forgot-password" className="inline-block mt-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                {t.forgotPasswordLink}
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t.resetSuccessTitle}</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.resetSuccessDesc}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t.resetPasswordTitle}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.resetPasswordDesc}</p>
              </div>

              {error && <ErrorBanner message={error} />}

              <input
                type="password"
                required
                minLength={8}
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.newPassword}
                className="w-full py-3 px-4 rounded-xl outline-none"
                style={{ background: 'var(--input-background, var(--muted))', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                autoComplete="new-password"
              />
              <input
                type="password"
                required
                value={confirmNew}
                onChange={(e) => setConfirmNew(e.target.value)}
                placeholder={t.confirmNew}
                className="w-full py-3 px-4 rounded-xl outline-none"
                style={{ background: 'var(--input-background, var(--muted))', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                autoComplete="new-password"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
              >
                {submitting ? <Spinner size={18} /> : t.resetPasswordBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
