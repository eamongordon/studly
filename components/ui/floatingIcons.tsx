"use client";

type IconPos = { top?: string; bottom?: string; left?: string; right?: string };

const ICONS: IconPos[] = [
  { top: "80px", left: "72px" },
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
        <div
          key={i}
          className="absolute float-sync"
          style={{ top: p.top, bottom: p.bottom, left: p.left, right: p.right }}
        >
          <div className="spin-sync">
            <img
              src="/lightbulb.svg"
              alt="lightbulb"
              className="w-6 h-6 opacity-50 wobble-sync"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
