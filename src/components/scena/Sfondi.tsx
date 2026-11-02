import { useId } from "react";

/**
 * Sfondi fissi delle scene, dipinti in SVG come segnaposto in "Stile Varco": forme tonde, nuvole soffici, contorni spessi e tinte pastello calde. Coprono il riquadro (-100,-50)-(1700,950)
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

const LINEA = "#2b2233";

/** Nuvola soffice fatta di cerchi, con contorno. */
function Nuvola({ x, y, s = 1, colore = "#fff8ec" }: { x: number; y: number; s?: number; colore?: string }) {
  const bolle: [number, number, number][] = [[0, 0, 38], [42, -18, 48], [92, -4, 40], [124, 10, 28], [-34, 12, 26]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {bolle.map(([cx, cy, r], i) => <circle key={`c${i}`} cx={cx} cy={cy} r={r + 5} fill={LINEA} />)}
      {bolle.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={colore} />)}
      <rect x={-56} y={14} width={200} height={26} rx={13} fill={colore} />
      <path d="M 18,-30 Q 40,-50 66,-40" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.8} />
    </g>
  );
}

/** Vignetta morbida e una leggera grana calda, per l'effetto "vecchio cartone". */
function Patina({ u }: { u: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`vignetta-${u}`} cx="0.5" cy="0.5" r="0.78">
          <stop offset="0.62" stopColor="#3a1c10" stopOpacity="0" />
          <stop offset="1" stopColor="#3a1c10" stopOpacity="0.42" />
        </radialGradient>
        <filter id={`grana-${u}`} x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0 0.15  0 0 0 0.09 0" />
        </filter>
      </defs>
      <rect x={-100} y={-50} width={1800} height={1000} filter={`url(#grana-${u})`} />
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#vignetta-${u})`} />
    </>
  );
}

