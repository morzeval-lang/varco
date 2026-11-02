import { useId } from "react";
import type { Essenza } from "@/lib/personaggio/essenza";
import { CONTORNO, scurisci, schiarisci } from "./colori";

/**
 * Figura segnaposto disegnata in SVG a partire dall'Essenza, nello stile dei manga d'azione anni '80 e '90:
 * proporzioni adulte (circa sette teste), muscoli leggibili, sguardo tagliente, inchiostro deciso e
 * ombre nette a due toni con la luce che arriva da destra in alto.
 * È sempre in posa di combattimento, rivolta a destra, coi piedi nell'origine (0,0) e alta circa 480 unità.
 * Quando un personaggio avrà la sua illustrazione definitiva, `Cartoncino` userà quella al posto di questa.
 */

type P = [number, number];

const LARGHEZZA: Record<Essenza["corporatura"], number> = { esile: 0.84, media: 1, robusta: 1.18, imponente: 1.36 };
const METALLO = "#a3abb8";
const INCHIOSTRO = 3.5;
const LUCE: P = [0.55, -0.83];

const tratto = { stroke: CONTORNO, strokeWidth: INCHIOSTRO, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

// ——— geometria dei segmenti muscolosi ———

const pt = ([x, y]: P) => `${x.toFixed(1)},${y.toFixed(1)}`;

/**
 * Un segmento del corpo tra a e b: raggi diversi alle due estremità, rigonfiamento a metà (il muscolo)
 * e punte arrotondate. r1/r2 sono i raggi dal lato dell'ombra e dal lato della luce.
 */
function segmento(a: P, b: P, r1a: number, r1b: number, r2a: number, r2b: number, g1: number, g2: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const d: P = [dx / l, dy / l];
  let n: P = [-d[1], d[0]];
  if (n[0] * LUCE[0] + n[1] * LUCE[1] > 0) n = [-n[0], -n[1]];
  const su = (p: P, v: P, k: number): P => [p[0] + v[0] * k, p[1] + v[1] * k];
  const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const A1 = su(a, n, r1a);
  const B1 = su(b, n, r1b);
  const B2 = su(b, n, -r2b);
  const A2 = su(a, n, -r2a);
  const C1 = su(m, n, (r1a + r1b) / 2 + g1);
  const C2 = su(m, n, -((r2a + r2b) / 2 + g2));
  const capB = su(su(b, d, ((r1b + r2b) / 2) * 1.6), n, (r1b - r2b) / 2);
  const capA = su(su(a, d, -((r1a + r2a) / 2) * 1.6), n, (r1a - r2a) / 2);
  return `M ${pt(A1)} Q ${pt(C1)} ${pt(B1)} Q ${pt(capB)} ${pt(B2)} Q ${pt(C2)} ${pt(A2)} Q ${pt(capA)} ${pt(A1)} Z`;
}

/** Segmento con colore pieno, ombra netta sul lato lontano dalla luce e contorno a inchiostro. */
function Parte({ a, b, ra, rb, g = 0, colore, ombra = 0.72 }: { a: P; b: P; ra: number; rb: number; g?: number; colore: string; ombra?: number }) {
  const pieno = segmento(a, b, ra, rb, ra, rb, g, g * 0.6);
  return (
    <>
      <path d={pieno} fill={colore} />
      <path d={segmento(a, b, ra, rb, -ra * 0.15, -rb * 0.15, g, 0)} fill={scurisci(colore, ombra)} />
      <path d={pieno} fill="none" {...tratto} />
    </>
  );
}

/** Forma libera a due toni: base, ombra e contorno. */
function Forma({ d, ombra, colore, f = 0.72 }: { d: string; ombra?: string; colore: string; f?: number }) {
  return (
    <>
      <path d={d} fill={colore} />
      {ombra && <path d={ombra} fill={scurisci(colore, f)} />}
      <path d={d} fill="none" {...tratto} />
    </>
  );
}

// ——— scheletro della posa (piedi in 0,0) ———

const TESTA: P = [24, -428];
const COLLO_BASSO: P = [12, -372];

export function Figura({ essenza }: { essenza: Essenza }) {
  const uid = useId().replace(/:/g, "");
  const w = LARGHEZZA[essenza.corporatura];
  const s = essenza.altezza * (essenza.corporatura === "imponente" ? 1.05 : 1);
  const { primario, secondario, accento } = essenza.palette;
  const pelle = essenza.pelle;
  const segno = essenza.segnoDistintivo.tipo;
  const arma = essenza.arma.tipo;
  const meccanico = segno === "braccio_meccanico";
  const sfocatura = `sf-${uid}`;
  const stivali = scurisci(secondario, 0.42);
  const corazzato = arma === "spada" || arma === "scudo";

  // spalle, anche, ginocchia e mani
  const spallaD: P = [42 * w, -362];
  const spallaS: P = [-30 * w, -360];
  const gomitoD: P = [92 + 6 * w, -332];
  const manoD: P = [142 + 4 * w, -352];
  const gomitoS: P = [-62 * w - 10, -300];
  const manoS: P = [-46 * w, -258];
  const ancaD: P = [20 * w, -238];
  const ancaS: P = [-18 * w, -236];
  const ginD: P = [76, -144];
  const ginS: P = [-52, -136];
  const cavD: P = [66, -38];
  const cavS: P = [-102, -36];

  return (
    <g transform={`scale(${s})`}>
      <defs>
        <filter id={sfocatura} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      {/* dietro al corpo */}
      {segno === "aura" && <Aura colore={accento} w={w} sfocatura={sfocatura} />}
      {segno === "ali" && (
        <g>
          <Forma
            colore={scurisci(accento, 0.55)}
            d="M -10,-350 L -120,-470 L -250,-500 L -200,-440 L -260,-420 L -196,-380 L -246,-340 L -170,-320 L -190,-280 L -60,-300 Z"
            ombra="M -10,-350 L -120,-470 L -160,-420 L -120,-330 L -60,-300 Z"
          />
          <path d="M -40,-330 L -120,-470 M -60,-320 L -200,-440 M -70,-310 L -196,-380 M -64,-302 L -170,-320" stroke={CONTORNO} strokeWidth={2.5} />
        </g>
      )}
      {segno === "mantello" && (
        <Forma
          colore={secondario}
          d={`M ${-34 * w},-372 Q -110,-300 -170,-110 L -150,-96 L -138,-60 L -112,-80 L -96,-34 L -76,-70 L -50,-54 Q -40,-220 ${30 * w},-370 Z`}
          ombra={`M ${-34 * w},-372 Q -110,-300 -170,-110 L -150,-96 L -138,-60 L -112,-80 Q -96,-230 ${-6 * w},-368 Z`}
        />
      )}
      {essenza.capelli.stile === "lunghi" && (
        <g transform={`translate(${TESTA[0]} ${TESTA[1]}) rotate(-4)`}>
          <Forma
            colore={essenza.capelli.colore}
            d="M -26,-24 Q -48,10 -46,60 L -36,52 L -32,78 L -20,58 L -12,70 L -8,30 Q -6,10 -2,0 Z"
            ombra="M -26,-24 Q -48,10 -46,60 L -36,52 L -32,78 L -24,40 Q -22,10 -14,-10 Z"
          />
        </g>
      )}

      {/* braccio dietro, col pugno caricato al fianco */}
      <Parte a={spallaS} b={gomitoS} ra={15 * w} rb={11 * w} g={4 * w} colore={meccanico ? METALLO : scurisci(primario, 0.85)} />
      <Parte a={gomitoS} b={manoS} ra={11 * w} rb={9 * w} g={3 * w} colore={meccanico ? METALLO : scurisci(pelle, 0.92)} />
      {meccanico && (
        <g>
          <circle cx={gomitoS[0]} cy={gomitoS[1]} r={8} fill={scurisci(METALLO, 0.6)} {...tratto} strokeWidth={2.5} />
          <circle cx={gomitoS[0]} cy={gomitoS[1]} r={3} fill={accento} />
          <path d={`M ${spallaS[0] - 8},${spallaS[1] + 18} L ${gomitoS[0] + 6},${gomitoS[1] - 16} M ${gomitoS[0] + 6},${gomitoS[1] + 14} L ${manoS[0] - 4},${manoS[1] - 14}`} stroke={CONTORNO} strokeWidth={2} />
          <path d={`M ${spallaS[0] + 4},${spallaS[1] + 14} L ${gomitoS[0] + 14},${gomitoS[1] - 10}`} stroke={accento} strokeWidth={2} opacity={0.9} />
        </g>
      )}
      <Pugno c={manoS} r={13 * w} colore={arma === "pugni" ? accento : meccanico ? METALLO : pelle} />

      {/* gamba dietro, tesa */}
      <Parte a={ancaS} b={ginS} ra={22 * w} rb={15 * w} g={6 * w} colore={scurisci(secondario, 0.85)} />
      <Parte a={ginS} b={cavS} ra={15 * w} rb={10 * w} g={5 * w} colore={scurisci(secondario, 0.85)} />
      <Stivale caviglia={cavS} punta={[-62, -4]} w={w} colore={scurisci(stivali, 0.85)} />

      {/* busto */}
      <Busto w={w} primario={primario} secondario={secondario} accento={accento} pelle={pelle} corazzato={corazzato} />

      {arma === "scudo" && (
        <Forma
          colore={secondario}
          d="M 40,-352 L 108,-352 Q 114,-292 74,-236 Q 34,-292 40,-352 Z"
          ombra="M 40,-352 L 72,-352 L 74,-236 Q 34,-292 40,-352 Z"
        />
      )}
      {arma === "scudo" && (
        <g>
          <path d="M 74,-340 L 74,-256 M 52,-318 L 96,-318" stroke={accento} strokeWidth={6} strokeLinecap="round" />
          <path d="M 100,-346 Q 104,-306 90,-276" stroke={schiarisci(secondario, 0.5)} strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* gamba davanti, piegata */}
      <Parte a={ancaD} b={ginD} ra={23 * w} rb={16 * w} g={7 * w} colore={secondario} />
      <Parte a={ginD} b={cavD} ra={16 * w} rb={10 * w} g={6 * w} colore={secondario} />
      <path d={`M ${ancaD[0] + 6},${ancaD[1] + 26} Q ${ginD[0] - 4},${ginD[1] - 40} ${ginD[0] + 6},${ginD[1] - 8}`} stroke={scurisci(secondario, 0.6)} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Stivale caviglia={cavD} punta={[102, -4]} w={w} colore={stivali} />

      {/* collo e testa */}
      <Parte a={COLLO_BASSO} b={[20, -398]} ra={11 * w} rb={10} colore={pelle} />
      <Testa essenza={essenza} sfocatura={sfocatura} />

      {/* braccio davanti con l'arma */}
      {arma === "bastone" && <Bastone mano={manoD} accento={accento} sfocatura={sfocatura} />}
      {arma === "arco" && <Arco mano={manoD} accento={accento} />}
      <Parte a={spallaD} b={gomitoD} ra={16 * w} rb={11 * w} g={5 * w} colore={primario} />
      <Parte a={gomitoD} b={manoD} ra={12 * w} rb={9 * w} g={4 * w} colore={arma === "pugni" ? pelle : scurisci(pelle, 0.97)} />
      {corazzato && (
        <Forma
          colore={METALLO}
          d={`M ${spallaD[0] - 22 * w},${spallaD[1] - 4} Q ${spallaD[0] + 4},${spallaD[1] - 28 * w} ${spallaD[0] + 30 * w},${spallaD[1] - 2} Q ${spallaD[0] + 26 * w},${spallaD[1] + 22} ${spallaD[0] + 14},${spallaD[1] + 26} Q ${spallaD[0] - 4},${spallaD[1] + 6} ${spallaD[0] - 22 * w},${spallaD[1] - 4} Z`}
          ombra={`M ${spallaD[0] - 22 * w},${spallaD[1] - 4} Q ${spallaD[0] - 4},${spallaD[1] - 10} ${spallaD[0] + 14},${spallaD[1] + 26} Q ${spallaD[0] - 4},${spallaD[1] + 6} ${spallaD[0] - 22 * w},${spallaD[1] - 4} Z`}
        />
      )}
      {arma === "spada" && <Spada mano={manoD} accento={accento} secondario={secondario} />}
      {arma === "pistola" && <Pistola mano={manoD} accento={accento} />}
      <Pugno c={manoD} r={13 * w} colore={arma === "pugni" ? accento : pelle} guanto={arma === "pugni"} />
    </g>
  );
}

// ——— parti ———

function Pugno({ c, r, colore, guanto = false }: { c: P; r: number; colore: string; guanto?: boolean }) {
  const [x, y] = c;
  const rr = guanto ? r * 1.35 : r;
  const d = `M ${x - rr},${y - rr * 0.7} Q ${x - rr * 0.2},${y - rr * 1.15} ${x + rr},${y - rr * 0.8} Q ${x + rr * 1.3},${y} ${x + rr * 0.9},${y + rr * 0.8} Q ${x},${y + rr * 1.2} ${x - rr},${y + rr * 0.6} Z`;
  return (
    <g>
      <Forma colore={colore} d={d} ombra={`M ${x - rr},${y - rr * 0.7} Q ${x - rr * 0.6},${y} ${x - rr * 0.2},${y + rr * 1.0} Q ${x - rr * 0.8},${y + rr * 0.9} ${x - rr},${y + rr * 0.6} Z`} />
      <path d={`M ${x + rr * 0.2},${y - rr * 0.9} L ${x + rr * 0.3},${y + rr * 0.2} M ${x + rr * 0.65},${y - rr * 0.75} L ${x + rr * 0.7},${y + rr * 0.3}`} stroke={CONTORNO} strokeWidth={2} />
      {guanto && <path d={`M ${x - rr * 0.9},${y - rr * 0.2} L ${x + rr},${y - rr * 0.35}`} stroke={schiarisci(colore, 0.5)} strokeWidth={3} strokeLinecap="round" />}
    </g>
  );
}

function Stivale({ caviglia, punta, w, colore }: { caviglia: P; punta: P; w: number; colore: string }) {
  const [cx, cy] = caviglia;
  const avanti = punta[0] > cx;
  const tallone = avanti ? cx - 17 * w : cx + 14 * w;
  const d = avanti
    ? `M ${cx - 13 * w},${cy - 38} L ${cx + 13 * w},${cy - 30} L ${cx + 14 * w},${cy - 8} Q ${punta[0] - 6},${cy} ${punta[0]},${punta[1] - 6} L ${punta[0] + 2},${punta[1] + 4} L ${tallone},${punta[1] + 4} L ${tallone},${cy - 6} Z`
    : `M ${cx - 14 * w},${cy - 38} L ${cx + 13 * w},${cy - 30} L ${cx + 16 * w},${cy - 4} Q ${punta[0] - 6},${cy + 4} ${punta[0]},${punta[1] - 4} L ${punta[0] + 2},${punta[1] + 4} L ${cx - 18 * w},${punta[1] + 4} L ${cx - 15 * w},${cy - 8} Z`;
  return (
    <g>
      <Forma colore={colore} d={d} ombra={`M ${cx - 13 * w},${cy - 38} L ${cx - 4 * w},${cy - 39} L ${cx - 2 * w},${punta[1] + 4} L ${avanti ? tallone : cx - 18 * w},${punta[1] + 4} Z`} />
      <path d={`M ${cx - 13 * w},${cy - 30} L ${cx + 17 * w},${cy - 32}`} stroke={CONTORNO} strokeWidth={2.5} />
      <path d={`M ${cx + 6 * w},${cy - 26} L ${cx + 10 * w},${cy - 14}`} stroke={schiarisci(colore, 0.35)} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

function Busto({ w, primario, secondario, accento, pelle, corazzato }: { w: number; primario: string; secondario: string; accento: string; pelle: string; corazzato: boolean }) {
  const busto = `M ${-34 * w},-372 Q 6,-386 ${46 * w},-374 L ${50 * w},-348 Q ${46 * w},-306 ${26 * w},-276 L ${-22 * w},-274 Q ${-42 * w},-314 ${-42 * w},-350 Z`;
  const ombra = `M ${-34 * w},-372 Q ${-14 * w},-378 ${-6 * w},-378 Q ${-16 * w},-320 ${-4 * w},-274 L ${-22 * w},-274 Q ${-42 * w},-314 ${-42 * w},-350 Z`;
  return (
    <g>
      {/* bacino */}
      <Forma
        colore={scurisci(secondario, 0.92)}
        d={`M ${-26 * w},-284 L ${30 * w},-286 L ${34 * w},-232 Q ${4 * w},-222 ${-28 * w},-228 Z`}
        ombra={`M ${-26 * w},-284 L ${-2 * w},-285 L ${-2 * w},-224 Q ${-16 * w},-224 ${-28 * w},-228 Z`}
      />
      <Forma colore={primario} d={busto} ombra={ombra} />
      {/* scollo a V sulla pelle */}
      <path d={`M ${-2 * w},-380 L ${14 * w},-344 L ${30 * w},-378 Z`} fill={pelle} {...tratto} strokeWidth={2.5} />
      <path d={`M ${-2 * w},-380 L ${8 * w},-358 L ${10 * w},-366 Z`} fill={scurisci(pelle)} />
      {/* pettorali e addome, a inchiostro */}
      <path d={`M ${-4 * w},-334 Q ${16 * w},-318 ${44 * w},-332`} stroke={CONTORNO} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d={`M ${16 * w},-318 L ${16 * w},-286 M ${4 * w},-306 Q ${16 * w},-302 ${30 * w},-306 M ${4 * w},-292 Q ${16 * w},-288 ${28 * w},-292`} stroke={scurisci(primario, 0.5)} strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d={`M ${32 * w},-366 Q ${44 * w},-350 ${42 * w},-336`} stroke={schiarisci(primario, 0.35)} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      {/* tracolla o cinghie dell'armatura */}
      <path d={`M ${-30 * w},-366 L ${36 * w},-282`} stroke={CONTORNO} strokeWidth={13} strokeLinecap="round" />
      <path d={`M ${-30 * w},-366 L ${36 * w},-282`} stroke={corazzato ? METALLO : scurisci(secondario, 0.75)} strokeWidth={8} strokeLinecap="round" />
      {/* cintura */}
      <path d={`M ${-26 * w},-284 Q ${4 * w},-292 ${32 * w},-288 L ${32 * w},-270 Q ${4 * w},-274 ${-26 * w},-266 Z`} fill={scurisci(secondario, 0.55)} {...tratto} />
      <rect x={4 * w} y={-288} width={14} height={18} rx={2} fill={accento} stroke={CONTORNO} strokeWidth={2.5} />
    </g>
  );
}

function Aura({ colore, w, sfocatura }: { colore: string; w: number; sfocatura: string }) {
  // fiamma di energia con i bordi a lingue, chiara al centro
  const fiamma = (k: number) =>
    `M 0,${20 * k} Q ${-120 * w * k},${-40 * k} ${-110 * w * k},${-220 * k} L ${-150 * w * k},${-300 * k} L ${-96 * w * k},${-300 * k} L ${-120 * w * k},${-420 * k} L ${-50 * w * k},${-370 * k} L ${-30 * k},${-520 * k} L ${20 * k},${-400 * k} L ${70 * k},${-540 * k} L ${84 * k},${-390 * k} L ${150 * w * k},${-460 * k} L ${120 * w * k},${-300 * k} L ${170 * w * k},${-300 * k} L ${120 * w * k},${-200 * k} Q ${120 * w * k},${-40 * k} 0,${20 * k} Z`;
  return (
    <g>
      <path d={fiamma(1)} fill={colore} opacity={0.3} filter={`url(#${sfocatura})`} />
      <path d={fiamma(1)} fill={colore} opacity={0.35} stroke={schiarisci(colore, 0.5)} strokeWidth={3} strokeLinejoin="round" />
      <path d={fiamma(0.8)} fill="#fff" opacity={0.25} transform="translate(0 -40)" />
    </g>
  );
}

// ——— testa ———

function Testa({ essenza, sfocatura }: { essenza: Essenza; sfocatura: string }) {
  const { pelle } = essenza;
  const { accento, primario } = essenza.palette;
  const stile = essenza.capelli.stile;
  const capelli = essenza.capelli.colore;
  const segno = essenza.segnoDistintivo.tipo;
  const luce = segno === "occhio_luminoso";
  const iride = luce ? accento : "#1d2233";
  const viso = "M -28,0 Q -30,-36 2,-37 Q 30,-37 31,-12 L 33,-4 L 39,7 L 33,10 L 33,15 L 29,23 Q 24,32 13,32 L -4,25 Q -22,16 -28,0 Z";
  return (
    <g transform={`translate(${TESTA[0]} ${TESTA[1]}) rotate(-4)`}>
      {stile === "cappuccio" && (
        <Forma
          colore={primario}
          d="M 36,-18 Q 36,-50 2,-52 Q -42,-52 -46,-8 L -52,44 L -16,44 L -2,30 L 22,-16 Z"
          ombra="M 2,-52 Q -42,-52 -46,-8 L -52,44 L -16,44 Q -30,10 -20,-30 Z"
        />
      )}
      <Forma colore={pelle} d={viso} ombra="M -28,0 Q -22,16 -4,25 L 13,32 Q 2,24 -2,12 Q -6,-6 -18,-14 Q -26,-12 -28,0 Z" f={0.8} />
      {/* orecchio */}
      <path d="M -6,-8 Q -16,-8 -14,4 Q -12,12 -4,10" fill={scurisci(pelle, 0.85)} {...tratto} strokeWidth={2.5} />
      {stile !== "elmo" && (
        <g>
          {/* occhio lontano, di scorcio */}
          <path d="M 32,-6 L 37,-7 L 35,-3 Z" fill={iride} stroke={CONTORNO} strokeWidth={1.5} />
          {/* occhio vicino: taglio stretto e deciso */}
          <path d="M 11,-7 L 27,-9 L 25,-2 L 14,-1 Z" fill="#fff" stroke={CONTORNO} strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M 19,-8.5 L 25,-9 L 24,-1.5 L 19,-1.2 Z" fill={iride} />
          {luce && <circle cx={22} cy={-5} r={12} fill={accento} opacity={0.75} filter={`url(#${sfocatura})`} />}
          <circle cx={23} cy={-6.5} r={1.4} fill="#fff" />
          <path d="M 9,-8 L 28,-11" stroke={CONTORNO} strokeWidth={3.5} strokeLinecap="round" />
          {/* sopracciglio corrucciato */}
          <path d="M 6,-20 L 30,-13 L 31,-17 L 9,-24 Z" fill={scurisci(capelli, 0.7)} stroke={CONTORNO} strokeWidth={1.5} strokeLinejoin="round" />
          {/* naso, bocca, zigomo */}
          <path d="M 33,-4 L 39,7 L 33,9" fill="none" stroke={CONTORNO} strokeWidth={2} strokeLinejoin="round" />
          <path d="M 22,18 L 31,17" stroke={CONTORNO} strokeWidth={2.5} strokeLinecap="round" />
          <path d="M 8,6 Q 14,12 20,10" stroke={scurisci(pelle, 0.7)} strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      )}
      {segno === "cicatrice" && <path d="M 12,-20 L 26,8" stroke="#7a2424" strokeWidth={3} strokeLinecap="round" />}
      <Capelli stile={stile} colore={capelli} primario={primario} accento={accento} sfocatura={sfocatura} />
      {segno === "corna" && (
        <g>
          <Forma colore="#e9dcc0" d="M -12,-30 Q -34,-52 -22,-84 Q -18,-60 4,-38 Z" ombra="M -12,-30 Q -34,-52 -22,-84 Q -24,-56 -6,-34 Z" />
          <Forma colore="#e9dcc0" d="M 18,-36 Q 22,-62 46,-80 Q 34,-58 30,-32 Z" ombra="M 18,-36 Q 22,-62 46,-80 Q 30,-60 24,-34 Z" />
        </g>
      )}
    </g>
  );
}

function Capelli({ stile, colore, primario, accento, sfocatura }: { stile: Essenza["capelli"]["stile"]; colore: string; primario: string; accento: string; sfocatura: string }) {
  // ciuffi lunghi e affilati spazzati all'indietro, con la frangia sulla fronte
  const ciuffi =
    "M 31,-12 L 36,-24 L 22,-28 L 34,-46 L 12,-40 L 14,-66 L -6,-44 L -22,-64 L -24,-40 L -48,-50 L -34,-26 L -54,-20 L -32,-10 L -28,6 L -22,-6 L -12,-14 L 0,-20 L 8,-12 L 14,-22 L 20,-14 L 26,-20 Z";
  const ombraCiuffi = "M -6,-44 L -22,-64 L -24,-40 L -48,-50 L -34,-26 L -54,-20 L -32,-10 L -28,6 L -22,-6 L -12,-14 L -8,-30 Z";
  switch (stile) {
    case "corti":
    case "lunghi":
      return (
        <g>
          <Forma colore={colore} d={ciuffi} ombra={ombraCiuffi} />
          <path d="M 2,-38 L 14,-30 M 18,-36 L 26,-30" stroke={schiarisci(colore, 0.45)} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      );
    case "rasati":
      return (
        <g>
          <path d="M -28,0 Q -30,-36 2,-37 Q 30,-37 31,-14 L 22,-20 Q 6,-26 -8,-20 L -20,-6 Z" fill={colore} opacity={0.88} stroke={CONTORNO} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M -20,-24 Q -4,-34 16,-30" stroke={schiarisci(colore, 0.35)} strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      );
    case "cresta":
      return (
        <g>
          <path d="M -28,0 Q -30,-36 2,-37 Q 30,-37 31,-14 L 22,-20 Q 6,-26 -8,-20 L -20,-6 Z" fill={scurisci(colore, 0.45)} opacity={0.9} stroke={CONTORNO} strokeWidth={2.5} strokeLinejoin="round" />
          <Forma colore={colore} d="M -30,-16 L -44,-44 L -22,-42 L -24,-70 L -4,-50 L 6,-78 L 14,-48 L 30,-62 L 24,-30 Q 0,-42 -30,-16 Z" ombra="M -30,-16 L -44,-44 L -22,-42 L -24,-70 L -4,-50 L -6,-36 Z" />
        </g>
      );
    case "cappuccio":
      return (
        <g>
          {/* la falda del cappuccio getta ombra sugli occhi */}
          <path d="M -24,-30 Q 4,-30 32,-12 L 34,0 Q 10,-10 -16,-6 Z" fill="#000" opacity={0.38} />
          <Forma colore={primario} d="M -30,-24 Q 2,-50 38,-22 L 40,-12 Q 8,-34 -22,-12 Z" ombra="M -30,-24 Q -14,-38 2,-40 Q -12,-30 -22,-12 Z" />
        </g>
      );
    case "elmo":
      return (
        <g>
          <Forma
            colore={METALLO}
            d="M -32,6 Q -36,-44 2,-44 Q 38,-44 38,-12 L 42,10 L 34,30 L 8,36 L -18,28 Z"
            ombra="M -32,6 Q -36,-44 2,-44 Q -18,-30 -16,0 L -6,32 L -18,28 Z"
          />
          <path d="M 2,-44 Q 18,-20 20,34" stroke={CONTORNO} strokeWidth={2.5} fill="none" />
          <path d="M 10,-8 L 40,-10 L 40,-2 L 12,0 Z" fill="#14161d" stroke={CONTORNO} strokeWidth={2} />
          <path d="M 16,-6 L 38,-7" stroke={accento} strokeWidth={2.5} strokeLinecap="round" />
          <path d="M 16,-6 L 38,-7" stroke={accento} strokeWidth={6} opacity={0.6} filter={`url(#${sfocatura})`} />
          <path d="M 18,8 L 34,8 M 18,14 L 32,15 M 18,20 L 30,22" stroke={CONTORNO} strokeWidth={2} />
          <path d="M 10,-38 Q 26,-36 32,-20" stroke="#eef1f5" strokeWidth={3} fill="none" strokeLinecap="round" />
          {/* cresta dell'elmo */}
          <path d="M -26,-30 Q -6,-62 26,-44 L 20,-38 Q -4,-50 -20,-24 Z" fill={accento} {...tratto} strokeWidth={2.5} />
        </g>
      );
  }
}

// ——— armi (ancorate alla mano davanti) ———

function Spada({ mano, accento, secondario }: { mano: P; accento: string; secondario: string }) {
  const [x, y] = mano;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M -10,14 L 4,-2" stroke={CONTORNO} strokeWidth={11} strokeLinecap="round" />
      <path d="M -10,14 L 4,-2" stroke={scurisci(secondario, 0.6)} strokeWidth={6} strokeLinecap="round" />
      <circle cx={-14} cy={18} r={6} fill={accento} stroke={CONTORNO} strokeWidth={2.5} />
      <path d="M 4,-10 L 140,-152 L 152,-170 L 146,-146 L 12,-2 Z" fill="#e9eef4" {...tratto} />
      <path d="M 8,-6 L 146,-154 L 12,-2 Z" fill="#b9c3cf" />
      <path d="M 10,-12 L 138,-148" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
      <path d="M -8,-18 L 22,12" stroke={CONTORNO} strokeWidth={12} strokeLinecap="round" />
      <path d="M -8,-18 L 22,12" stroke={accento} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
}

function Bastone({ mano, accento, sfocatura }: { mano: P; accento: string; sfocatura: string }) {
  const [x, y] = mano;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M -10,160 L 2,40 Q 6,0 2,-60 Q 0,-120 10,-170" stroke={CONTORNO} strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d="M -10,160 L 2,40 Q 6,0 2,-60 Q 0,-120 10,-170" stroke="#5c3f26" strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M 10,-170 Q 34,-196 22,-222 Q 6,-236 -8,-218 Q 18,-214 14,-190 Z" fill="#5c3f26" {...tratto} strokeWidth={3} />
      <circle cx={8} cy={-196} r={26} fill={accento} opacity={0.6} filter={`url(#${sfocatura})`} />
      <path d="M 8,-214 L 18,-196 L 8,-178 L -2,-196 Z" fill={accento} {...tratto} strokeWidth={2.5} />
      <path d="M 8,-210 L 12,-196" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function Arco({ mano, accento }: { mano: P; accento: string }) {
  const [x, y] = mano;
  const arco = "M -6,-140 Q 10,-150 20,-120 Q 40,-60 14,0 Q 40,60 20,120 Q 10,150 -6,140";
  return (
    <g transform={`translate(${x - 8} ${y})`}>
      <path d={arco} stroke={CONTORNO} strokeWidth={13} fill="none" strokeLinecap="round" />
      <path d={arco} stroke="#6e4a2a" strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M -6,-140 L -100,0 L -6,140" stroke="#eae2d2" strokeWidth={1.8} fill="none" />
      <path d="M -100,0 L 70,0" stroke={CONTORNO} strokeWidth={5} strokeLinecap="round" />
      <path d="M -100,0 L 70,0" stroke="#c9b38e" strokeWidth={2} strokeLinecap="round" />
      <path d="M 70,-6 L 88,0 L 70,6 Z" fill={METALLO} stroke={CONTORNO} strokeWidth={2} />
      <path d="M -100,0 L -90,-8 L -80,0 L -90,8 Z" fill={accento} stroke={CONTORNO} strokeWidth={1.5} />
    </g>
  );
}

function Pistola({ mano, accento }: { mano: P; accento: string }) {
  const [x, y] = mano;
  return (
    <g transform={`translate(${x} ${y})`} {...tratto} strokeWidth={2.5}>
      <path d="M -6,-14 L 62,-14 L 62,-2 L 14,-2 L 10,16 L -6,16 Z" fill="#3b3c45" />
      <path d="M 0,-20 L 54,-20 L 54,-14 L 0,-14 Z" fill="#555766" />
      <path d="M 4,-12 L 52,-12" stroke="#7d8090" strokeWidth={2} />
      <circle cx={60} cy={-8} r={3} fill={accento} stroke="none" />
    </g>
  );
}
