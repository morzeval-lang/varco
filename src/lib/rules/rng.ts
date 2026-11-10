import type { TiroRegistrato } from "./types";

/** PRNG mulberry32: piccolo, veloce, deterministico dato il seme. */
export function mulberry32(seme: number): () => number {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dadi con registro: ogni tiro viene salvato per poterlo ricontrollare. */
export class Dadi {
  readonly registro: TiroRegistrato[] = [];
  private readonly prossimo: () => number;

  constructor(readonly seme: number) {
    this.prossimo = mulberry32(seme);
  }

  /** Tira `quanti` dadi da `facce` e registra il risultato. */
  tira(quanti: number, facce: number, scopo: string): TiroRegistrato {
    const risultati = Array.from({ length: quanti }, () => 1 + Math.floor(this.prossimo() * facce));
    const tiro: TiroRegistrato = {
      formula: `${quanti}d${facce}`,
      risultati,
      totale: risultati.reduce((s, r) => s + r, 0),
      scopo,
    };
    this.registro.push(tiro);
    return tiro;
  }
}
