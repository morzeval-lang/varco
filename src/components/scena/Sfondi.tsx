import { useId } from "react";

/**
 * Sfondi fissi delle scene, dipinti in SVG come segnaposto con luce drammatica da fine giornata, profondità a strati e contorni sottili, perché i personaggi restino in primo piano. Coprono il riquadro (-100,-50)-(1700,950)
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

const LINEA = "#2a1f1c";
const bordo = { stroke: LINEA, strokeWidth: 2.5, strokeLinejoin: "round" as const };

/** Numeri pseudo-casuali ripetibili, così il disegno è identico sul server e nel browser. */
function casuale(seme: number) {
  let s = seme;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Raggi di luce, polvere sospesa e vignetta: l'atmosfera comune alle scene. */
function Atmosfera({ u, sole, colore, seme }: { u: string; sole: [number, number]; colore: string; seme: number }) {
  const r = casuale(seme);
  const raggi = Array.from({ length: 7 }, (_, i) => -60 + i * 22 + r() * 10);
  const polvere = Array.from({ length: 40 }, () => [r() * 1800 - 100, r() * 900, 1 + r() * 2.5, 0.25 + r() * 0.5]);
  return (
    <>
      <defs>
        <radialGradient id={`vignetta-${u}`} cx="0.5" cy="0.45" r="0.8">
          <stop offset="0.55" stopColor="#120a10" stopOpacity="0" />
          <stop offset="1" stopColor="#120a10" stopOpacity="0.62" />
        </radialGradient>
        <linearGradient id={`raggio-${u}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={colore} stopOpacity="0.32" />
          <stop offset="1" stopColor={colore} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g style={{ mixBlendMode: "screen" }}>
        {raggi.map((a, i) => (
          <polygon
            key={i}
            points={`${sole[0]},${sole[1]} ${sole[0] + Math.cos(((a - 3) * Math.PI) / 180) * 2200},${sole[1] + Math.sin(((a - 3) * Math.PI) / 180) * 2200} ${sole[0] + Math.cos(((a + 3) * Math.PI) / 180) * 2200},${sole[1] + Math.sin(((a + 3) * Math.PI) / 180) * 2200}`}
            fill={`url(#raggio-${u})`}
            transform={`rotate(${a + 180} ${sole[0]} ${sole[1]})`}
            opacity={0.45}
          />
        ))}
      </g>
      {polvere.map(([x, y, rr, o], i) => (
        <circle key={i} cx={x} cy={y} r={rr} fill={colore} opacity={o} />
      ))}
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#vignetta-${u})`} />
    </>
  );
}

/** Banco di nuvole allungate, illuminate da sotto. */
function Nubi({ y, colore, luce, seme }: { y: number; colore: string; luce: string; seme: number }) {
  const r = casuale(seme);
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const x = -100 + r() * 1800;
        const yy = y + r() * 160;
        const l = 160 + r() * 340;
        const h = 14 + r() * 18;
        return (
          <g key={i}>
            <ellipse cx={x} cy={yy} rx={l / 2} ry={h} fill={colore} />
            <ellipse cx={x + 10} cy={yy + h * 0.55} rx={l / 2.3} ry={h * 0.35} fill={luce} />
          </g>
        );
      })}
    </g>
  );
}

