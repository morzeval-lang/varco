import type { Essenza } from "@/lib/personaggio/essenza";
import type { Mossa } from "@/lib/rules/types";

/**
 * Il catalogo dei contenuti di gioco: universi, eroi pronti e nemici.
 * Sono dati, non codice: per aggiungere un eroe o un nemico basta aggiungere una voce.
 * Tutto è originale: ci si ispira ai generi e agli stereotipi, mai a personaggi esistenti.
 */

export type IdUniverso = "fantasy_medievale" | "post_apocalisse";

export interface SchedaArena {
  id: string;
  nome: string;
  /** Prima riga di narrazione quando inizia un combattimento qui. */
  descrizione: string;
  /** Illustrazione definitiva (1800×1000) in public/, se c'è. Altrimenti si usa lo sfondo SVG segnaposto. */
  immagine?: string;
}

export interface SchedaUniverso {
  id: IdUniverso;
  nome: string;
  sottotitolo: string;
  tono: string;
  /** Le leggi del mondo, che il GM deve rispettare e il motore applicherà (Fase 2). */
  leggi: string[];
  risorsa: string;
  arene: SchedaArena[];
}

/** Una mossa caratteristica: la frase è il suggerimento che il giocatore può usare in arena. */
export interface MossaFirma extends Mossa {
  nome: string;
  frase: string;
}

export interface SchedaEroe {
  id: string;
  universo: IdUniverso;
  /** Classe o stereotipo di riferimento, es. "Paladino". */
  classe: string;
  descrizione: string;
  essenza: Essenza;
  /** Cartoncino definitivo (PNG trasparente) in public/, se c'è. */
  immagine?: string;
  mosseFirma: MossaFirma[];
}

export type Rango = "gregario" | "campione" | "boss";

export interface SchedaNemico {
  id: string;
  universo: IdUniverso;
  rango: Rango;
  descrizione: string;
  essenza: Essenza;
  /** Cartoncino definitivo (PNG trasparente) in public/, se c'è. */
  immagine?: string;
  /** PV in più rispetto alla formula base (20 + Tempra). */
  pvBonus: number;
  mosse: (Mossa & { nome: string })[];
  /** Battuta con cui entra in scena. */
  ingresso: string;
}
