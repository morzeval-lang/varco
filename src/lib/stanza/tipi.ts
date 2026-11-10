import type { IdUniverso } from "@/data/tipi";
import type { Essenza } from "@/lib/personaggio/essenza";
import type { Combattente, Copione, TiroRegistrato } from "@/lib/rules/types";

/**
 * Una stanza è una partita condivisa: un link, fino a 4 giocatori, un racconto comune.
 * Si alterna tra esplorazione (ognuno scrive cosa fa, poi il GM racconta) e combattimento
 * (a turno, ognuno scrive la sua mossa; dopo ogni giro tocca al nemico).
 */

export const MAX_GIOCATORI = 4;
/** Voci del racconto tenute in memoria: le più vecchie si perdono. */
export const MAX_VOCI = 200;

export interface GiocatoreStanza {
  /** Identificativo pubblico, visibile a tutti. */
  id: string;
  /** Chiave segreta che solo il browser del giocatore conosce: serve per agire a suo nome. */
  segreto: string;
  essenza: Essenza;
  /** Una riga di presentazione dal "Chi sei?", se c'è. */
  presentazione?: string;
  /** Il ritratto generato è salvato a parte (pesa troppo per viaggiare con la stanza). */
  haRitratto: boolean;
  entratoIl: string;
}

export type TipoVoce = "gm" | "giocatore" | "nemico" | "sistema";

export interface ScenaVoce {
  copione: Copione;
  /** Id del giocatore coinvolto: la scena lo mette sempre a sinistra, il nemico a destra. */
  eroe: string;
  /** Id del nemico nel catalogo (la scena può arrivare quando lo scontro è già chiuso). */
  nemico: string;
  diNemico: boolean;
}

export interface Voce {
  id: number;
  tipo: TipoVoce;
  /** Id del giocatore che ha scritto, per le voci di tipo "giocatore". */
  autore?: string;
  testo: string;
  tiri?: TiroRegistrato[];
  scena?: ScenaVoce;
  ora: string;
}

export interface Combattimento {
  nemicoId: string;
  nemico: Combattente;
  /** Combattenti degli eroi, per id del giocatore. */
  eroi: Record<string, Combattente>;
  /** Ordine di turno (id dei giocatori). */
  ordine: string[];
  /** Posizione in `ordine` di chi deve agire. */
  indice: number;
  /** Contatore delle mosse risolte, usato per il seme dei dadi. */
  turno: number;
  mosseNemico: number;
}

export interface Stanza {
  codice: string;
  universo: IdUniverso;
  creataIl: string;
  giocatori: GiocatoreStanza[];
  racconto: Voce[];
  prossimaVoce: number;
  fase: "esplorazione" | "combattimento";
  /** Esplorazione: l'azione scritta da ogni giocatore in questo giro. */
  azioni: Record<string, string>;
  /** Giri di racconto conclusi, e da quanti giri non si combatte. */
  giri: number;
  giriSenzaScontri: number;
  vittorie: number;
  combattimenti: number;
  combattimento: Combattimento | null;
  /** Quando qualcuno ha chiesto al GM di rispondere: impedisce due risposte in parallelo. */
  gmAlLavoroDal: string | null;
  /** Ogni salvataggio incrementa la versione: serve ai browser per sapere se c'è del nuovo. */
  versione: number;
}

/** Quello che vede il browser: la stanza senza i segreti dei giocatori. */
export type GiocatorePubblico = Omit<GiocatoreStanza, "segreto">;
export type StanzaPubblica = Omit<Stanza, "giocatori"> & { giocatori: GiocatorePubblico[] };

export function pubblica(s: Stanza): StanzaPubblica {
  return { ...s, giocatori: s.giocatori.map(({ segreto: _segreto, ...g }) => g) };
}
