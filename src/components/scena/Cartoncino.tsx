import { useId } from "react";
import type { Essenza } from "@/lib/personaggio/essenza";
import { Figura } from "./Figura";

/**
 * Un personaggio come "cartoncino": figura immobile con il bordo bianco ritagliato e l'ombra,
 * come una sagoma di carta appoggiata sulla scena. Se c'è un'illustrazione (PNG con sfondo trasparente,
 * piedi in basso al centro, rivolta a destra) usa quella, altrimenti la figura SVG segnaposto.
 */
export function Cartoncino({ essenza, immagine, altezza = 480 }: { essenza: Essenza; immagine?: string; altezza?: number }) {
  const id = `carta-${useId().replace(/:/g, "")}`;
  return (
    <g filter={`url(#${id})`}>
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x={-360} y={-640} width={720} height={720}>
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
        <image href={immagine} x={-altezza * 0.5} y={-altezza} width={altezza} height={altezza} preserveAspectRatio="xMidYMax meet" />
      ) : (
        <Figura essenza={essenza} />
      )}
    </g>
  );
}
