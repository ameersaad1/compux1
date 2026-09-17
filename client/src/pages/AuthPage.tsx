import { useState, useEffect, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth.api';
import { ApiClientError } from '../lib/apiClient';
import { CompuxLogo, Spinner, ErrorBanner } from '../components/primitives';

type Mode = 'login' | 'register' | 'verify';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const currentYear = new Date().getFullYear();

export function AuthPage() {
  const { t, lang, showToast } = useApp();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [graduationYear, setGraduationYear] = useState(currentYear + 1);

  // OTP verification
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // Render Google's official Sign-In button once its script is present.
  useEffect(() => {
    if (mode === 'verify' || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    function renderButton() {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          setError(null);
          setIsSubmitting(true);
          try {
            await loginWithGoogle(response.credential);
            navigate('/', { replace: true });
          } catch (err) {
            setError(resolveErrorMessage(err));
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        locale: lang,
      });
    }

    if (window.google) {
      renderButton();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = renderButton;
    document.body.appendChild(script);
    return () => {
      script.onload = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lang]);

  function resolveErrorMessage(err: unknown): string {
    if (err instanceof ApiClientError) {
      if (err.details?.length) return err.details[0]!.message;
      return err.error;
    }
    return 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مجدداً.';
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'EMAIL_NOT_VERIFIED') {
        setPendingUserId((err.body.userId as string | undefined) ?? null);
        setPendingEmail(email);
        setMode('verify');
        showToast('يرجى تفعيل بريدك الإلكتروني أولاً');
      } else {
        setError(resolveErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (regPassword !== confirmPassword) {
      setError(t.passMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authApi.register({
        email: regEmail,
        username,
        fullName,
        password: regPassword,
        universityName,
        graduationYear,
      });
      setPendingUserId(result.userId);
      setPendingEmail(result.email);
      setMode('verify');
      setResendCooldown(60);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!pendingUserId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.verifyOtp(pendingUserId, otpCode);
      showToast('تم تفعيل حسابك بنجاح، يمكنك تسجيل الدخول الآن');
      setMode('login');
      setEmail(pendingEmail);
      setOtpCode('');
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      await authApi.resendOtp(pendingEmail);
      showToast('تم إرسال رمز جديد');
      setResendCooldown(60);
    } catch (err) {
      setError(resolveErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <CompuxLogo size={48} />
          <h1 className="mt-3 text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>
            {t.appName}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {t.tagline}
          </p>
        </div>

        <div className="rounded-3xl p-7" style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)' }}>
          {mode === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                  {t.verifyEmailTitle}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {t.verifyEmailDesc} <span className="font-semibold">{pendingEmail}</span>
                </p>
              </div>

              {error && <ErrorBanner message={error} />}

              <input
                inputMode="numeric"
                autoFocus
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder={t.verifyCodePlaceholder}
                className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 rounded-xl outline-none"
                style={inputStyle}
              />

              <button type="submit" disabled={isSubmitting || otpCode.length !== 6} className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={primaryButtonStyle}>
                {isSubmitting ? <Spinner size={18} /> : t.verifyBtn}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="w-full text-sm font-semibold py-1 disabled:opacity-50"
                style={{ color: 'var(--primary)' }}
              >
                {t.resendCode} {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
              </button>
            </form>
          ) : mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <ErrorBanner message={error} />}
              <Field label={t.email}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none" style={inputStyle} autoComplete="email" />
              </Field>
              <Field label={t.password}>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none" style={inputStyle} autoComplete="current-password" />
              </Field>
              <p className="text-end -mt-2">
                <Link to="/forgot-password" className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                  {t.forgotPasswordLink}
                </Link>
              </p>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={primaryButtonStyle}>
                {isSubmitting ? <Spinner size={18} /> : t.login}
              </button>

              {GOOGLE_CLIENT_ID && (
                <>
                  <Divider label={t.orDivider} />
                  <div className="flex justify-center" ref={googleButtonRef} />
                </>
              )}

              <p className="text-center text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                {t.noAccount}{' '}
                <button type="button" onClick={() => { setMode('register'); setError(null); }} className="font-semibold" style={{ color: 'var(--primary)' }}>
                  {t.signup}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {error && <ErrorBanner message={error} />}
              <Field label={t.fullName}>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none" style={inputStyle} />
              </Field>
              <Field label={t.email} hint={t.eduEmailNote}>
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none" style={inputStyle} />
              </Field>
              <Field label={t.usernameNote}>
                <input required value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className="w-full py-3 px-4 rounded-xl outline-none" style={inputStyle} />
              </Field>
              <Field label={t.university}>
                <input required value={universityName} onChange={(e) => setUniversityName(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none" style={inputStyle} />
              </Field>
              <Field label={t.graduationYear}>
                <input type="number" required min={currentYear} max={currentYear + 8} value={graduationYear} onChange={(e) => setGraduationYear(Number(e.target.value))} className="w-full py-3 px-4 rounded-xl outline-none" style={inputStyle} />
              </Field>
              <Field label={t.password}>
                <input type="password" required minLength={8} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none" style={inputStyle} autoComplete="new-password" />
              </Field>
              <Field label={t.confirmPassword}>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none" style={inputStyle} autoComplete="new-password" />
              </Field>

              <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 mt-1" style={primaryButtonStyle}>
                {isSubmitting ? <Spinner size={18} /> : t.signup}
              </button>

              <p className="text-center text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                {t.hasAccount}{' '}
                <button type="button" onClick={() => { setMode('login'); setError(null); }} className="font-semibold" style={{ color: 'var(--primary)' }}>
                  {t.login}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}

const inputStyle: CSSProperties = {
  background: 'var(--input-background, var(--muted))',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
};

const primaryButtonStyle: CSSProperties = {
  background: 'linear-gradient(135deg,#6d5ef5,#a855f7)',
};