function CortileCastello() {
  const u = useId().replace(/:/g, "");
  const r = casuale(11);
  const merli = Array.from({ length: 22 }, (_, i) => -100 + i * 84);
  const blocchi = Array.from({ length: 6 }, (_, riga) =>
    Array.from({ length: 20 }, (_, k) => ({ x: -100 + k * 96 + (riga % 2) * 48, y: 440 + riga * 46, t: r() })),
  ).flat();
  const lastre = Array.from({ length: 5 }, (_, riga) => riga);
  return (
    <g>
      <defs>
        <linearGradient id={`cielo-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1934" />
          <stop offset="0.45" stopColor="#5a2c4a" />
          <stop offset="0.75" stopColor="#c4583c" />
          <stop offset="1" stopColor="#f2a65a" />
        </linearGradient>
        <linearGradient id={`suolo-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b5a4c" />
          <stop offset="1" stopColor="#2e2522" />
        </linearGradient>
        <linearGradient id={`mura-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8c7a68" />
          <stop offset="1" stopColor="#5a4c42" />
        </linearGradient>
        <radialGradient id={`torcia-${u}`}>
          <stop offset="0" stopColor="#ffc46a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ff7a2c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`alone-${u}`}>
          <stop offset="0" stopColor="#ffd59a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff8a4a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#cielo-${u})`} />
      <circle cx={1180} cy={330} r={260} fill={`url(#alone-${u})`} />
      <circle cx={1180} cy={330} r={58} fill="#ffe2b0" />
      <Nubi y={120} colore="#3e2442" luce="#e0785a" seme={3} />
      {/* montagne a strati, sempre più velate */}
      <path d="M -100,470 L 40,360 L 120,400 L 260,250 L 380,370 L 470,330 L 600,420 L 760,300 L 900,410 L 1040,340 L 1200,430 L 1360,280 L 1500,380 L 1700,320 L 1700,560 L -100,560 Z" fill="#7a4458" opacity={0.75} />
      <path d="M -100,520 L 120,430 L 300,480 L 480,400 L 700,500 L 880,430 L 1100,500 L 1300,420 L 1480,490 L 1700,440 L 1700,600 L -100,600 Z" fill="#4e2e46" />
      {/* il mastio lontano */}
      <g fill="#33213a">
        <rect x={720} y={300} width={160} height={200} />
        <rect x={700} y={250} width={44} height={250} />
        <rect x={856} y={230} width={48} height={270} />
        <polygon points="696,252 722,180 748,252" />
        <polygon points="852,232 880,150 908,232" />
        {Array.from({ length: 5 }, (_, i) => <rect key={i} x={724 + i * 32} y={286} width={18} height={16} />)}
      </g>
      <rect x={-100} y={420} width={1800} height={120} fill="#c4583c" opacity={0.18} />
      {/* torri del cortile */}
      {[40, 1440].map((x) => (
        <g key={x}>
          <rect x={x} y={240} width={190} height={470} fill={`url(#mura-${u})`} {...bordo} />
          <rect x={x} y={240} width={70} height={470} fill="#2a1f22" opacity={0.35} />
          <polygon points={`${x - 24},246 ${x + 95},40 ${x + 214},246`} fill="#3a3346" {...bordo} />
          <polygon points={`${x - 24},246 ${x + 95},40 ${x + 70},246`} fill="#252030" />
          <line x1={x + 95} y1={40} x2={x + 95} y2={0} stroke={LINEA} strokeWidth={3} />
          <path d={`M ${x + 95},4 L ${x + 140},14 L ${x + 120},22 L ${x + 140},30 L ${x + 95},28 Z`} fill="#7a2228" />
          <rect x={x + 86} y={330} width={18} height={56} fill="#1a1216" />
          <rect x={x + 86} y={470} width={18} height={56} fill="#ffb460" opacity={0.85} />
        </g>
      ))}
      {/* mura */}
      {merli.map((x) => (
        <rect key={x} x={x} y={384} width={50} height={46} fill="#7e6c5c" {...bordo} />
      ))}
      <rect x={-100} y={424} width={1800} height={300} fill={`url(#mura-${u})`} {...bordo} />
      {blocchi.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={94} height={44} fill="none" stroke="#4a3d35" strokeWidth={1.5} opacity={0.5 + b.t * 0.3} />
      ))}
      {blocchi.filter((b) => b.t > 0.82).map((b, i) => (
        <rect key={`s${i}`} x={b.x + 2} y={b.y + 2} width={90} height={40} fill="#3e322c" opacity={0.25} />
      ))}
      <rect x={-100} y={424} width={1800} height={22} fill="#2a1f22" opacity={0.35} />
      {/* portone con la saracinesca sollevata a metà */}
      <path d="M 680,724 L 680,540 Q 800,450 920,540 L 920,724 Z" fill="#140d10" {...bordo} strokeWidth={4} />
      <g stroke="#3a3036" strokeWidth={7}>
        {Array.from({ length: 7 }, (_, i) => <line key={i} x1={700 + i * 33} y1={500} x2={700 + i * 33} y2={600} />)}
        <line x1={684} y1={560} x2={916} y2={560} />
        <line x1={684} y1={596} x2={916} y2={596} />
      </g>
      <g fill="#9a8c86">{Array.from({ length: 7 }, (_, i) => <polygon key={i} points={`${696 + i * 33},600 ${704 + i * 33},600 ${700 + i * 33},616`} />)}</g>
      <polygon points="640,724 660,690 790,650 800,672" fill="#4a3020" {...bordo} />
      {/* stendardi strappati */}
      {[360, 1180].map((x) => (
        <g key={x}>
          <rect x={x - 6} y={444} width={112} height={10} fill="#3a2a20" {...bordo} />
          <path d={`M ${x},452 L ${x + 100},452 L ${x + 100},650 L ${x + 84},630 L ${x + 70},660 L ${x + 50},620 L ${x + 30},648 L ${x + 14},624 L ${x},640 Z`} fill="#6e1e26" {...bordo} />
          <path d={`M ${x},452 L ${x + 34},452 L ${x + 30},648 L ${x + 14},624 L ${x},640 Z`} fill="#4a1218" />
          <path d={`M ${x + 50},500 L ${x + 70},530 L ${x + 50},580 L ${x + 30},530 Z`} fill="#c9a24a" {...bordo} strokeWidth={2} />
        </g>
      ))}
      {/* torce */}
      {[560, 1040].map((x) => (
        <g key={x}>
          <circle cx={x} cy={500} r={140} fill={`url(#torcia-${u})`} />
          <path d={`M ${x - 10},510 L ${x + 10},510 L ${x + 5},560 L ${x - 5},560 Z`} fill="#2a1d18" {...bordo} />
          <path d={`M ${x},450 Q ${x + 16},478 ${x + 8},500 Q ${x + 14},484 ${x},508 Q ${x - 16},490 ${x - 6},470 Q ${x - 4},486 ${x},450 Z`} fill="#ffb04a" />
          <path d={`M ${x},478 Q ${x + 7},492 ${x},506 Q ${x - 7},492 ${x},478 Z`} fill="#fff0b0" />
        </g>
      ))}
      {/* lastricato in prospettiva */}
      <rect x={-100} y={724} width={1800} height={240} fill={`url(#suolo-${u})`} />
      {lastre.map((riga) => {
        const y = 724 + Math.pow(riga + 1, 1.5) * 20;
        return <line key={riga} x1={-100} y1={y} x2={1700} y2={y} stroke="#2a201c" strokeWidth={2} opacity={0.6} />;
      })}
      {Array.from({ length: 19 }, (_, i) => (
        <line key={i} x1={800 + (i - 9) * 90} y1={724} x2={800 + (i - 9) * 300} y2={960} stroke="#2a201c" strokeWidth={2} opacity={0.5} />
      ))}
      <path d="M 300,820 L 360,846 L 350,880 L 420,910 M 1180,800 L 1230,830 L 1300,826" stroke="#1e1614" strokeWidth={2.5} fill="none" opacity={0.7} />
      <rect x={-100} y={724} width={1800} height={60} fill="#f2a65a" opacity={0.1} />
      <Atmosfera u={u} sole={[1180, 330]} colore="#ffd08a" seme={5} />
    </g>
  );
}