function CortileCastello() {
  const u = useId().replace(/:/g, "");
  const merli = Array.from({ length: 23 }, (_, i) => -96 + i * 80);
  const ciottoli = Array.from({ length: 28 }, (_, i) => [((i * 263) % 1800) - 80, 790 + ((i * 97) % 150), 26 + ((i * 7) % 18)]);
  return (
    <g>
      <defs>
        <linearGradient id={`cielo-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fb6d9" />
          <stop offset="0.6" stopColor="#f6c9a6" />
          <stop offset="1" stopColor="#ffe3b0" />
        </linearGradient>
        <linearGradient id={`suolo-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9c39a" />
          <stop offset="1" stopColor="#b89c74" />
        </linearGradient>
        <radialGradient id={`torcia-${u}`}>
          <stop offset="0" stopColor="#ffe08a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffb05a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#cielo-${u})`} />
      <circle cx={1290} cy={160} r={64} fill="#fff6d8" stroke={LINEA} strokeWidth={5} />
      <circle cx={1290} cy={160} r={110} fill="#fff6d8" opacity={0.25} />
      <Nuvola x={160} y={120} />
      <Nuvola x={760} y={70} s={0.8} />
      <Nuvola x={1500} y={260} s={0.7} />
      {/* colline tonde */}
      <path d="M -100,560 Q 60,330 260,470 Q 420,300 640,470 Q 820,350 1000,480 Q 1200,320 1420,470 Q 1580,380 1700,450 L 1700,620 L -100,620 Z" fill="#9fcf8f" stroke={LINEA} strokeWidth={5} />
      <path d="M -100,600 Q 200,470 460,560 Q 760,450 1040,570 Q 1300,470 1700,560 L 1700,640 L -100,640 Z" fill="#7dba78" stroke={LINEA} strokeWidth={5} />
      {[[120, 470], [880, 452], [1520, 470]].map(([x, y]) => (
        <g key={x}>
          <rect x={x - 5} y={y} width={10} height={40} fill="#8a5a3a" stroke={LINEA} strokeWidth={3} />
          <circle cx={x} cy={y - 8} r={28} fill="#5fa65e" stroke={LINEA} strokeWidth={4} />
        </g>
      ))}
      {/* torri tonde */}
      {[60, 1440].map((x) => (
        <g key={x}>
          <rect x={x} y={260} width={180} height={420} rx={24} fill="#e8d8bc" stroke={LINEA} strokeWidth={6} />
          <rect x={x + 6} y={266} width={50} height={408} rx={20} fill="#d4c1a0" />
          <path d={`M ${x - 26},270 Q ${x + 90},230 ${x + 206},270 Q ${x + 160},160 ${x + 90},70 Q ${x + 20},160 ${x - 26},270 Z`} fill="#e46a5c" stroke={LINEA} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M ${x + 60},120 Q ${x + 40},190 ${x + 10},250`} stroke="#ff9d8c" strokeWidth={8} fill="none" strokeLinecap="round" />
          <circle cx={x + 90} cy={64} r={12} fill="#ffd25a" stroke={LINEA} strokeWidth={4} />
          <rect x={x + 68} y={340} width={44} height={64} rx={22} fill="#ffe08a" stroke={LINEA} strokeWidth={5} />
          <rect x={x + 68} y={480} width={44} height={64} rx={22} fill="#5a4a6a" stroke={LINEA} strokeWidth={5} />
        </g>
      ))}
      {/* mura con merli arrotondati */}
      {merli.map((x) => (
        <rect key={x} x={x} y={378} width={52} height={70} rx={14} fill="#eadcc2" stroke={LINEA} strokeWidth={5} />
      ))}
      <rect x={-100} y={420} width={1800} height={310} fill="#eadcc2" stroke={LINEA} strokeWidth={6} />
      {Array.from({ length: 45 }, (_, i) => {
        const riga = Math.floor(i / 9);
        const k = i % 9;
        if ((k + riga * 2) % 3 === 0) return null;
        return <rect key={i} x={-80 + k * 200 + (riga % 2) * 100} y={456 + riga * 52} width={96} height={32} rx={14} fill="#dccba9" stroke="#c2ad88" strokeWidth={3} />;
      })}
      {/* portone tondo, sfondato */}
      <path d="M 680,730 L 680,560 Q 680,450 800,450 Q 920,450 920,560 L 920,730 Z" fill="#3a2a3a" stroke={LINEA} strokeWidth={7} />
      <path d="M 700,730 L 700,570 Q 700,476 790,470 Q 740,520 740,730 Z" fill="#4c3a4c" />
      <rect x={630} y={640} width={150} height={44} rx={16} fill="#b0703c" stroke={LINEA} strokeWidth={5} transform="rotate(-22 705 662)" />
      {/* stendardi a goccia */}
      {[380, 1180].map((x) => (
        <g key={x}>
          <rect x={x - 8} y={436} width={106} height={14} rx={7} fill="#8a5a3a" stroke={LINEA} strokeWidth={4} />
          <path d={`M ${x},448 L ${x + 90},448 L ${x + 90},600 Q ${x + 45},660 ${x},600 Z`} fill="#5b8fd6" stroke={LINEA} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M ${x + 14},460 L ${x + 14},590`} stroke="#8fb6ec" strokeWidth={7} strokeLinecap="round" />
          <circle cx={x + 45} cy={530} r={24} fill="#ffd25a" stroke={LINEA} strokeWidth={4} />
          <circle cx={x + 45} cy={530} r={8} fill="#e46a5c" />
        </g>
      ))}
      {/* torce */}
      {[560, 1040].map((x) => (
        <g key={x}>
          <circle cx={x} cy={500} r={100} fill={`url(#torcia-${u})`} />
          <rect x={x - 8} y={500} width={16} height={56} rx={8} fill="#8a5a3a" stroke={LINEA} strokeWidth={4} />
          <path d={`M ${x},450 Q ${x + 24},486 ${x},506 Q ${x - 24},486 ${x},450 Z`} fill="#ffb347" stroke={LINEA} strokeWidth={4} />
          <path d={`M ${x},474 Q ${x + 10},490 ${x},500 Q ${x - 10},490 ${x},474 Z`} fill="#fff1a8" />
        </g>
      ))}
      {/* cortile in terra battuta e ciottoli tondi */}
      <rect x={-100} y={726} width={1800} height={230} fill={`url(#suolo-${u})`} stroke={LINEA} strokeWidth={6} />
      {ciottoli.map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.45} fill="#c8ae84" stroke="#9c825e" strokeWidth={3} />
      ))}
      <Patina u={u} />
    </g>
  );
}

