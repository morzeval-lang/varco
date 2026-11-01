import { useId } from "react";

/**
 * Sfondi fissi delle scene, dipinti in SVG come segnaposto. Coprono il riquadro (-100,-50)-(1700,950)
 * per lasciare margine ai movimenti di camera; la linea del terreno, dove poggiano i piedi, è a y = 760.
 * Con un'illustrazione definitiva (1800×1000) si passa `immagine` e si usa quella.
 */
export function Sfondo({ arena, immagine }: { arena: string; immagine?: string }) {
  if (immagine) return <image href={immagine} x={-100} y={-50} width={1800} height={1000} preserveAspectRatio="xMidYMid slice" />;
  switch (arena) {
    case "cortile_castello":
      return <CortileCastello />;
    case "postapo_autostrada":
    default:
      return <AutostradaInRovina />;
  }
}

function CortileCastello() {
  const u = useId().replace(/:/g, "");
  const merli = Array.from({ length: 24 }, (_, i) => -100 + i * 78);
  const pietre = Array.from({ length: 9 }, (_, i) => i);
  return (
    <g>
      <defs>
        <linearGradient id={`cielo-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2350" />
          <stop offset="0.55" stopColor="#7a4a78" />
          <stop offset="1" stopColor="#f0a070" />
        </linearGradient>
        <linearGradient id={`suolo-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d5a50" />
          <stop offset="1" stopColor="#3a3830" />
        </linearGradient>
        <radialGradient id={`torcia-${u}`}>
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff8a3c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`vignetta-${u}`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#cielo-${u})`} />
      <circle cx={1300} cy={150} r={70} fill="#fff4d6" opacity={0.95} />
      <circle cx={1300} cy={150} r={120} fill="#fff4d6" opacity={0.15} />
      {/* montagne lontane */}
      <path d="M -100,520 L 120,330 L 260,450 L 460,280 L 640,460 L 860,300 L 1060,470 L 1280,320 L 1480,460 L 1700,340 L 1700,560 L -100,560 Z" fill="#4a3a66" />
      <path d="M -100,560 L 200,430 L 420,520 L 700,400 L 980,540 L 1240,430 L 1500,530 L 1700,450 L 1700,600 L -100,600 Z" fill="#3c3054" />
      {/* torri */}
      {[60, 1440].map((x) => (
        <g key={x}>
          <rect x={x} y={250} width={180} height={420} fill="#8a8072" stroke="#2a2420" strokeWidth={5} />
          <rect x={x} y={250} width={60} height={420} fill="#6f675b" />
          <polygon points={`${x - 30},255 ${x + 90},90 ${x + 210},255`} fill="#6e2f36" stroke="#2a2420" strokeWidth={5} />
          <rect x={x + 70} y={340} width={36} height={60} rx={18} fill="#ffcf7a" stroke="#2a2420" strokeWidth={4} />
        </g>
      ))}
      {/* mura con merli */}
      <rect x={-100} y={420} width={1800} height={300} fill="#9a9080" stroke="#2a2420" strokeWidth={5} />
      {merli.map((x) => (
        <rect key={x} x={x} y={380} width={48} height={44} fill="#9a9080" stroke="#2a2420" strokeWidth={4} />
      ))}
      {pietre.map((r) => (
        <line key={r} x1={-100} y1={460 + r * 30} x2={1700} y2={460 + r * 30} stroke="#7d7466" strokeWidth={2} />
      ))}
      {/* portone sfondato */}
      <path d="M 690,720 L 690,520 Q 800,430 910,520 L 910,720 Z" fill="#1c1612" stroke="#2a2420" strokeWidth={6} />
      <polygon points="700,720 640,700 770,610 820,640" fill="#6b4423" stroke="#2a2420" strokeWidth={5} />
      {/* stendardi */}
      {[380, 1180].map((x) => (
        <g key={x}>
          <path d={`M ${x},440 L ${x + 90},440 L ${x + 90},630 L ${x + 45},600 L ${x},630 Z`} fill="#8a2e36" stroke="#2a2420" strokeWidth={4} />
          <circle cx={x + 45} cy={510} r={22} fill="#e8c46a" stroke="#2a2420" strokeWidth={3} />
        </g>
      ))}
      {/* torce */}
      {[560, 1040].map((x) => (
        <g key={x}>
          <circle cx={x} cy={500} r={110} fill={`url(#torcia-${u})`} />
          <rect x={x - 6} y={500} width={12} height={60} fill="#4a3020" stroke="#2a2420" strokeWidth={3} />
          <path d={`M ${x},462 Q ${x + 18},488 ${x},504 Q ${x - 18},488 ${x},462 Z`} fill="#ffb347" stroke="#2a2420" strokeWidth={3} />
        </g>
      ))}
      {/* selciato */}
      <rect x={-100} y={720} width={1800} height={230} fill={`url(#suolo-${u})`} />
      {Array.from({ length: 13 }, (_, i) => (
        <line key={i} x1={800 + (i - 6) * 70} y1={720} x2={800 + (i - 6) * 260} y2={950} stroke="#4a473e" strokeWidth={3} />
      ))}
      {[770, 830, 900].map((y) => (
        <line key={y} x1={-100} y1={y} x2={1700} y2={y} stroke="#4a473e" strokeWidth={3} />
      ))}
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#vignetta-${u})`} />
    </g>
  );
}

function AutostradaInRovina() {
  const u = useId().replace(/:/g, "");
  const palazzi = [
    [-80, 260, 140], [70, 330, 110], [190, 200, 150], [360, 300, 120], [500, 240, 170],
    [700, 340, 100], [820, 220, 140], [980, 290, 160], [1160, 210, 130], [1300, 320, 150], [1460, 250, 140], [1600, 300, 130],
  ];
  return (
    <g>
      <defs>
        <linearGradient id={`cielo-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a2e2a" />
          <stop offset="0.5" stopColor="#c0603a" />
          <stop offset="1" stopColor="#f2b36a" />
        </linearGradient>
        <linearGradient id={`strada-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a403a" />
          <stop offset="1" stopColor="#2a2420" />
        </linearGradient>
        <linearGradient id={`foschia-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2b36a" stopOpacity="0" />
          <stop offset="1" stopColor="#f2b36a" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={`vignetta-${u}`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#cielo-${u})`} />
      <circle cx={420} cy={260} r={110} fill="#ffe2a8" opacity={0.9} />
      <circle cx={420} cy={260} r={170} fill="#ffe2a8" opacity={0.18} />
      {/* skyline in rovina */}
      {palazzi.map(([x, y, l], i) => (
        <g key={i}>
          <path d={`M ${x},640 L ${x},${y + 30} L ${x + l * 0.4},${y} L ${x + l * 0.7},${y + 40} L ${x + l},${y + 15} L ${x + l},640 Z`} fill={i % 2 ? "#5a3a34" : "#4a302c"} />
          {Array.from({ length: 4 }, (_, r) => (
            <rect key={r} x={x + 18} y={y + 70 + r * 60} width={l - 36} height={14} fill="#2e1e1c" opacity={0.6} />
          ))}
        </g>
      ))}
      <rect x={-100} y={420} width={1800} height={240} fill={`url(#foschia-${u})`} />
      {/* cavalcavia crollato */}
      <polygon points="-100,470 620,470 700,520 660,540 -100,520" fill="#7a6a5e" stroke="#2a2420" strokeWidth={5} />
      <polygon points="980,540 1060,500 1700,500 1700,550 1040,560" fill="#7a6a5e" stroke="#2a2420" strokeWidth={5} />
      {[120, 420, 1240, 1520].map((x) => (
        <rect key={x} x={x} y={515} width={46} height={160} fill="#6a5a50" stroke="#2a2420" strokeWidth={5} />
      ))}
      {/* strada */}
      <polygon points="-100,700 1700,700 1700,950 -100,950" fill="#8a6a48" />
      <polygon points="-100,660 1700,660 1700,860 -100,860" fill={`url(#strada-${u})`} />
      {[-40, 260, 560, 860, 1160, 1460].map((x) => (
        <polygon key={x} points={`${x},765 ${x + 160},765 ${x + 150},780 ${x - 10},780`} fill="#e0c060" />
      ))}
      {/* rottami d'auto */}
      <g stroke="#2a2420" strokeWidth={5}>
        <path d="M 40,700 L 60,640 L 140,620 L 240,624 L 290,660 L 300,700 Z" fill="#8a3e2a" />
        <circle cx={100} cy={704} r={26} fill="#2a2420" />
        <path d="M 1330,690 L 1350,630 L 1450,606 L 1560,620 L 1610,690 Z" fill="#4e5a5a" transform="rotate(-6 1470 650)" />
        <polygon points="1180,700 1210,640 1260,650 1250,700" fill="#a8742e" />
      </g>
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#vignetta-${u})`} />
    </g>
  );
}
