"use client";

import { useEffect, useRef, useState } from "react";
import type { Essenza } from "@/lib/personaggio/essenza";
import type { Copione, Inquadratura } from "@/lib/rules/types";
import { famiglia } from "@/lib/rules/combat";
import { Cartoncino } from "./Cartoncino";
import { Sfondo } from "./Sfondi";
import { COLORI_ELEMENTO } from "./colori";

/**
 * La scena clou in 2D "a cartoncini": sfondo fisso, personaggi immobili che scorrono, effetti in stile anime.
 * Tutto quello che succede è calcolato dal copione e dal tempo t: la scena non decide nulla
 * e, a parità di t, disegna sempre lo stesso fotogramma (utile per il laboratorio).
 */

export interface Lottatore {
  id: string;
  essenza: Essenza;
  immagine?: string;
  ko?: boolean;
}

interface Props {
  sinistra: Lottatore;
  destra: Lottatore;
  copione: Copione;
  onFine: () => void;
  immagineSfondo?: string;
  /** Solo per il laboratorio: blocca la scena a questo istante (secondi). */
  tempoFisso?: number;
}

const CASA_SX = 430;
const CASA_DX = 1170;
const TERRA = 760;

export function tempiScena(c: Copione) {
  switch (famiglia(c.archetipo)) {
    case "mischia":
      return { lancio: 0.45, impatto: 0.9, fine: 3.0 };
    case "distanza":
      return { lancio: 0.5, impatto: 1.1, fine: 3.0 };
    case "raggio":
      return { lancio: 0.5, impatto: 1.0, fine: 3.0 };
    case "area":
      return { lancio: 0.5, impatto: 1.2, fine: 3.2 };
    case "supporto":
      return { lancio: 0.35, impatto: 0.75, fine: 2.4 };
  }
}

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const liscio = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const gobba = (t: number, inizio: number, durata: number) => (t < inizio || t > inizio + durata ? 0 : Math.sin(((t - inizio) / durata) * Math.PI));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

function useTempo(tempoFisso?: number) {
  const [t, setT] = useState(tempoFisso ?? 0);
  useEffect(() => {
    if (tempoFisso !== undefined) {
      setT(tempoFisso);
      return;
    }
    const inizio = performance.now();
    let id = 0;
    const ciclo = () => {
      setT((performance.now() - inizio) / 1000);
      id = requestAnimationFrame(ciclo);
    };
    id = requestAnimationFrame(ciclo);
    return () => cancelAnimationFrame(id);
  }, [tempoFisso]);
  return t;
}

/** Linee di velocità/concentrazione tipiche dei manga, deterministiche. */
const LINEE = Array.from({ length: 40 }, (_, i) => {
  const a = (i / 40) * Math.PI * 2 + ((i * 7919) % 13) * 0.02;
  const r = 260 + ((i * 104729) % 120);
  return { a, r };
});