function AutostradaInRovina() {
  const u = useId().replace(/:/g, "");
  const r = casuale(23);
  const lontani = Array.from({ length: 14 }, (_, i) => ({ x: -100 + i * 132 + r() * 40, h: 180 + r() * 260, l: 70 + r() * 70 }));
  const vicini = Array.from({ length: 7 }, (_, i) => ({ x: -120 + i * 280 + r() * 60, h: 260 + r() * 220, l: 110 + r() * 80, rotto: r() }));
  return (
    <g>
      <defs>
        <linearGradient id={`cielo-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#23303a" />
          <stop offset="0.4" stopColor="#6a4038" />
          <stop offset="0.72" stopColor="#c8693a" />
          <stop offset="1" stopColor="#edc07a" />
        </linearGradient>
        <linearGradient id={`strada-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4e48" />
          <stop offset="1" stopColor="#2a2422" />
        </linearGradient>
        <linearGradient id={`foschia-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#edc07a" stopOpacity="0" />
          <stop offset="1" stopColor="#edc07a" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={`alone-${u}`}>
          <stop offset="0" stopColor="#ffe6a8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ff9a4a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-100} y={-50} width={1800} height={1000} fill={`url(#cielo-${u})`} />
      <circle cx={430} cy={380} r={300} fill={`url(#alone-${u})`} />
      <circle cx={430} cy={380} r={70} fill="#fff0c8" opacity={0.9} />
      <Nubi y={90} colore="#3a2a2e" luce="#c8693a" seme={9} />
      {/* skyline lontano, velato dalla polvere */}
      {lontani.map((b, i) => (
        <path key={i} d={`M ${b.x},640 L ${b.x},${640 - b.h} L ${b.x + b.l * 0.5},${640 - b.h - 12} L ${b.x + b.l * 0.6},${640 - b.h + 20} L ${b.x + b.l},${640 - b.h + 6} L ${b.x + b.l},640 Z`} fill="#8a5a48" opacity={0.7} />
      ))}
      <rect x={-100} y={300} width={1800} height={360} fill={`url(#foschia-${u})`} />
      {/* palazzi sventrati */}
      {vicini.map((b, i) => {
        const top = 660 - b.h;
        const taglio = top + 30 + b.rotto * 60;
        return (
          <g key={i}>
            <path d={`M ${b.x},660 L ${b.x},${top} L ${b.x + b.l * 0.35},${top + 10} L ${b.x + b.l * 0.5},${taglio} L ${b.x + b.l * 0.7},${top + 40} L ${b.x + b.l},${taglio + 20} L ${b.x + b.l},660 Z`} fill="#4a3434" {...bordo} strokeWidth={2} />
            <path d={`M ${b.x},660 L ${b.x},${top} L ${b.x + b.l * 0.3},${top + 9} L ${b.x + b.l * 0.3},660 Z`} fill="#3a2828" />
            {Array.from({ length: Math.floor(b.h / 46) }, (_, k) => (
              <g key={k}>
                <line x1={b.x} y1={top + 50 + k * 46} x2={b.x + b.l} y2={top + 50 + k * 46} stroke="#2a1c1c" strokeWidth={3} />
                {Array.from({ length: 3 }, (_, f) => (
                  <rect key={f} x={b.x + 12 + f * (b.l / 3.2)} y={top + 60 + k * 46} width={b.l / 5} height={20} fill={r() > 0.9 ? "#e8a050" : "#1e1414"} opacity={0.85} />
                ))}
              </g>
            ))}
            <path d={`M ${b.x + b.l * 0.5},${taglio} l -6,-30 M ${b.x + b.l * 0.55},${taglio - 4} l 4,-26 M ${b.x + b.l * 0.62},${taglio - 10} l 10,-22`} stroke="#2a1c1c" strokeWidth={2} />
          </g>
        );
      })}
      {/* tralicci piegati e cavi */}
      {[1240, 1560].map((x, i) => (
        <g key={x} stroke="#2a1c1c" strokeWidth={4} fill="none" transform={`rotate(${i ? -8 : 5} ${x} 660)`}>
          <path d={`M ${x - 30},660 L ${x},360 L ${x + 30},660 M ${x - 22},580 L ${x + 22},580 M ${x - 14},500 L ${x + 14},500 M ${x - 40},420 L ${x + 40},420 M ${x - 22},580 L ${x + 14},500 M ${x + 22},580 L ${x - 14},500`} />
        </g>
      ))}
      <path d="M 1200,420 Q 1400,500 1590,430 M 1200,420 Q 1000,520 700,470" stroke="#2a1c1c" strokeWidth={2} fill="none" />
      {/* cavalcavia spezzato, coi ferri a vista */}
      <polygon points="-100,470 600,470 640,500 690,540 650,548 -100,532" fill="#6e5e54" {...bordo} />
      <rect x={-100} y={470} width={760} height={14} fill="#8a7a6c" />
      <polygon points="-100,532 650,548 640,560 -100,548" fill="#3a302c" />
      <path d="M 650,520 l 16,40 M 668,526 l 4,46 M 684,536 l 14,36 M 630,512 l 2,40" stroke="#2a1c1c" strokeWidth={2.5} />
      <polygon points="1000,548 1060,506 1700,506 1700,560 1040,568" fill="#6e5e54" {...bordo} />
      <path d="M 1010,546 l -14,40 M 1030,552 l -4,44 M 1052,556 l -14,34" stroke="#2a1c1c" strokeWidth={2.5} />
      {[120, 420, 1240, 1520].map((x) => (
        <g key={x}>
          <rect x={x} y={540} width={50} height={140} fill="#5e5048" {...bordo} />
          <rect x={x} y={540} width={18} height={140} fill="#3e3430" />
        </g>
      ))}
      {/* macerie del crollo */}
      <polygon points="700,700 760,620 820,640 880,600 960,660 990,700" fill="#5a4a42" {...bordo} />
      <polygon points="760,620 820,640 800,700 700,700" fill="#3e322e" />
      {/* strada */}
      <rect x={-100} y={680} width={1800} height={280} fill="#9a7650" />
      <polygon points="-100,690 1700,690 1700,880 -100,880" fill={`url(#strada-${u})`} />
      {[-40, 280, 600, 920, 1240, 1560].map((x, i) => (
        <polygon key={x} points={`${x},768 ${x + 150},768 ${x + 146},778 ${x - 4},778`} fill="#c8b070" opacity={i % 2 ? 0.35 : 0.7} />
      ))}
      <path d="M 200,720 L 260,750 L 250,800 L 330,830 M 1100,860 L 1180,820 L 1260,840 L 1300,800 M 560,840 L 620,870" stroke="#1a1412" strokeWidth={2.5} fill="none" />
      <path d="M -100,880 Q 300,840 700,870 Q 1100,900 1700,850 L 1700,960 L -100,960 Z" fill="#b08a5a" />
      {/* rottami */}
      <g {...bordo}>
        <path d="M 30,712 L 50,664 L 120,644 L 230,646 L 284,676 L 300,712 Z" fill="#7a3a24" />
        <path d="M 120,646 L 136,616 L 210,618 L 230,646 Z" fill="#2a2222" />
        <path d="M 50,690 L 290,690" stroke={LINEA} strokeWidth={2} />
        <circle cx={92} cy={714} r={22} fill="#1a1414" />
        <g transform="rotate(-10 1470 680)">
          <path d="M 1330,700 L 1346,646 L 1450,626 L 1570,636 L 1610,700 Z" fill="#4a5450" />
          <path d="M 1440,630 L 1460,600 L 1540,606 L 1560,636 Z" fill="#222828" />
        </g>
        <polygon points="1180,712 1200,660 1262,666 1270,712" fill="#8a6430" />
      </g>
      <Atmosfera u={u} sole={[430, 380]} colore="#ffd8a0" seme={7} />
    </g>
  );
}
