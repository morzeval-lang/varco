import { useId } from "react";
import type { Essenza } from "@/lib/personaggio/essenza";
import { CONTORNO, scurisci, schiarisci } from "./colori";

/**
 * Figura segnaposto in stile anime piatto, disegnata in SVG a partire dall'Essenza.
 * È sempre in posa di combattimento, rivolta a destra, coi piedi nell'origine (0,0) e alta circa 480 unità.
 * Quando un personaggio avrà la sua illustrazione definitiva, `Cartoncino` userà quella al posto di questa.
 */

const LARGHEZZA: Record<Essenza["corporatura"], number> = { esile: 0.86, media: 1, robusta: 1.16, imponente: 1.32 };
const METALLO = "#8f96a3";

type Punto = [number, number];

function Arto({ punti, spessore, colore }: { punti: Punto[]; spessore: number; colore: string }) {
  const p = punti.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <>
      <polyline points={p} fill="none" stroke={CONTORNO} strokeWidth={spessore + 8} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={p} fill="none" stroke={colore} strokeWidth={spessore} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

const tratto = { stroke: CONTORNO, strokeWidth: 4, strokeLinejoin: "round" as const };

export function Figura({ essenza }: { essenza: Essenza }) {
  const uid = useId().replace(/:/g, "");
  const w = LARGHEZZA[essenza.corporatura];
  const s = essenza.altezza * (essenza.corporatura === "imponente" ? 1.06 : 1);
  const { primario, secondario, accento } = essenza.palette;
  const pelle = essenza.pelle;
  const capelli = essenza.capelli.colore;
  const segno = essenza.segnoDistintivo.tipo;
  const arma = essenza.arma.tipo;
  const elmo = essenza.capelli.stile === "elmo";
  const occhioLuce = segno === "occhio_luminoso";
  const meccanico = segno === "braccio_meccanico";
  const sfocatura = `sf-${uid}`;

  const spallaDx: Punto = [30 * w, -325];
  const gomitoDx: Punto = [74, -290];
  const manoDx: Punto = [114, -300];
  const spallaSx: Punto = [-30 * w, -322];
  const gomitoSx: Punto = [-34, -262];
  const manoSx: Punto = [12, -246];

  return (
    <g transform={`scale(${s})`}>
      <defs>
        <filter id={sfocatura} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* dietro al corpo */}
      {segno === "aura" && <ellipse cx={0} cy={-235} rx={150 * w} ry={255} fill={accento} opacity={0.35} filter={`url(#${sfocatura})`} />}
      {segno === "ali" && (
        <g opacity={0.85}>
          <path d="M -20,-330 L -190,-480 L -160,-410 L -220,-430 L -165,-350 L -210,-335 L -40,-290 Z" fill={accento} {...tratto} />
          <path d="M -10,-320 L -130,-440 L -115,-380 L -160,-390 L -110,-330 L -30,-300 Z" fill={schiarisci(accento)} {...tratto} />
        </g>
      )}
      {segno === "mantello" && (
        <g>
          <path d={`M ${-42 * w},-335 Q -130,-250 -165,-50 L -110,-70 L -95,-40 L -40,-95 Q -20,-210 ${28 * w},-335 Z`} fill={secondario} {...tratto} />
          <path d={`M ${-42 * w},-335 Q -130,-250 -165,-50 L -110,-70 Q -90,-200 ${-10 * w},-330 Z`} fill={scurisci(secondario)} />
        </g>
      )}
      {essenza.capelli.stile === "lunghi" && (
        <path d="M -24,-418 Q -70,-370 -60,-250 L -30,-270 L -16,-240 L 0,-330 Z" fill={capelli} {...tratto} />
      )}

      {/* braccio dietro */}
      <Arto punti={[spallaSx, gomitoSx, manoSx]} spessore={24 * w} colore={meccanico ? METALLO : scurisci(primario)} />
      {meccanico && (
        <>
          <circle cx={gomitoSx[0]} cy={gomitoSx[1]} r={9} fill={accento} stroke={CONTORNO} strokeWidth={3} />
          <line x1={-28} y1={-300} x2={-36} y2={-282} stroke={accento} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
      <circle cx={manoSx[0]} cy={manoSx[1]} r={arma === "pugni" ? 19 : 12} fill={arma === "pugni" ? accento : meccanico ? METALLO : pelle} {...tratto} />

      {/* gamba dietro */}
      <Arto punti={[[-12 * w, -190], [-40 * w, -100], [-74 * w, -6]]} spessore={30 * w} colore={scurisci(secondario)} />
      <ellipse cx={-80 * w} cy={-4} rx={26} ry={12} fill={scurisci(secondario, 0.45)} {...tratto} />

      {/* busto */}
      <rect x={-9} y={-358} width={18} height={26} fill={pelle} {...tratto} />
      <path d={`M ${-47 * w},-336 L ${47 * w},-336 L ${35 * w},-198 L ${-35 * w},-198 Z`} fill={primario} {...tratto} />
      <path d={`M ${-47 * w},-336 L ${-6 * w},-336 L ${-12 * w},-198 L ${-35 * w},-198 Z`} fill={scurisci(primario)} />
      <path d={`M ${-47 * w},-336 L ${47 * w},-336 L ${35 * w},-198 L ${-35 * w},-198 Z`} fill="none" {...tratto} />
      <rect x={-37 * w} y={-214} width={74 * w} height={17} rx={3} fill={secondario} {...tratto} />
      <rect x={-6} y={-212} width={14} height={13} rx={2} fill={accento} stroke={CONTORNO} strokeWidth={2} />

      {/* scudo, tenuto dal braccio dietro ma davanti al busto */}
      {arma === "scudo" && (
        <g>
          <ellipse cx={34} cy={-268} rx={44} ry={66} fill={secondario} {...tratto} strokeWidth={5} />
          <ellipse cx={30} cy={-268} rx={30} ry={50} fill={scurisci(secondario)} />
          <circle cx={34} cy={-268} r={13} fill={accento} {...tratto} />
        </g>
      )}

      {/* gamba davanti */}
      <Arto punti={[[14 * w, -190], [52 * w, -108], [64 * w, -6]]} spessore={30 * w} colore={secondario} />
      <ellipse cx={74 * w} cy={-4} rx={28} ry={12} fill={scurisci(secondario, 0.45)} {...tratto} />

      {/* testa */}
      <ellipse cx={-2} cy={-382} rx={7} ry={10} fill={pelle} {...tratto} />
      <circle cx={10} cy={-386} r={40} fill={pelle} {...tratto} />
      <path d="M -30,-386 A 40 40 0 0 0 4,-347 Q -18,-370 -30,-386 Z" fill={scurisci(pelle, 0.86)} />
      {!elmo && (
        <g>
          <ellipse cx={8} cy={-388} rx={5} ry={10} fill="#fff" stroke={CONTORNO} strokeWidth={2.5} />
          <ellipse cx={31} cy={-389} rx={9} ry={13} fill="#fff" stroke={CONTORNO} strokeWidth={3} />
          <ellipse cx={34} cy={-387} rx={6} ry={10} fill={occhioLuce ? accento : "#2b3550"} />
          {occhioLuce && <circle cx={34} cy={-387} r={16} fill={accento} opacity={0.5} filter={`url(#${sfocatura})`} />}
          <circle cx={36} cy={-392} r={2.6} fill="#fff" />
          <path d="M 18,-406 L 42,-410" stroke={CONTORNO} strokeWidth={4} strokeLinecap="round" />
          <path d="M 34,-364 L 44,-366" stroke={CONTORNO} strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      {segno === "cicatrice" && <path d="M 20,-402 L 40,-370" stroke="#8c2f2f" strokeWidth={3.5} strokeLinecap="round" />}
      <Capelli stile={essenza.capelli.stile} colore={capelli} primario={primario} accento={accento} />
      {segno === "corna" && (
        <g fill="#efe3c6" {...tratto}>
          <path d="M -14,-414 Q -40,-440 -34,-478 Q -20,-446 2,-424 Z" />
          <path d="M 26,-424 Q 44,-450 40,-484 Q 58,-452 42,-416 Z" />
        </g>
      )}

      {/* braccio davanti con l'arma */}
      {arma === "bastone" && (
        <g>
          <Arto punti={[[96, -186], [140, -476]]} spessore={10} colore="#6b4a2b" />
          <circle cx={142} cy={-490} r={30} fill={accento} opacity={0.55} filter={`url(#${sfocatura})`} />
          <polygon points="142,-510 160,-490 142,-470 124,-490" fill={accento} {...tratto} />
        </g>
      )}
      {arma === "arco" && (
        <g>
          <path d="M 124,-430 Q 190,-300 124,-170" fill="none" stroke={CONTORNO} strokeWidth={15} strokeLinecap="round" />
          <path d="M 124,-430 Q 190,-300 124,-170" fill="none" stroke="#7a5230" strokeWidth={8} strokeLinecap="round" />
          <line x1={124} y1={-430} x2={124} y2={-170} stroke="#e8e0d0" strokeWidth={2} />
          <line x1={70} y1={-300} x2={205} y2={-300} stroke={CONTORNO} strokeWidth={5} />
          <polygon points="205,-308 222,-300 205,-292" fill={accento} {...tratto} strokeWidth={2} />
        </g>
      )}
      <Arto punti={[spallaDx, gomitoDx, manoDx]} spessore={24 * w} colore={primario} />
      {arma === "spada" && (
        <g>
          <line x1={120} y1={-306} x2={250} y2={-428} stroke={CONTORNO} strokeWidth={20} strokeLinecap="round" />
          <line x1={120} y1={-306} x2={250} y2={-428} stroke="#e6edf5" strokeWidth={12} strokeLinecap="round" />
          <line x1={132} y1={-322} x2={246} y2={-428} stroke={accento} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
          <line x1={104} y1={-322} x2={136} y2={-288} stroke={CONTORNO} strokeWidth={14} strokeLinecap="round" />
          <line x1={104} y1={-322} x2={136} y2={-288} stroke={secondario} strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {arma === "pistola" && (
        <g {...tratto}>
          <rect x={106} y={-322} width={58} height={18} rx={3} fill="#3d3d48" />
          <rect x={106} y={-312} width={16} height={30} rx={3} fill="#2c2c34" />
          <circle cx={170} cy={-313} r={5} fill={accento} />
        </g>
      )}
      <circle cx={manoDx[0]} cy={manoDx[1]} r={arma === "pugni" ? 21 : 13} fill={arma === "pugni" ? accento : pelle} {...tratto} />
    </g>
  );
}

function Capelli({ stile, colore, primario, accento }: { stile: Essenza["capelli"]["stile"]; colore: string; primario: string; accento: string }) {
  const frangia = "M -32,-380 Q -38,-428 10,-432 Q 56,-430 54,-396 L 44,-404 L 40,-388 L 30,-408 L 18,-396 L 8,-414 L -6,-394 L -20,-404 L -26,-370 Z";
  switch (stile) {
    case "corti":
    case "lunghi":
      return (
        <g>
          <path d={frangia} fill={colore} {...tratto} />
          <path d="M -20,-418 Q 4,-428 30,-420" stroke={schiarisci(colore, 0.4)} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      );
    case "rasati":
      return <path d="M -30,-392 Q -26,-428 12,-428 Q 48,-426 50,-400 Q 18,-414 -30,-392 Z" fill={colore} opacity={0.85} {...tratto} strokeWidth={3} />;
    case "cresta":
      return (
        <g>
          <path d="M -30,-392 Q -26,-428 12,-428 Q 48,-426 50,-400 Q 18,-414 -30,-392 Z" fill={scurisci(colore, 0.5)} {...tratto} strokeWidth={3} />
          <path d="M -24,-416 L -18,-466 L -2,-426 L 10,-478 L 22,-428 L 40,-466 L 44,-412 Z" fill={colore} {...tratto} />
        </g>
      );
    case "cappuccio":
      return (
        <g>
          <path d="M -44,-350 Q -56,-446 12,-446 Q 66,-442 60,-392 L 50,-392 Q 46,-422 12,-424 Q -24,-424 -26,-380 L -34,-330 Z" fill={primario} {...tratto} />
          <path d="M -44,-350 Q -56,-446 12,-446 Q -30,-420 -34,-330 Z" fill={scurisci(primario)} />
        </g>
      );
    case "elmo":
      return (
        <g>
          <path d="M -34,-370 Q -34,-440 12,-440 Q 58,-438 56,-386 L 56,-370 Z" fill={METALLO} {...tratto} />
          <path d="M -20,-420 Q 4,-434 32,-428" stroke="#dfe4ea" strokeWidth={5} fill="none" strokeLinecap="round" />
          <rect x={16} y={-396} width={40} height={8} rx={3} fill={accento} stroke={CONTORNO} strokeWidth={2.5} />
        </g>
      );
  }
}
