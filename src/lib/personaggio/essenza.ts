import { z } from "zod";

/**
 * L'Essenza è la parte del personaggio che non cambia mai tra un universo e l'altro.
 * Lo schema usa solo tipi semplici ed enum, così funziona anche come output strutturato
 * di Claude; i limiti numerici e i colori vengono sistemati da `normalizzaEssenza`.
 */
export const CORPORATURE = ["esile", "media", "robusta", "imponente"] as const;
export const CAPELLI = ["rasati", "corti", "lunghi", "cresta", "cappuccio", "elmo"] as const;
export const SEGNI = [
  "braccio_meccanico",
  "mantello",
  "corna",
  "ali",
  "occhio_luminoso",
  "cicatrice",
  "aura",
  "nessuno",
] as const;
export const ARMI = ["spada", "bastone", "arco", "pistola", "pugni", "scudo"] as const;

export const EssenzaSchema = z.object({
  nome: z.string().describe("Nome del personaggio, inventato se non indicato"),
  concetto: z.string().describe("Una frase che riassume il personaggio"),
  corporatura: z.enum(CORPORATURE),
  altezza: z.number().describe("Da 0.85 (bassa) a 1.15 (molto alta), 1 è la media"),
  pelle: z.string().describe("Colore della pelle in esadecimale, es. #c68642"),
  capelli: z.object({ stile: z.enum(CAPELLI), colore: z.string().describe("Esadecimale") }),
  palette: z.object({
    primario: z.string().describe("Colore principale dei vestiti, esadecimale"),
    secondario: z.string().describe("Colore secondario, esadecimale"),
    accento: z.string().describe("Colore luminoso per dettagli e magie, esadecimale"),
  }),
  segnoDistintivo: z.object({ tipo: z.enum(SEGNI), descrizione: z.string() }),
  arma: z.object({ tipo: z.enum(ARMI), descrizione: z.string() }),
  tratti: z.array(z.string()).describe("Da 1 a 3 tratti caratteriali brevi"),
  statistiche: z.object({
    forza: z.number(),
    agilita: z.number(),
    mente: z.number(),
    tempra: z.number(),
  }).describe("Valori da 6 a 16, la somma deve essere 48"),
});

export type Essenza = z.infer<typeof EssenzaSchema>;

export const SOMMA_STATISTICHE = 48;
export const MIN_STAT = 6;
export const MAX_STAT = 16;

const HEX = /^#[0-9a-f]{6}$/i;

function colore(valore: string, riserva: string): string {
  return HEX.test(valore) ? valore.toLowerCase() : riserva;
}

/** Porta le statistiche nei limiti (6..16) e alla somma fissa di 48. */
export function normalizzaStatistiche(s: Essenza["statistiche"]): Essenza["statistiche"] {
  const chiavi = ["forza", "agilita", "mente", "tempra"] as const;
  const clamp = (n: number) => Math.max(MIN_STAT, Math.min(MAX_STAT, Math.round(Number.isFinite(n) ? n : 12)));
  const valori = chiavi.map((k) => clamp(s[k]));
  let diff = SOMMA_STATISTICHE - valori.reduce((a, b) => a + b, 0);
  // Aggiusta un punto alla volta: toglie dalla più alta o aggiunge alla più bassa.
  while (diff !== 0) {
    const i = diff > 0 ? valori.indexOf(Math.min(...valori)) : valori.indexOf(Math.max(...valori));
    valori[i] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }
  return { forza: valori[0], agilita: valori[1], mente: valori[2], tempra: valori[3] };
}

export function normalizzaEssenza(e: Essenza): Essenza {
  return {
    ...e,
    nome: e.nome.trim().slice(0, 40) || "Viaggiatore",
    concetto: e.concetto.trim().slice(0, 160),
    altezza: Math.max(0.85, Math.min(1.15, Number.isFinite(e.altezza) ? e.altezza : 1)),
    pelle: colore(e.pelle, "#c68642"),
    capelli: { ...e.capelli, colore: colore(e.capelli.colore, "#2b2b2b") },
    palette: {
      primario: colore(e.palette.primario, "#3b5b92"),
      secondario: colore(e.palette.secondario, "#d9d4c7"),
      accento: colore(e.palette.accento, "#ffb347"),
    },
    tratti: e.tratti.map((t) => t.trim()).filter(Boolean).slice(0, 3),
    statistiche: normalizzaStatistiche(e.statistiche),
  };
}