function AutostradaInRovina() {
  const u = useId().replace(/:/g, "");
  // cupole e torri-capsula di una città che fu
  const rovine: [number, number, number, "cupola" | "capsula"][] = [
    [-60, 330, 180, "cupola"], [150, 230, 90, "capsula"], [280, 360, 200, "cupola"], [520, 260, 100, "capsula"],
    [660, 380, 170, "cupola"], [1000, 250, 110, "capsula"], [1150, 340, 210, "cupola"], [1400, 220, 96, "capsula"], [1520, 360, 190, "cupola"],
  ];
  return (
    <g>
      <defs>
        <linearGradient id={`cielo-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f08a6a" />
          <stop offset="0.5" stopColor="#f7b27a" />
          <stop offset="1" stopColor="#ffe0a0" />
        </linearGradient>
        <linearGradient id={`strada-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a6a7a" />
          <stop offset="1" stopColor="#5a4c5c" />
        </linearGradient>
        <clipPath id={`sole-${u}`}>
          <circle cx={420} cy={300} r={130} />
        </clipPath>
      </defs>
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#cielo-${u})`} />
      {/* sole a strisce, molto anni '80 */}
      <circle cx={420} cy={300} r={190} fill="#fff1b8" opacity={0.25} />
      <g clipPath={`url(#sole-${u})`}>
        <rect x={290} y={170} width={260} height={260} fill="#ffe27a" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={290} y={320 + i * 24} width={260} height={6 + i * 3} fill="#f7a06a" />
        ))}
      </g>
      <circle cx={420} cy={300} r={130} fill="none" stroke={LINEA} strokeWidth={5} />
      <Nuvola x={980} y={120} s={0.9} colore="#ffe9d0" />
      <Nuvola x={1460} y={60} s={0.6} colore="#ffe9d0" />
      {/* mesas tonde */}
      <path d="M -100,560 Q -20,420 120,430 Q 220,430 260,520 Q 480,400 760,470 Q 980,380 1240,470 Q 1460,400 1700,480 L 1700,640 L -100,640 Z" fill="#d98a66" stroke={LINEA} strokeWidth={5} />
      {/* rovine arrotondate */}
      {rovine.map(([x, y, l, tipo], i) => {
        const base = 650;
        const colore = i % 2 ? "#b7a6c4" : "#a6b8c4";
        return tipo === "cupola" ? (
          <g key={i}>
            <path d={`M ${x},${base} L ${x},${y + l * 0.35} Q ${x},${y} ${x + l / 2},${y} Q ${x + l},${y} ${x + l},${y + l * 0.35} L ${x + l},${base} Z`} fill={colore} stroke={LINEA} strokeWidth={5} />
            <path d={`M ${x + l * 0.62},${y + 2} L ${x + l * 0.7},${y + 40} L ${x + l * 0.82},${y + 26} L ${x + l * 0.9},${y + 60}`} fill="none" stroke={LINEA} strokeWidth={4} strokeLinejoin="round" />
            {[0.25, 0.55].map((f) => <circle key={f} cx={x + l * f} cy={y + l * 0.5} r={l * 0.09} fill="#4a3a52" stroke={LINEA} strokeWidth={4} />)}
            <path d={`M ${x + 18},${y + l * 0.3} Q ${x + 30},${y + 20} ${x + l * 0.35},${y + 12}`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.5} />
          </g>
        ) : (
          <g key={i}>
            <rect x={x} y={y} width={l} height={base - y + 20} rx={l / 2} fill={colore} stroke={LINEA} strokeWidth={5} />
            {[0, 1, 2].map((r) => <circle key={r} cx={x + l / 2} cy={y + 60 + r * 80} r={l * 0.16} fill={r === 1 ? "#ffe27a" : "#4a3a52"} stroke={LINEA} strokeWidth={4} />)}
            <line x1={x + l / 2} y1={y} x2={x + l / 2 + 8} y2={y - 46} stroke={LINEA} strokeWidth={5} strokeLinecap="round" />
            <circle cx={x + l / 2 + 8} cy={y - 52} r={9} fill="#e46a5c" stroke={LINEA} strokeWidth={4} />
          </g>
        );
      })}
      {/* cavalcavia crollato, coi bordi smussati */}
      <path d="M -100,470 L 600,470 Q 640,470 660,490 L 690,526 Q 690,540 670,540 L -100,530 Z" fill="#c9b8a8" stroke={LINEA} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 990,544 Q 1000,510 1040,500 L 1700,500 L 1700,556 L 1020,566 Q 990,566 990,544 Z" fill="#c9b8a8" stroke={LINEA} strokeWidth={6} strokeLinejoin="round" />
      {[120, 420, 1240, 1520].map((x) => (
        <rect key={x} x={x} y={520} width={50} height={160} rx={16} fill="#b2a090" stroke={LINEA} strokeWidth={5} />
      ))}
      {/* strada */}
      <rect x={-100} y={660} width={1800} height={300} fill="#e2b483" stroke={LINEA} strokeWidth={6} />
      <rect x={-100} y={680} width={1800} height={170} rx={20} fill={`url(#strada-${u})`} stroke={LINEA} strokeWidth={5} />
      {[-40, 260, 560, 860, 1160, 1460].map((x) => (
        <rect key={x} x={x} y={760} width={150} height={16} rx={8} fill="#ffe27a" stroke={LINEA} strokeWidth={3} />
      ))}
      {/* auto-bolla abbandonate */}
      <g stroke={LINEA} strokeWidth={5}>
        <path d="M 40,708 Q 40,640 120,630 Q 160,580 230,600 Q 290,620 300,708 Z" fill="#7fc0b0" />
        <path d="M 140,632 Q 170,600 220,610 L 230,640 L 140,644 Z" fill="#cfeaf0" />
        <circle cx={100} cy={712} r={26} fill="#3a2f40" />
        <circle cx={100} cy={712} r={9} fill="#c9b8a8" />
        <g transform="rotate(-8 1470 650)">
          <path d="M 1330,694 Q 1330,620 1420,604 Q 1520,590 1580,640 Q 1610,670 1610,694 Z" fill="#f2c05a" />
          <circle cx={1470} cy={640} r={22} fill="#cfeaf0" />
        </g>
        <rect x={1180} y={640} width={74} height={60} rx={26} fill="#e46a5c" />
      </g>
      <Patina u={u} />
    </g>
  );
}
