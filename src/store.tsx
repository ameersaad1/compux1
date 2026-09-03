cat > /home/claude/compux/src/components/primitives.tsx << 'PEOF'
import { useApp } from "../store";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// Small, stateless (or near-stateless) building blocks reused across the app.
// ═══════════════════════════════════════════════════════════════════════════════

export function CompuxLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6d5ef5" /><stop offset="50%" stopColor="#a855f7" /><stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path d="M22 8C14.27 8 8 14.27 8 22C8 29.73 14.27 36 22 36C25.5 36 28.7 34.72 31.14 32.6L28.02 29.48C26.4 30.76 24.29 31.6 22 31.6C16.7 31.6 12.4 27.3 12.4 22C12.4 16.7 16.7 12.4 22 12.4C24.29 12.4 26.4 13.24 28.02 14.52L31.14 11.4C28.7 9.28 25.5 8 22 8Z" fill="url(#lg1)" />
      <path d="M26 15L32 21M32 15L26 21" stroke="url(#lg1)" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function Av({ src, name, size = 40, online = false }: { src: string; name: string; size?: number; online?: boolean }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <img src={src} alt={name} className="rounded-full object-cover w-full h-full" style={{ border: "2px solid rgba(109,94,245,0.35)" }} />
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400" style={{ border: "2px solid var(--background)" }} />}
    </div>
  );
}

export function VerBadge({ color = "#7c3aed", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r="10" fill={color} />
      <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative w-11 h-6 rounded-full transition-all flex-shrink-0" style={{ background: checked ? "var(--primary)" : "var(--muted)" }}>
      <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all" style={{ left: checked ? "calc(100% - 20px)" : "4px" }} />
    </button>
  );
}

export function GlobalToast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-semibold text-white gradient-bg glow" style={{ fontFamily: "Outfit, sans-serif", pointerEvents: "none", boxShadow: "0 8px 32px rgba(109,94,245,0.4)" }}>
      ✓ {toast}
    </div>
  );
}

// Skeleton loader
export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-4 animate-pulse" style={{ border: "1px solid var(--border)" }}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: "var(--muted)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded-full w-1/3" style={{ background: "var(--muted)" }} />
          <div className="h-3 rounded-full w-2/3" style={{ background: "var(--muted)" }} />
          <div className="h-3 rounded-full w-1/2" style={{ background: "var(--muted)" }} />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-12 flex flex-col items-center text-center" style={{ border: "1px solid var(--border)" }}>
      <span className="text-5xl mb-4">{emoji}</span>
      <p className="font-bold text-base mb-1" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{title}</p>
      {sub && <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{sub}</p>}
    </div>
  );
}
PEOF
echo "primitives.tsx written"
Output

primitives.tsx written
