
import { useState, useRef, useEffect } from "react";
import { useApp } from "../../store";

// ── OTP Phone Verification Modal ───────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
];

export function OTPModal({ onClose }: { onClose: () => void }) {
  const { currentUser, verifyPhone } = useApp();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryList, setShowCountryList] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp") {
      setCountdown(60); setCanResend(false);
      const iv = setInterval(() => setCountdown((v) => { if (v <= 1) { clearInterval(iv); setCanResend(true); return 0; } return v - 1; }), 1000);
      return () => clearInterval(iv);
    }
  }, [step]);

  function handleSendOTP() {
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("otp"); setError(""); otpRefs.current[0]?.focus(); }, 1200);
  }

  function handleOtpChange(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  }

  function handleVerify() {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (currentUser) verifyPhone(currentUser.id, countryCode.code + " " + phone);
      onClose();
    }, 1000);
  }

  const inp: React.CSSProperties = { background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", width: "100%" };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm" style={{ border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-extrabold text-lg" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>
              {step === "phone" ? "📱 Phone Verification" : "🔐 Enter OTP"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>
              {step === "phone" ? "Add and verify your mobile number" : `Code sent to ${countryCode.code} ${phone}`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>✕</button>
        </div>

        {step === "phone" ? (
          <div className="flex flex-col gap-3">
            {/* Country selector */}
            <div className="relative">
              <button onClick={() => setShowCountryList((v) => !v)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm" style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif" }}>
                <span className="text-xl">{countryCode.flag}</span>
                <span>{countryCode.code} — {countryCode.name}</span>
                <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {showCountryList && (
                <div className="absolute z-10 w-full mt-1 rounded-xl overflow-auto" style={{ background: "var(--background)", border: "1px solid var(--border)", maxHeight: 220, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
                  {COUNTRY_CODES.map((c) => (
                    <button key={c.code + c.name} onClick={() => { setCountryCode(c); setShowCountryList(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left transition-all hover:opacity-80"
                      style={{ color: "var(--foreground)", fontFamily: "Inter, sans-serif" }}>
                      <span className="text-lg">{c.flag}</span>
                      <span className="flex-1">{c.name}</span>
                      <span style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input style={inp} type="tel" placeholder="770 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendOTP()} />
            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#f43f5e18", color: "#f43f5e" }}>{error}</p>}
            <button onClick={handleSendOTP} disabled={loading} className="gradient-bg glow text-white font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-60" style={{ fontFamily: "Outfit, sans-serif", fontSize: 15 }}>
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 6-digit OTP input */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                  style={{
                    background: digit ? "rgba(109,94,245,0.15)" : "var(--muted)",
                    border: digit ? "2px solid var(--primary)" : "1px solid var(--border)",
                    color: "var(--foreground)", fontFamily: "JetBrains Mono, monospace",
                  }}
                />
              ))}
            </div>
            {/* Countdown */}
            <div className="text-center">
              {canResend ? (
                <button onClick={() => { setOtp(["","","","","",""]); setStep("phone"); }} className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "Outfit, sans-serif" }}>
                  Resend Code
                </button>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>
                  Resend in <span style={{ color: "var(--primary)" }}>{countdown}s</span>
                </p>
              )}
            </div>
            {error && <p className="text-xs px-3 py-2 rounded-lg text-center" style={{ background: "#f43f5e18", color: "#f43f5e" }}>{error}</p>}
            <button onClick={handleVerify} disabled={loading || otp.join("").length < 6} className="gradient-bg glow text-white font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50" style={{ fontFamily: "Outfit, sans-serif", fontSize: 15 }}>
              {loading ? "Verifying..." : "Verify Number"}
            </button>
            <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>Any 6-digit code works in this demo</p>
          </div>
        )}
      </div>
    </div>
  );
}
EOF
echo "OTPModal written"
Output

OTPModal written
