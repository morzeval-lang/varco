import "server-only";
import { EROI } from "@/data";
import type { Mossa } from "@/lib/rules/types";
import { claudeDisponibile, interpretaMossaConClaude } from "./claude";
import { interpretaMossaDemo } from "./mossa";

const MOSSE_FIRMA = new Map(EROI.flatMap((e) => e.mosseFirma).map((m) => [m.frase.trim().toLowerCase(), m]));

export type FonteMossa = "claude" | "demo" | "firma";

/** Dal testo del giocatore a una mossa: prima le mosse firma, poi Claude, e se manca o fallisce le parole chiave. */
export async function interpretaMossa(testo: string, contesto: string): Promise<{ mossa: Mossa; fonte: FonteMossa }> {
  const firma = MOSSE_FIRMA.get(testo.trim().toLowerCase());
  if (firma) {
    // Una mossa firma dell'eroe scritta così com'è: niente interpretazione, nome e forma sono già noti.
    const { nome, archetipo, elemento, intensita } = firma;
    return { mossa: { nome, archetipo, elemento, intensita, bonusNarrativo: 1 }, fonte: "firma" };
  }
  if (claudeDisponibile()) {
    try {
      return { mossa: await interpretaMossaConClaude(testo, contesto), fonte: "claude" };
    } catch (e) {
      console.error("Interpretazione con Claude fallita, uso la modalità demo:", e);
    }
  }
  return { mossa: interpretaMossaDemo(testo), fonte: "demo" };
}
