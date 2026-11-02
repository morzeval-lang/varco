import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { EssenzaSchema, normalizzaEssenza, type Essenza } from "@/lib/personaggio/essenza";
import { IdentitaSchema, type Identita } from "@/lib/personaggio/giocatore";
import { MossaInterpretataSchema, normalizzaMossa } from "./mossa";
import type { Mossa } from "@/lib/rules/types";

const MODELLO = process.env.VARCO_CLAUDE_MODEL || "claude-opus-5-5";

export function claudeDisponibile(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

const SYSTEM_GM = `Sei il Game Master di VARCO, un gioco di ruolo testuale ambientato in un multiverso.
Il tuo compito qui è solo tradurre il testo del giocatore in dati strutturati: non decidi mai l'esito delle azioni,
che viene calcolato dal codice con i dadi. Rispondi in italiano. Non usare personaggi o marchi di opere esistenti:
se il giocatore ne cita uno, crea una versione originale ispirata solo all'idea generale.`;

async function chiediStrutturato<S extends z.ZodType>(schema: S, istruzioni: string, testo: string): Promise<z.infer<S>> {
  const risposta = await getClient().messages.parse({
    model: MODELLO,
    max_tokens: 4000,
    system: SYSTEM_GM,
    output_config: { effort: "low", format: zodOutputFormat(schema) },
    messages: [{ role: "user", content: `${istruzioni}\n\n<testo_giocatore>\n${testo}\n</testo_giocatore>` }],
  });
  if (risposta.stop_reason === "refusal") throw new Error("Claude ha rifiutato la richiesta");
  if (!risposta.parsed_output) throw new Error("Risposta di Claude non valida");
  return risposta.parsed_output;
}

export async function generaEssenzaConClaude(descrizione: string): Promise<Essenza> {
  const grezza = await chiediStrutturato(
    EssenzaSchema,
    `Crea l'Essenza del personaggio descritto qui sotto. Mantieni ogni dettaglio visivo che il giocatore ha dato,
inventa con gusto quello che manca, scegli colori esadecimali coerenti, e distribuisci 48 punti tra le quattro statistiche
(ognuna da 6 a 16) in modo coerente con la descrizione.`,
    descrizione,
  );
  return normalizzaEssenza(grezza);
}

/** Risposta a "Chi sei?": aspetto, statistiche e un background breve, tutto dalle parole del giocatore. */
export async function generaIdentitaConClaude(descrizione: string): Promise<Identita> {
  const grezza = await chiediStrutturato(
    IdentitaSchema,
    `Il giocatore ha risposto alla domanda "Chi sei?". Crea il suo personaggio.
Nell'Essenza mantieni ogni dettaglio visivo che ha dato, inventa con gusto quello che manca, scegli colori esadecimali
coerenti con un anime d'azione serio, e distribuisci 48 punti tra le quattro statistiche (ognuna da 6 a 16) in base
a chi è e a come combatte. Poi riassumi origine, storia e motivazione restando fedele a quello che ha scritto:
completa i vuoti senza contraddirlo. Tono serio ed epico, con un filo d'ironia se il giocatore ne usa.`,
    descrizione,
  );
  return { ...grezza, essenza: normalizzaEssenza(grezza.essenza) };
}

export async function interpretaMossaConClaude(testo: string, contesto: string): Promise<Mossa> {
  const grezza = await chiediStrutturato(
    MossaInterpretataSchema,
    `Siamo in combattimento. ${contesto}
Traduci la mossa del giocatore in uno degli archetipi e degli elementi disponibili. Intensità 3 solo per mosse
dichiaratamente speciali. Il bonus narrativo (0-2) premia descrizioni creative che sfruttano la scena.`,
    testo,
  );
  return normalizzaMossa(grezza);
}
