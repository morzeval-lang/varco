import { NextResponse } from "next/server";
import { z } from "zod";
import { EssenzaSchema, normalizzaEssenza } from "@/lib/personaggio/essenza";
import { entra } from "@/lib/stanza/servizio";
import { rispostaErrore, rispostaStanza } from "../../rispondi";

const Richiesta = z.object({
  essenza: EssenzaSchema,
  presentazione: z.string().max(400).optional(),
  /** Ritratto generato in "Chi sei?" (data URL PNG), al massimo ~3 MB. */
  immagine: z.string().startsWith("data:image/").max(4_000_000).optional(),
});

/** Entra nella stanza con il proprio personaggio. Restituisce id e segreto da tenere nel browser. */
export async function POST(req: Request, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  const parsed = Richiesta.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errore: "Personaggio non valido." }, { status: 400 });
  try {
    const { stanza, id, segreto } = await entra(codice, { ...parsed.data, essenza: normalizzaEssenza(parsed.data.essenza) });
    return rispostaStanza(stanza, { io: { id, segreto } });
  } catch (e) {
    return rispostaErrore(e);
  }
}
