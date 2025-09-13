"use client";

type IconPos = { top?: string; bottom?: string; left?: string; right?: string };

const ICONS: IconPos[] = [
  // edges
  { top: "8%", left: "10%" },
  { top: "12%", right: "12%" },
  { top: "16%", right: "60%" },
  { bottom: "10%", left: "15%" },
  { bottom: "8%", right: "18%" },

  // subtle middle (spread high/low so they don’t overlap text/cards)
  { top: "35%", left: "8%" },   // left-center
  { top: "40%", right: "10%" }, // right-center
  { bottom: "30%", left: "45%" } // one faint bulb near center bottom
];

export default function FloatingIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {ICONS.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: p.top, bottom: p.bottom, left: p.left, right: p.right }}
        >
          <img
            src="/lightbulb.svg"
            alt="lightbulb"
            className="w-6 h-6 opacity-40 float"
          />
        </div>
      ))}
    </div>
  );
}
