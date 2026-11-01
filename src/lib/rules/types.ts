/** Tipi del motore regole. Nessuna dipendenza da React, rete o AI. */

export const ARCHETIPI = [
  "fendente",
  "affondo",
  "raffica",
  "proiettile",
  "raggio",
  "area_esplosiva",
  "trappola",
  "evocazione",
  "scudo",
  "cura",
  "potenziamento",
  "schivata",
] as const;
export type Archetipo = (typeof ARCHETIPI)[number];

export const ELEMENTI = [
  "fuoco",
  "gelo",
  "fulmine",
  "tossico",
  "luce",
  "ombra",
  "cinetico",
  "plasma",
] as const;
export type Elemento = (typeof ELEMENTI)[number];

export type Intensita = 1 | 2 | 3;

export type Statistica = "forza" | "agilita" | "mente" | "tempra";

export interface Statistiche {
  forza: number;
  agilita: number;
  mente: number;
  tempra: number;
}

export type Stato =
  | "in_fiamme"
  | "congelato"
  | "stordito"
  | "avvelenato"
  | "accecato"
  | "scudo"
  | "potenziato"
  | "in_guardia";

export interface Combattente {
  id: string;
  nome: string;
  statistiche: Statistiche;
  pv: number;
  pvMax: number;
  energia: number;
  energiaMax: number;
  stati: Stato[];
}

export interface Mossa {
  archetipo: Archetipo;
  elemento: Elemento;
  intensita: Intensita;
  /** Bonus proposto dal GM per una descrizione creativa. Il motore lo limita a 0..2. */
  bonusNarrativo?: number;
  /** Nome della mossa come l'ha scritta il giocatore, solo per la didascalia. */
  nome?: string;
}

export type Esito = "fallimento" | "mancato" | "colpito" | "critico" | "riuscito" | "senza_energia";

export interface TiroRegistrato {
  formula: string;
  risultati: number[];
  totale: number;
  scopo: string;
}

export type Inquadratura =
  | "spalla_attore"
  | "primo_piano_attore"
  | "carica"
  | "segui_proiettile"
  | "laterale"
  | "impatto_bersaglio"
  | "aura"
  | "larga";

/** Il copione che il client riproduce come scena 3D. */
export interface Copione {
  arena: string;
  attore: string;
  bersaglio: string;
  archetipo: Archetipo;
  elemento: Elemento;
  intensita: Intensita;
  esito: Esito;
  danno: number;
  cura: number;
  stati: Stato[];
  ko: boolean;
  camera: Inquadratura[];
  didascalia: string;
  seme: number;
  tiri: TiroRegistrato[];
}
