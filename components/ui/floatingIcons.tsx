"use client";

type IconPos = { top?: string; bottom?: string; left?: string; right?: string; slow?: boolean };

const ICONS: IconPos[] = [
  { top: "80px", left: "72px", slow: true },
  { top: "120px", right: "88px" },
  { top: "160px", left: "32%" },
  { top: "200px", right: "34%" },
  { top: "260px", left: "25%" },
  { bottom: "160px", left: "48%" },
  { bottom: "120px", right: "64px" },
  { bottom: "200px", right: "25%" },
  { bottom: "140px", left: "20%" },
];

export default function FloatingIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {ICONS.map((p, i) => (
        <img
          key={i}
          src="/lightbulb.svg"
          alt="lightbulb"
          className={`absolute w-6 h-6 opacity-50 ${p.slow ? "bg-float-slow" : "bg-float"}`}
          style={{
            top: p.top,
            bottom: p.bottom,
            left: p.left,
            right: p.right,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}
