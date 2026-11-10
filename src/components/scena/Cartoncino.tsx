import { useId } from "react";
import type { Essenza } from "@/lib/personaggio/essenza";
import { Figura } from "./Figura";

/**
 * Un personaggio come "cartoncino": figura immobile con il bordo bianco ritagliato e l'ombra,
 * come una sagoma di carta appoggiata sulla scena. Se c'è un'illustrazione (PNG o SVG quadrato con sfondo
 * trasparente, piedi in basso al centro, rivolta a destra) usa quella, altrimenti la figura SVG segnaposto.
 */
/** Lato del riquadro quadrato delle illustrazioni: i piedi stanno in basso al centro, 1 unità = 1 unità di scena. */
const LATO = 600;

export function Cartoncino({ essenza, immagine, lato = LATO }: { essenza: Essenza; immagine?: string; lato?: number }) {
  const id = `carta-${useId().replace(/:/g, "")}`;
  return (
    <g filter={`url(#${id})`}>
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x={-420} y={-700} width={840} height={790}>
          <feMorphology in="SourceAlpha" operator="dilate" radius={7} result="espanso" />
          <feFlood floodColor="#fffaf0" result="carta" />
          <feComposite in="carta" in2="espanso" operator="in" result="bordo" />
          <feGaussianBlur in="espanso" stdDeviation={7} result="sfumata" />
          <feOffset in="sfumata" dx={10} dy={12} result="spostata" />
          <feFlood floodColor="#000" floodOpacity={0.38} />
          <feComposite in2="spostata" operator="in" result="ombra" />
          <feMerge>
            <feMergeNode in="ombra" />
            <feMergeNode in="bordo" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {immagine ? (
        <image href={immagine} x={-lato * 0.5} y={-lato} width={lato} height={lato} preserveAspectRatio="xMidYMax meet" />
      ) : (
        <Figura essenza={essenza} />
      )}
    </g>
  );
}
