
import { useApp } from " ./../store";
import { VerBadge } from "../primitives";
import type { Badge } from "../../types";

export function BadgeModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const { lang } = useApp();
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="glass rounded-3xl p-8 max-w-xs w-full text-center" style={{ border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4" style={{ background: badge.color + "22", border: "2px solid " + badge.color + "44" }}>{badge.emoji}</div>
        <h2 className="text-xl font-extrabold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{lang === "ar" ? badge.nameAr : badge.name}</h2>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{lang === "ar" ? badge.descAr : badge.desc}</p>
        <p className="text-xs font-mono" style={{ color: badge.color }}>Earned {badge.earnedAt}</p>
        <button onClick={onClose} className="mt-5 w-full py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>Close</button>
      </div>
    </div>
  );
}
EOF

cat > /home/claude/compux/src/components/modals/LightboxModal.tsx << 'EOF'
export function LightboxModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <img src={src} alt="media" className="max-w-full max-h-full rounded-2xl object-contain" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: "rgba(255,255,255,0.15)" }}>✕</button>
    </div>
  );
}
EOF
echo "BadgeModal + LightboxModal written"
Output

BadgeModal + LightboxModal written
