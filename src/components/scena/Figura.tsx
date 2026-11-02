import { useId } from "react";
import type { Essenza } from "@/lib/personaggio/essenza";
import { CONTORNO, scurisci, schiarisci } from "./colori";

/**
 * Figura segnaposto in "Stile Varco", disegnata in SVG a partire dall'Essenza:
 * testa grande e tonda, occhioni espressivi, capelli a ciuffi appuntiti, arti morbidi "a tubo",
 * scarponi tondi e contorni spessi, come un vecchio cartone d'avventura.
 * È sempre in posa di combattimento, rivolta a destra, coi piedi nell'origine (0,0) e alta circa 480 unità.
 * Quando un personaggio avrà la sua illustrazione definitiva, `Cartoncino` userà quella al posto di questa.
 */

const LARGHEZZA: Record<Essenza["corporatura"], number> = { esile: 0.86, media: 1, robusta: 1.16, imponente: 1.32 };
const METALLO = "#9aa3b0";
const GUANCE = "#ff8f8f";
const T = 5; // spessore del contorno

const tratto = { stroke: CONTORNO, strokeWidth: T, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Arto morbido: una curva con contorno, senza gomiti né ginocchia. */
function Tubo({ d, spessore, colore }: { d: string; spessore: number; colore: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={CONTORNO} strokeWidth={spessore + T * 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke={colore} strokeWidth={spessore} strokeLinecap="round" />
    </>
  );
}

/** Scarpone tondo con un riflesso. */
function Scarpone({ x, colore }: { x: number; colore: string }) {
  return (
    <g>
      <path d={`M ${x - 30},-2 Q ${x - 32},-34 ${x},-34 Q ${x + 40},-32 ${x + 42},-2 Z`} fill={colore} {...tratto} />
      <path d={`M ${x - 12},-24 Q ${x + 2},-30 ${x + 16},-26`} stroke={schiarisci(colore, 0.45)} strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  );
}

// testa
const TX = 14;
const TY = -350;
const TR = 66;

export function Figura({ essenza }: { essenza: Essenza }) {
  const uid = useId().replace(/:/g, "");
  const w = LARGHEZZA[essenza.corporatura];
  const s = essenza.altezza * (essenza.corporatura === "imponente" ? 1.06 : 1);
  const { primario, secondario, accento } = essenza.palette;
  const pelle = essenza.pelle;
  const capelli = essenza.capelli.colore;
  const stile = essenza.capelli.stile;
  const segno = essenza.segnoDistintivo.tipo;
  const arma = essenza.arma.tipo;
  const elmo = stile === "elmo";
  const occhioLuce = segno === "occhio_luminoso";
  const meccanico = segno === "braccio_meccanico";
  const sfocatura = `sf-${uid}`;
  const scarpe = scurisci(secondario, 0.5);

  // mani: quella davanti regge l'arma, quella dietro sta in guardia
  const manoDx: [number, number] = [112, -262];
  const manoSx: [number, number] = [-2, -206];

  return (
    <g transform={`scale(${s})`}>
      <defs>
        <filter id={sfocatura} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* dietro al corpo */}
      {segno === "aura" && <ellipse cx={0} cy={-230} rx={160 * w} ry={260} fill={accento} opacity={0.35} filter={`url(#${sfocatura})`} />}
      {segno === "ali" && (
        <g transform="translate(0 50)" opacity={0.9}>
          <path d="M -20,-320 Q -120,-470 -200,-470 Q -170,-430 -200,-410 Q -160,-390 -190,-360 Q -130,-350 -150,-320 Q -80,-320 -36,-288 Z" fill={accento} {...tratto} />
          <path d="M -14,-312 Q -80,-420 -130,-428 Q -110,-390 -130,-372 Q -90,-350 -30,-300 Z" fill={schiarisci(accento)} />
        </g>
      )}
      {segno === "mantello" && (
        <g>
          <path d={`M ${-40 * w},-282 Q -120,-200 -150,-20 Q -120,-4 -100,-26 Q -80,-2 -56,-30 Q -40,-150 ${26 * w},-282 Z`} fill={secondario} {...tratto} />
          <path d={`M ${-40 * w},-282 Q -120,-200 -150,-20 Q -120,-4 -100,-26 Q -86,-170 ${-10 * w},-280 Z`} fill={scurisci(secondario)} />
        </g>
      )}
      <CapelliDietro stile={stile} colore={capelli} primario={primario} />

      {/* braccio dietro */}
      <Tubo d={`M ${-30 * w},-268 Q -70,-200 ${manoSx[0]},${manoSx[1]}`} spessore={22 * w} colore={meccanico ? METALLO : scurisci(primario)} />
      {meccanico && (
        <>
          <circle cx={-44} cy={-226} r={8} fill={accento} stroke={CONTORNO} strokeWidth={3} />
          <path d="M -38,-258 Q -48,-246 -50,-236" stroke={schiarisci(METALLO, 0.5)} strokeWidth={4} fill="none" strokeLinecap="round" />
        </>
      )}
      <circle cx={manoSx[0]} cy={manoSx[1]} r={arma === "pugni" ? 22 : 15} fill={arma === "pugni" ? accento : meccanico ? METALLO : pelle} {...tratto} />

      {/* gamba dietro */}
      <Tubo d={`M ${-14 * w},-170 Q ${-52 * w},-100 ${-50 * w},-26`} spessore={28 * w} colore={scurisci(secondario)} />
      <Scarpone x={-56 * w} colore={scurisci(scarpe, 0.8)} />

      {/* busto a fagiolo */}
      <path
        d={`M ${-40 * w},-288 Q 0,-300 ${40 * w},-288 Q ${54 * w},-220 ${36 * w},-160 Q 0,-148 ${-36 * w},-160 Q ${-54 * w},-220 ${-40 * w},-288 Z`}
        fill={primario}
      />
      <path d={`M ${-40 * w},-288 Q ${-8 * w},-296 ${-6 * w},-292 Q ${-16 * w},-220 ${-10 * w},-152 Q ${-26 * w},-154 ${-36 * w},-160 Q ${-54 * w},-220 ${-40 * w},-288 Z`} fill={scurisci(primario)} />
      <path
        d={`M ${-40 * w},-288 Q 0,-300 ${40 * w},-288 Q ${54 * w},-220 ${36 * w},-160 Q 0,-148 ${-36 * w},-160 Q ${-54 * w},-220 ${-40 * w},-288 Z`}
        fill="none"
        {...tratto}
      />
      <path d={`M ${16 * w},-270 Q ${30 * w},-250 ${32 * w},-226`} stroke={schiarisci(primario, 0.4)} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={`M ${-44 * w},-188 Q 0,-196 ${44 * w},-188 L ${40 * w},-166 Q 0,-158 ${-40 * w},-166 Z`} fill={secondario} {...tratto} />
      <circle cx={6} cy={-178} r={9} fill={accento} stroke={CONTORNO} strokeWidth={3} />

      {/* scudo, tenuto dal braccio dietro ma davanti al busto */}
      {arma === "scudo" && (
        <g>
          <ellipse cx={36} cy={-228} rx={50} ry={66} fill={secondario} {...tratto} strokeWidth={6} />
          <ellipse cx={32} cy={-228} rx={34} ry={50} fill={scurisci(secondario)} />
          <circle cx={36} cy={-228} r={15} fill={accento} {...tratto} />
          <path d="M 4,-268 Q 14,-284 30,-288" stroke={schiarisci(secondario, 0.5)} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* gamba davanti */}
      <Tubo d={`M ${16 * w},-170 Q ${64 * w},-110 ${50 * w},-26`} spessore={28 * w} colore={secondario} />
      <Scarpone x={58 * w} colore={scarpe} />

      {/* testa grande */}
      <ellipse cx={-10} cy={-342} rx={11} ry={15} fill={pelle} {...tratto} />
      <circle cx={TX} cy={TY} r={TR} fill={pelle} {...tratto} />
      <path d={`M ${TX - TR + 4},-338 Q ${TX - 40},-290 ${TX + 8},-285 Q ${TX - 30},-300 ${TX - TR + 4},-338 Z`} fill={scurisci(pelle, 0.86)} />
      {!elmo && <Volto pelle={pelle} accento={accento} luce={occhioLuce} sfocatura={sfocatura} />}
      {segno === "cicatrice" && <path d="M 44,-382 L 66,-330" stroke="#a13a3a" strokeWidth={4} strokeLinecap="round" />}
      <Capelli stile={stile} colore={capelli} primario={primario} accento={accento} sfocatura={sfocatura} />
      {segno === "corna" && (
        <g fill="#f4e8c8" {...tratto}>
          <path d="M -22,-396 Q -54,-420 -48,-468 Q -30,-436 -4,-414 Z" />
          <path d="M 46,-412 Q 62,-440 56,-484 Q 82,-450 66,-400 Z" />
        </g>
      )}

      {/* braccio davanti con l'arma */}
      <g transform="translate(-2 38)">
        {arma === "bastone" && (
          <g>
            <Tubo d="M 96,-186 L 140,-476" spessore={11} colore="#7a5532" />
            <circle cx={142} cy={-492} r={32} fill={accento} opacity={0.55} filter={`url(#${sfocatura})`} />
            <circle cx={142} cy={-492} r={18} fill={accento} {...tratto} />
            <circle cx={136} cy={-498} r={5} fill="#fff" opacity={0.8} />
          </g>
        )}
        {arma === "arco" && (
          <g>
            <path d="M 124,-430 Q 196,-300 124,-170" fill="none" stroke={CONTORNO} strokeWidth={18} strokeLinecap="round" />
            <path d="M 124,-430 Q 196,-300 124,-170" fill="none" stroke="#8a5d34" strokeWidth={9} strokeLinecap="round" />
            <line x1={124} y1={-430} x2={124} y2={-170} stroke="#f0e8d8" strokeWidth={2.5} />
            <line x1={70} y1={-300} x2={205} y2={-300} stroke={CONTORNO} strokeWidth={6} strokeLinecap="round" />
            <path d="M 204,-310 Q 226,-300 204,-290 Z" fill={accento} {...tratto} strokeWidth={3} />
          </g>
        )}
      </g>
      <Tubo d={`M ${30 * w},-270 Q 84,-214 ${manoDx[0]},${manoDx[1]}`} spessore={22 * w} colore={primario} />
      <g transform="translate(-2 38)">
        {arma === "spada" && (
          <g>
            <path d="M 122,-308 L 236,-418 Q 258,-436 250,-412 L 136,-294 Z" fill="#eef3f8" {...tratto} />
            <path d="M 132,-312 L 238,-414" stroke={accento} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
            <Tubo d="M 104,-324 L 140,-288" spessore={10} colore={secondario} />
            <circle cx={104} cy={-324} r={7} fill={accento} stroke={CONTORNO} strokeWidth={3} />
          </g>
        )}
        {arma === "pistola" && (
          <g {...tratto}>
            <rect x={104} y={-326} width={66} height={24} rx={11} fill="#4a4a58" />
            <rect x={108} y={-314} width={20} height={34} rx={9} fill="#34343f" />
            <circle cx={176} cy={-314} r={7} fill={accento} />
            <path d="M 118,-318 L 156,-318" stroke="#8d8da0" strokeWidth={4} />
          </g>
        )}
      </g>
      <circle cx={manoDx[0]} cy={manoDx[1]} r={arma === "pugni" ? 24 : 16} fill={arma === "pugni" ? accento : pelle} {...tratto} />
      {arma === "pugni" && <path d={`M ${manoDx[0] - 8},${manoDx[1] - 14} Q ${manoDx[0] + 4},${manoDx[1] - 18} ${manoDx[0] + 12},${manoDx[1] - 10}`} stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />}
    </g>
  );
}

/** Occhioni con doppio riflesso, sopracciglia decise, guance rosate e un sorriso sfrontato. */
function Volto({ pelle, accento, luce, sfocatura }: { pelle: string; accento: string; luce: boolean; sfocatura: string }) {
  const iride = luce ? accento : "#2a3150";
  return (
    <g>
      <ellipse cx={58} cy={-318} rx={11} ry={6} fill={GUANCE} opacity={0.45} />
      <ellipse cx={22} cy={-352} rx={9} ry={16} fill="#fff" stroke={CONTORNO} strokeWidth={3.5} />
      <ellipse cx={25} cy={-349} rx={6} ry={11} fill={iride} />
      <ellipse cx={52} cy={-352} rx={14} ry={21} fill="#fff" stroke={CONTORNO} strokeWidth={4} />
      <ellipse cx={56} cy={-348} rx={10} ry={16} fill={iride} />
      <circle cx={56} cy={-347} r={5} fill={luce ? "#fff" : "#10131f"} opacity={luce ? 0.6 : 1} />
      {luce && <circle cx={56} cy={-348} r={22} fill={accento} opacity={0.55} filter={`url(#${sfocatura})`} />}
      <circle cx={60} cy={-356} r={4.5} fill="#fff" />
      <circle cx={52} cy={-340} r={2} fill="#fff" />
      <circle cx={27} cy={-355} r={3} fill="#fff" />
      <path d="M 10,-378 Q 22,-386 32,-380" stroke={CONTORNO} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M 40,-382 Q 56,-388 70,-376" stroke={CONTORNO} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M 74,-336 Q 80,-332 76,-326" stroke={scurisci(pelle, 0.6)} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M 46,-310 Q 60,-300 74,-314" stroke={CONTORNO} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <path d="M 70,-318 L 76,-310" stroke={CONTORNO} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}

/** Le parti della capigliatura che stanno dietro la testa e il busto. */
function CapelliDietro({ stile, colore, primario }: { stile: Essenza["capelli"]["stile"]; colore: string; primario: string }) {
  if (stile === "lunghi") {
    return (
      <path
        d="M -30,-400 Q -80,-360 -78,-280 Q -84,-230 -60,-206 Q -50,-230 -40,-214 Q -34,-236 -22,-222 Q -24,-300 0,-340 Z"
        fill={scurisci(colore, 0.85)}
        {...tratto}
      />
    );
  }
  if (stile === "cappuccio") {
    return (
      <g>
        <path
          d={`M ${TX - 84},-300 Q ${TX - 94},-420 ${TX - 40},-436 Q ${TX - 40},-466 ${TX - 16},-460 Q ${TX},-444 ${TX + 6},-440 Q ${TX + 20},-470 ${TX + 44},-454 Q ${TX + 50},-436 ${TX + 50},-430 Q ${TX + 96},-404 ${TX + 88},-320 Q ${TX},-286 ${TX - 84},-300 Z`}
          fill={primario}
          {...tratto}
        />
        <path d={`M ${TX - 84},-300 Q ${TX - 94},-420 ${TX - 40},-436 Q ${TX - 60},-380 ${TX - 50},-292 Z`} fill={scurisci(primario)} />
      </g>
    );
  }
  return null;
}

function Capelli({ stile, colore, primario, accento, sfocatura }: { stile: Essenza["capelli"]["stile"]; colore: string; primario: string; accento: string; sfocatura: string }) {
  // ciuffi grossi e appuntiti che scendono in una frangia sopra gli occhi
  const ciuffi =
    "M -56,-326 L -92,-362 L -56,-386 L -84,-432 L -30,-428 L -26,-484 L 14,-440 L 44,-486 L 56,-430 L 98,-438 L 80,-394 L 96,-372 Q 74,-382 68,-386 L 62,-370 L 48,-392 L 32,-372 L 22,-396 L 4,-376 L -6,-394 Q -24,-380 -40,-330 Z";
  const riflesso = <path d="M -30,-424 Q -6,-440 22,-430 M 30,-436 Q 50,-442 66,-426" stroke={schiarisci(colore, 0.45)} strokeWidth={6} fill="none" strokeLinecap="round" />;
  switch (stile) {
    case "corti":
    case "lunghi":
      return (
        <g>
          <path d={ciuffi} fill={colore} {...tratto} />
          <path d="M -56,-326 L -92,-362 L -56,-386 L -84,-432 L -30,-428 Q -40,-380 -40,-330 Z" fill={scurisci(colore, 0.82)} />
          {riflesso}
        </g>
      );
    case "rasati":
      return (
        <g>
          <path d={`M ${TX - TR + 6},-356 Q ${TX - TR + 6},-418 ${TX},-418 Q ${TX + TR - 4},-418 ${TX + TR - 2},-376 Q ${TX + 20},-398 ${TX - TR + 6},-356 Z`} fill={colore} opacity={0.9} {...tratto} strokeWidth={4} />
          <path d={`M ${TX - 30},-406 Q ${TX},-412 ${TX + 26},-404`} stroke={schiarisci(colore, 0.4)} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      );
    case "cresta":
      return (
        <g>
          <path d={`M ${TX - TR + 6},-356 Q ${TX - TR + 6},-418 ${TX},-418 Q ${TX + TR - 4},-418 ${TX + TR - 2},-376 Q ${TX + 20},-398 ${TX - TR + 6},-356 Z`} fill={scurisci(colore, 0.5)} {...tratto} strokeWidth={4} />
          <path d="M -34,-404 L -48,-470 L -8,-424 L 6,-500 L 26,-424 L 56,-486 L 58,-414 Q 14,-428 -34,-404 Z" fill={colore} {...tratto} />
          <path d="M 4,-480 L 12,-436" stroke={schiarisci(colore, 0.45)} strokeWidth={5} strokeLinecap="round" />
        </g>
      );
    case "cappuccio":
      return (
        <g>
          <path d={`M ${TX - TR + 2},-350 Q ${TX - TR},-414 ${TX},-416 Q ${TX + TR},-416 ${TX + TR + 4},-372 Q ${TX + 30},-404 ${TX - TR + 2},-350 Z`} fill={primario} {...tratto} />
          <path d={`M ${TX - 26},-406 Q ${TX},-412 ${TX + 30},-402`} stroke={schiarisci(primario, 0.35)} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      );
    case "elmo":
      return (
        <g>
          <line x1={TX} y1={-414} x2={TX - 6} y2={-452} stroke={CONTORNO} strokeWidth={6} strokeLinecap="round" />
          <circle cx={TX - 6} cy={-458} r={11} fill={accento} {...tratto} strokeWidth={4} />
          <path d={`M ${TX - TR - 4},-330 Q ${TX - TR - 6},-424 ${TX},-424 Q ${TX + TR + 8},-424 ${TX + TR + 6},-330 Z`} fill={METALLO} {...tratto} />
          <path d={`M ${TX - 34},-398 Q ${TX},-414 ${TX + 34},-404`} stroke="#e8ecf2" strokeWidth={7} fill="none" strokeLinecap="round" />
          <rect x={TX - 6} y={-372} width={TR + 14} height={24} rx={12} fill="#2a2f3e" {...tratto} strokeWidth={4} />
          <rect x={TX + 10} y={-366} width={TR - 14} height={8} rx={4} fill={accento} />
          <rect x={TX + 10} y={-366} width={TR - 14} height={8} rx={4} fill={accento} opacity={0.7} filter={`url(#${sfocatura})`} />
        </g>
      );
  }
}
