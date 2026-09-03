
import { useState } from "react";
import { useApp, INITIAL_USERS } from "../store";
import { CompuxLogo } from "../components/primitives";
import type { User } from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function AuthScreen() {
  const { t, lang, setLang, setCurrentUser, setView, dark, setDark, users, setUsers } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(""); const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState(""); const [major, setMajor] = useState("");
  const [error, setError] = useState(""); const [showDev, setShowDev] = useState(false);
  const [loading, setLoading] = useState(false);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const devUser = INITIAL_USERS[0];

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const found = users.find((u) => u.email === email && u.password === password);
      if (!found) { setError(t.wrongCreds); setLoading(false); return; }
      setCurrentUser(found); setView("feed"); setLoading(false);
    }, 800);
  }

  function generateHandle(name: string) {
    const base = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    let h = base; let n = 1;
    while (users.some((u) => u.handle === h)) { h = base + n; n++; }
    return h;
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(t.passMismatch); return; }
    if (users.some((u) => u.email === email)) { setError("Email already in use."); return; }
    const newUser: User = {
      id: "u_" + Date.now(), email, password, name: fullName || "New Student",
      handle: generateHandle(fullName || "student"), role: major || "Student", bio: "",
      university: university || "University", faculty: "", major: major || "Undeclared", studyLevel: "Freshman",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format",
      coverUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=900&h=300&fit=crop&auto=format",
      isAdmin: false, isVerified: false, verificationPending: false, verificationColor: "#7c3aed",
      followers: [], following: [], postCount: 0, studyHours: 0, badges: [],
      github: "", linkedin: "", phone: "", phoneVerified: false, showPhone: false, banned: false,
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser); setView("feed");
  }

  const inp: React.CSSProperties = { background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", width: "100%" };

  return (
    <div className="gradient-mesh min-h-screen flex items-center justify-center p-4" dir={dir}>
      <div className="fixed top-4 right-4 flex gap-2">
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
        <button onClick={() => setDark(!dark)} className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: "var(--muted)" }}>{dark ? "☀️" : "🌙"}</button>
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="glow rounded-2xl p-3 mb-3" style={{ background: "var(--secondary)" }}><CompuxLogo size={44} /></div>
          <h1 className="text-3xl font-extrabold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>{t.appName}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{t.tagline}</p>
        </div>
        <div className="glass rounded-2xl p-6" style={{ border: "1px solid var(--border)" }}>
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "var(--muted)" }}>
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all active:scale-95"
                style={{ background: mode === m ? "var(--primary)" : "transparent", color: mode === m ? "#fff" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
                {m === "login" ? t.login : t.signup}
              </button>
            ))}
          </div>
          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="flex flex-col gap-3">
            {mode === "signup" && (
              <>
                <input style={inp} placeholder={t.fullName} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <input style={inp} placeholder={t.university} value={university} onChange={(e) => setUniversity(e.target.value)} />
                <input style={inp} placeholder={t.major} value={major} onChange={(e) => setMajor(e.target.value)} />
              </>
            )}
            <input style={inp} type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input style={inp} type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} required />
            {mode === "signup" && <input style={inp} type="password" placeholder={t.confirmPassword} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />}
            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#f43f5e18", color: "#f43f5e" }}>{error}</p>}
            <button type="submit" disabled={loading} className="gradient-bg glow text-white font-bold py-3 rounded-xl mt-1 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60" style={{ fontFamily: "Outfit, sans-serif", fontSize: 15 }}>
              {loading ? "..." : mode === "login" ? t.login : t.signup}
            </button>
          </form>
          {mode === "login" && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => setShowDev((v) => !v)} className="w-full text-xs text-center hover:opacity-80 transition-opacity" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>
                🛠 {t.devHint}
              </button>
              {showDev && (
                <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: "var(--secondary)", border: "1px solid var(--border)", fontFamily: "JetBrains Mono, monospace" }}>
                  <div className="flex justify-between mb-1"><span style={{ color: "var(--muted-foreground)" }}>email:</span><span style={{ color: "var(--primary)" }}>{devUser.email}</span></div>
                  <div className="flex justify-between mb-2"><span style={{ color: "var(--muted-foreground)" }}>pass:</span><span style={{ color: "var(--primary)" }}>{devUser.password}</span></div>
                  <button onClick={() => { setEmail(devUser.email); setPassword(devUser.password); setError(""); }} className="w-full gradient-bg text-white text-xs py-1.5 rounded-lg font-semibold">Auto-fill</button>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "var(--muted-foreground)" }}>
          {mode === "login" ? t.noAccount : t.hasAccount}{" "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="font-semibold" style={{ color: "var(--primary)" }}>
            {mode === "login" ? t.signup : t.login}
          </button>
        </p>
      </div>
    </div>
  );
}
EOF
echo "AuthScreen written"
Output

AuthScreen written