export default function ScenaCartoncini({ sinistra, destra, copione, onFine, immagineSfondo, tempoFisso }: Props) {
  const t = useTempo(tempoFisso);
  const finito = useRef(false);
  const tempi = tempiScena(copione);

  useEffect(() => {
    if (!finito.current && tempoFisso === undefined && t >= tempi.fine) {
      finito.current = true;
      onFine();
    }
  }, [t, tempi.fine, onFine, tempoFisso]);

  const fam = famiglia(copione.archetipo);
  const colore = COLORI_ELEMENTO[copione.elemento];
  const scala = 0.8 + copione.intensita * 0.3 + (copione.esito === "critico" ? 0.35 : 0);
  const colpito = copione.esito === "colpito" || copione.esito === "critico";
  const critico = copione.esito === "critico";
  const supporto = fam === "supporto";
  const attivo = copione.esito !== "senza_energia";
  const attoreSx = copione.attore === sinistra.id;
  const ax = attoreSx ? CASA_SX : CASA_DX;
  const bx = attoreSx ? CASA_DX : CASA_SX;
  const dir = Math.sign(bx - ax);
  const { lancio, impatto, fine } = tempi;
  const dopo = t - impatto;
  const k = clamp((t - lancio) / (impatto - lancio));

  // ── movimento dell'attore (il cartoncino scorre, non si anima) ──
  let dxA = 0, yA = 0, rA = 0;
  if (attivo && copione.esito !== "fallimento") {
    if (fam === "mischia") {
      const andata = liscio(lancio - 0.3, impatto - 0.04, t);
      const ritorno = liscio(1.6, 2.1, t);
      dxA = dir * (Math.abs(bx - ax) - 250) * andata * (1 - ritorno);
      rA = dir * 9 * andata * (1 - ritorno);
    } else if (supporto) {
      yA = -34 * gobba(t, lancio, 0.7);
    } else {
      yA = -24 * gobba(t, lancio - 0.3, 0.3);
      dxA = -dir * 30 * gobba(t, lancio, 0.35);
    }
  }
  if (copione.esito === "fallimento") {
    rA = -dir * 28 * liscio(lancio, lancio + 0.2, t);
    dxA = dir * 40 * liscio(lancio - 0.2, lancio + 0.2, t);
  }
  if (copione.ko) yA -= 50 * gobba(t, fine - 0.9, 0.45);

  // ── reazione del bersaglio ──
  let dxB = 0, yB = 0, rB = 0, opB = 1;
  if (colpito && dopo >= 0) {
    const spinta = liscio(impatto, impatto + 0.1, t) * (1 - liscio(impatto + 0.5, impatto + 0.9, t));
    dxB = dir * (critico ? 100 : 55) * spinta + Math.sin(t * 90) * 9 * Math.exp(-dopo * 6);
    rB = dir * 7 * spinta;
  }
  if (copione.esito === "mancato") {
    yB = -80 * gobba(t, impatto - 0.18, 0.5);
    dxB = dir * 50 * gobba(t, impatto - 0.18, 0.5);
  }
  if (copione.ko) {
    const caduta = liscio(impatto + 0.35, impatto + 0.85, t);
    rB = dir * 84 * caduta;
    opB = 1 - 0.25 * caduta;
  }

  // ── effetti ──
  const mano = { x: ax + dxA + dir * 140, y: TERRA - 300 + yA };
  const centroB = { x: bx + dxB, y: TERRA - 250 + yB };
  const fineTraiettoria = copione.esito === "mancato" ? { x: bx + dir * 260, y: TERRA - 470 } : centroB;
  const proiettile = {
    x: mix(mano.x, fineTraiettoria.x, k),
    y: mix(mano.y, fineTraiettoria.y, k) - Math.sin(k * Math.PI) * 90,
  };

  // ── camera: inquadrature del copione, con dissolvenza morbida tra una e l'altra ──
  const punto = (nome: Inquadratura) => {
    const mezzo = (ax + bx) / 2;
    switch (nome) {
      case "spalla_attore": return { cx: ax + dir * 140, cy: 500, z: 1.25 };
      case "primo_piano_attore": return { cx: ax + dxA, cy: 470, z: 1.5 };
      case "carica": return { cx: ax + dxA + dir * 160, cy: 500, z: 1.15 };
      case "segui_proiettile": return { cx: proiettile.x, cy: 490, z: 1.25 };
      case "laterale": return { cx: mezzo, cy: 470, z: 1.0 };
      case "impatto_bersaglio": return { cx: bx - dir * 60, cy: 500, z: 1.45 };
      case "aura": return { cx: ax, cy: 470, z: 1.35 };
      case "larga": return { cx: mezzo, cy: 450, z: 1.0 };
    }
  };
  const tagli = [0, lancio, impatto, impatto + 0.9];
  const indice = t < lancio ? 0 : t < impatto ? 1 : t < impatto + 0.9 ? 2 : 3;
  const shot = (i: number) => punto(copione.camera[Math.min(i, copione.camera.length - 1)]);
  const corrente = shot(indice);
  const precedente = shot(Math.max(0, indice - 1));
  const blend = indice === 0 ? 1 : liscio(tagli[indice], tagli[indice] + 0.35, t);
  let cx = mix(precedente.cx, corrente.cx, blend);
  let cy = mix(precedente.cy, corrente.cy, blend);
  const z = mix(precedente.z, corrente.z, blend) + (critico && dopo >= 0 && dopo < 0.3 ? 0.08 * (1 - dopo / 0.3) : 0);
  cx = clamp(cx, -100 + 800 / z, 1700 - 800 / z);
  cy = clamp(cy, -50 + 450 / z, 950 - 450 / z);
  if (colpito && dopo >= 0 && dopo < 0.35) {
    const f = (critico ? 16 : 7) * (1 - dopo / 0.35);
    cx += Math.sin(t * 97) * f;
    cy += Math.cos(t * 83) * f;
  }

  const flash = colpito && dopo >= 0 ? Math.exp(-dopo * 7) * (critico ? 0.75 : 0.4) : 0;
  const lineeVelocita = (fam === "mischia" && t > lancio - 0.3 && t < impatto) || (critico && dopo >= 0 && dopo < 0.6);
  const testoPopup =
    copione.esito === "critico" ? `−${copione.danno}`
    : copione.esito === "colpito" ? `−${copione.danno}`
    : copione.esito === "mancato" ? "MANCATO"
    : copione.esito === "fallimento" ? "OPS!"
    : copione.esito === "senza_energia" ? "SENZA ENERGIA"
    : copione.cura > 0 ? `+${copione.cura} PV`
    : copione.stati[0]?.replace("_", " ").toUpperCase() ?? "";
  const xPopup = supporto || !attivo || copione.esito === "fallimento" ? ax + dxA : bx + dxB;
  const popupVisibile = t >= impatto && t < fine;
  const popupScala = popupVisibile ? 1 + 0.4 * Math.exp(-dopo * 8) : 0;

  const gruppoSx = attoreSx ? { dx: dxA, y: yA, r: rA, op: 1 } : { dx: dxB, y: yB, r: rB, op: opB };
  const gruppoDx = attoreSx ? { dx: dxB, y: yB, r: rB, op: opB } : { dx: dxA, y: yA, r: rA, op: 1 };
  const koSx = sinistra.ko ? 84 * -1 : 0;
  const koDx = destra.ko ? 84 : 0;

  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block", background: "#000" }} role="img" aria-label={copione.didascalia}>
      <defs>
        <filter id="bagliore" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={`translate(800 450) scale(${z}) translate(${-cx} ${-cy})`}>
        <Sfondo arena={copione.arena} immagine={immagineSfondo} />

        {lineeVelocita && (
          <g stroke="#fff" strokeWidth={4} opacity={0.55}>
            {LINEE.map((l, i) => (
              <line key={i} x1={centroB.x + Math.cos(l.a) * l.r} y1={centroB.y + Math.sin(l.a) * l.r} x2={centroB.x + Math.cos(l.a) * 1400} y2={centroB.y + Math.sin(l.a) * 1400} />
            ))}
          </g>
        )}

        {/* trappola: anello a terra sotto il bersaglio */}
        {copione.archetipo === "trappola" && attivo && t >= lancio && dopo < 0.6 && (
          <ellipse cx={bx} cy={TERRA + 4} rx={(dopo < 0 ? 160 - k * 60 : 100 - dopo * 120) * scala} ry={(dopo < 0 ? 40 - k * 15 : 25 - dopo * 30) * scala} fill="none" stroke={colore} strokeWidth={10} filter="url(#bagliore)" />
        )}

        {/* aura di supporto dietro l'attore */}
        {supporto && copione.esito === "riuscito" && t >= lancio && (
          <g opacity={1 - liscio(fine - 0.6, fine - 0.1, t)}>
            <ellipse cx={ax + dxA} cy={TERRA - 230 + yA} rx={170 * liscio(lancio, impatto, t)} ry={280 * liscio(lancio, impatto, t)} fill={colore} opacity={0.3} filter="url(#bagliore)" />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const fase = ((t - lancio) * 0.8 + i / 6) % 1;
              return <polygon key={i} points="0,-14 8,0 0,14 -8,0" fill={colore} transform={`translate(${ax + dxA - 120 + i * 48} ${TERRA - 40 - fase * 480})`} opacity={1 - fase} />;
            })}
          </g>
        )}

        <g transform={`translate(${CASA_SX + gruppoSx.dx} ${TERRA + gruppoSx.y}) rotate(${gruppoSx.r + koSx})`} opacity={gruppoSx.op}>
          <Cartoncino essenza={sinistra.essenza} immagine={sinistra.immagine} />
        </g>
        <g transform={`translate(${CASA_DX + gruppoDx.dx} ${TERRA + gruppoDx.y}) rotate(${gruppoDx.r + koDx}) scale(-1 1)`} opacity={gruppoDx.op}>
          <Cartoncino essenza={destra.essenza} immagine={destra.immagine} />
        </g>

        {/* proiettile con scia */}
        {fam === "distanza" && attivo && copione.esito !== "fallimento" && t >= lancio && t < impatto + (copione.esito === "mancato" ? 0.3 : 0) && (
          <g filter="url(#bagliore)">
            {[0.18, 0.12, 0.06].map((ritardo, i) => {
              const kk = clamp((t - ritardo - lancio) / (impatto - lancio));
              return (
                <circle key={i} cx={mix(mano.x, fineTraiettoria.x, kk)} cy={mix(mano.y, fineTraiettoria.y, kk) - Math.sin(kk * Math.PI) * 90} r={(8 + i * 4) * scala} fill={colore} opacity={0.25 + i * 0.2} />
              );
            })}
            <circle cx={proiettile.x} cy={proiettile.y} r={22 * scala} fill={colore} stroke="#fff" strokeWidth={5} />
          </g>
        )}

        {/* raggio */}
        {fam === "raggio" && attivo && copione.esito !== "fallimento" && t >= lancio && dopo < 0.45 && (
          <g filter="url(#bagliore)">
            <line x1={mano.x} y1={mano.y} x2={mix(mano.x, fineTraiettoria.x, clamp(k * 1.2))} y2={mix(mano.y, fineTraiettoria.y, clamp(k * 1.2))} stroke={colore} strokeWidth={(34 + Math.sin(t * 60) * 6) * scala} strokeLinecap="round" />
            <line x1={mano.x} y1={mano.y} x2={mix(mano.x, fineTraiettoria.x, clamp(k * 1.2))} y2={mix(mano.y, fineTraiettoria.y, clamp(k * 1.2))} stroke="#fff" strokeWidth={10 * scala} strokeLinecap="round" />
          </g>
        )}

        {/* evocazione: qualcosa piomba dall'alto */}
        {copione.archetipo === "evocazione" && attivo && t >= lancio && dopo < 0.35 && (
          <polygon points="0,-90 70,0 0,90 -70,0" transform={`translate(${bx} ${mix(-100, centroB.y, k * k)}) scale(${scala}) rotate(${t * 200})`} fill={colore} stroke="#1b1622" strokeWidth={8} filter="url(#bagliore)" />
        )}

        {/* fendente: arco di taglio sul bersaglio */}
        {fam === "mischia" && attivo && copione.esito !== "fallimento" && dopo >= -0.05 && dopo < 0.3 && (
          <g transform={`translate(${centroB.x} ${centroB.y - 30}) scale(${dir * scala * (0.8 + dopo * 2)} ${scala * (0.8 + dopo * 2)})`} opacity={1 - clamp(dopo / 0.3)} filter="url(#bagliore)">
            <path d="M -150,-120 Q 40,-40 150,140" fill="none" stroke={colore} strokeWidth={26} strokeLinecap="round" />
            <path d="M -150,-120 Q 40,-40 150,140" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
            {copione.archetipo === "raffica" && <path d="M -150,120 Q 30,40 150,-140" fill="none" stroke={colore} strokeWidth={18} strokeLinecap="round" />}
          </g>
        )}

        {/* esplosione / scoppio d'impatto */}
        {colpito && dopo >= 0 && dopo < 0.5 && (
          <polygon
            points={Array.from({ length: 16 }, (_, i) => {
              const r = i % 2 ? 50 : 120;
              const a = (i / 16) * Math.PI * 2;
              return `${Math.cos(a) * r},${Math.sin(a) * r}`;
            }).join(" ")}
            transform={`translate(${centroB.x} ${centroB.y}) scale(${(fam === "area" ? 2.2 : 1.1) * scala * liscio(0, 0.25, dopo)}) rotate(${dopo * 90})`}
            fill={colore}
            stroke="#fff"
            strokeWidth={6}
            opacity={1 - clamp(dopo / 0.5)}
            filter="url(#bagliore)"
          />
        )}

        {/* numeri e scritte */}
        {popupVisibile && testoPopup && (
          <g transform={`translate(${xPopup} ${TERRA - 520 - clamp(dopo) * 40}) scale(${popupScala})`} opacity={1 - liscio(fine - 0.5, fine, t)}>
            <text textAnchor="middle" fontSize={critico ? 92 : 70} fontWeight={900} fontStyle="italic" fill={colpito ? (critico ? "#ffd24a" : "#ffffff") : copione.cura > 0 ? "#6cf0a4" : "#d9d4ea"} stroke="#1b1622" strokeWidth={12} paintOrder="stroke" style={{ fontFamily: "system-ui, sans-serif" }}>
              {testoPopup}
            </text>
          </g>
        )}
        {critico && dopo >= 0 && dopo < 1.4 && (
          <text x={(ax + bx) / 2} y={260} textAnchor="middle" fontSize={130} fontWeight={900} fontStyle="italic" fill="#ff3b3b" stroke="#fff" strokeWidth={14} paintOrder="stroke" transform={`rotate(-8 ${(ax + bx) / 2} 260)`} opacity={1 - liscio(1.0, 1.4, dopo)} style={{ fontFamily: "system-ui, sans-serif" }}>
            CRITICO!
          </text>
        )}
      </g>

      {/* lampo e bande cinematografiche fuori dalla camera */}
      <rect width={1600} height={900} fill="#fff" opacity={flash} pointerEvents="none" />
      <rect width={1600} height={64} fill="#000" />
      <rect y={836} width={1600} height={64} fill="#000" />
    </svg>
  );
}
