import type { Essenza } from "@/lib/personaggio/essenza";
import { Cartoncino } from "./Cartoncino";
import { Sfondo } from "./Sfondi";

/** La carta del personaggio: il suo cartoncino sullo sfondo del suo universo. */
export function CartaPersonaggio({ essenza, immagine, arena, immagineSfondo }: { essenza: Essenza; immagine?: string; arena: string; immagineSfondo?: string }) {
  return (
    <svg viewBox="490 150 620 785" style={{ width: "100%", height: "100%", display: "block" }} role="img" aria-label={essenza.nome}>
      <Sfondo arena={arena} immagine={immagineSfondo} />
      <g transform="translate(800 820) scale(1.12)">
        <Cartoncino essenza={essenza} immagine={immagine} />
      </g>
    </svg>
  );
}
