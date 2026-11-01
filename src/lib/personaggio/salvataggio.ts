import type { Essenza } from "./essenza";
import { essenzaDemo } from "./demo";

const CHIAVE = "varco.personaggio";

export const DESCRIZIONE_ESEMPIO =
  "Una ex soldatessa con un braccio meccanico arrugginito che brilla di azzurro, capelli rasati, un mantello rosso fatto di bandiere strappate e una spada ricavata da un cartello stradale. Si chiama Nadia Rook.";

/** Il personaggio vive nel browser finché non arriva Supabase (Fase 1). */
export function caricaPersonaggio(): Essenza {
  try {
    const salvato = localStorage.getItem(CHIAVE);
    if (salvato) return JSON.parse(salvato) as Essenza;
  } catch {
    // localStorage non disponibile: si usa il personaggio di esempio
  }
  return essenzaDemo(DESCRIZIONE_ESEMPIO);
}

export function salvaPersonaggio(e: Essenza) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(e));
  } catch {
    // ignorato: il salvataggio è solo una comodità
  }
}
