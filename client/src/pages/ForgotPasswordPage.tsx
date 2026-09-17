import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi } from '../api/auth.api';
import { ApiClientError } from '../lib/apiClient';
import { CompuxLogo, Spinner, ErrorBanner } from '../components/primitives';

export function ForgotPasswordPage() {
  const { t } = useApp();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
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
          {sent ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">📧</div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t.resetLinkSentTitle}</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.resetLinkSentDesc}</p>
              <Link to="/auth" className="inline-block mt-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                {t.backToLogin}
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t.forgotPasswordTitle}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.forgotPasswordDesc}</p>
              </div>

              {error && <ErrorBanner message={error} />}

              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.email}
                className="w-full py-3 px-4 rounded-xl outline-none"
                style={{ background: 'var(--input-background, var(--muted))', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                autoComplete="email"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
              >
                {submitting ? <Spinner size={18} /> : t.sendResetLink}
              </button>

              <p className="text-center text-sm mt-2">
                <Link to="/auth" className="font-semibold" style={{ color: 'var(--primary)' }}>
                  {t.backToLogin}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
