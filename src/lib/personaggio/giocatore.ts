import { z } from "zod";
import type { IdUniverso } from "@/data/tipi";
import { EssenzaSchema, type Essenza } from "./essenza";
import { essenzaDemo } from "./demo";

/**
 * Il personaggio del giocatore: nasce una volta sola dalla risposta a "Chi sei?" e da quel momento
 * è lo stesso in ogni scena (stessa Essenza, stessa illustrazione).
 */

/** Quello che Claude restituisce leggendo la risposta del giocatore. */
export const IdentitaSchema = z.object({
  essenza: EssenzaSchema,
  origine: z.string().describe("Da dove viene, in una frase breve"),
  storia: z.string().describe("Il suo passato in due o tre frasi, in seconda persona"),
  motivazione: z.string().describe("Cosa lo spinge ad attraversare il Varco, in una frase"),
});
export type Identita = z.infer<typeof IdentitaSchema>;

export type Giocatore = Identita & {
  essenza: Essenza;
  /** La risposta originale del giocatore, tenuta per rigenerare l'illustrazione con gli stessi dettagli. */
  descrizione: string;
  universo: IdUniverso;
  /** Illustrazione generata (data URL PNG con sfondo trasparente). Senza, si usa la figura SVG. */
  immagine?: string;
  creatoIl: string;
};

/** Ripiego senza Claude: l'Essenza dalle parole chiave e la storia presa dalle parole del giocatore. */
export function identitaDemo(descrizione: string): Identita {
  const pulita = descrizione.replace(/\s+/g, " ").trim();
  const frasi = pulita.split(/(?<=[.!?])\s+/);
  const storia = frasi.slice(0, 3).join(" ");
  return {
    essenza: essenzaDemo(descrizione),
    origine: "Il Varco non ricorda da dove vieni, ma tu sì.",
    storia: storia.length > 360 ? `${storia.slice(0, 357)}...` : storia,
    motivazione: "Scoprire cosa c'è dall'altra parte del Varco, e tornare indietro intero.",
  };
}
