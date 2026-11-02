import type { Essenza } from "./essenza";
import { essenzaDemo } from "./demo";
import type { Giocatore } from "./giocatore";

const CHIAVE = "varco.personaggio";
const CHIAVE_GIOCATORE = "varco.giocatore";

export const DESCRIZIONE_ESEMPIO =
  "Mi chiamo Nadia Rook. Ero una soldatessa finché la guerra non ha bruciato tutto: ora ho un braccio meccanico arrugginito che brilla di azzurro, capelli rasati, un mantello rosso fatto di bandiere strappate e una spada ricavata da un cartello stradale. Cerco la squadra che mi ha lasciata indietro.";

/** Il giocatore vive nel browser finché non arriva Supabase (Fase 1). */
export function caricaGiocatore(): Giocatore | null {
  try {
    const salvato = localStorage.getItem(CHIAVE_GIOCATORE);
    if (salvato) return JSON.parse(salvato) as Giocatore;
  } catch {
    // localStorage non disponibile
  }
  return null;
}

/**
 * Salva il giocatore. Un'illustrazione PNG pesa intorno al mega: se lo spazio del browser non basta
 * si salva senza, e si torna `false` così la pagina può dirlo.
 */
export function salvaGiocatore(g: Giocatore): boolean {
  try {
    localStorage.setItem(CHIAVE_GIOCATORE, JSON.stringify(g));
    localStorage.setItem(CHIAVE, JSON.stringify(g.essenza));
    return true;
  } catch {
    try {
      localStorage.setItem(CHIAVE_GIOCATORE, JSON.stringify({ ...g, immagine: undefined }));
      localStorage.setItem(CHIAVE, JSON.stringify(g.essenza));
    } catch {
      // ignorato: il salvataggio è solo una comodità
    }
    return false;
  }
}

export function dimenticaGiocatore() {
  try {
    localStorage.removeItem(CHIAVE_GIOCATORE);
  } catch {
    // ignorato
  }
}

/** L'Essenza da usare in arena: quella del giocatore, oppure un eroe scelto in galleria, oppure l'esempio. */
export function caricaPersonaggio(): Essenza {
  const g = caricaGiocatore();
  if (g) return g.essenza;
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
