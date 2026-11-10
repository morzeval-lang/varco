import { NextResponse } from "next/server";
import { z } from "zod";
import { caricaStanza, esci, faiMossa, salta, scriviAzione, sollecitaGm } from "@/lib/stanza/servizio";
import { rispostaErrore, rispostaStanza } from "../rispondi";

export const maxDuration = 60;

/** Stato della stanza. Con ?v=N risponde `invariata` se la versione è ancora N (i browser chiedono spesso). */
export async function GET(req: Request, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  try {
    const s = await caricaStanza(codice);
    const v = new URL(req.url).searchParams.get("v");
    if (v !== null && Number(v) === s.versione) return NextResponse.json({ invariata: true, versione: s.versione });
    return rispostaStanza(s);
  } catch (e) {
    return rispostaErrore(e);
  }
}

const Chi = { id: z.string().min(1).max(40), segreto: z.string().min(1).max(80) };
const Richiesta = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("azione"), ...Chi, testo: z.string().trim().min(1).max(600) }),
  z.object({ tipo: z.literal("mossa"), ...Chi, testo: z.string().trim().min(1).max(500) }),
  z.object({ tipo: z.literal("sollecita"), ...Chi }),
  z.object({ tipo: z.literal("salta"), ...Chi, diChi: z.string().min(1).max(40) }),
  z.object({ tipo: z.literal("esci"), ...Chi }),
]);

/** Tutto quello che un giocatore fa nella stanza. */
export async function POST(req: Request, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  const parsed = Richiesta.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errore: "Richiesta non valida." }, { status: 400 });
  const r = parsed.data;
  try {
    switch (r.tipo) {
      case "azione":
        return rispostaStanza(await scriviAzione(codice, r.id, r.segreto, r.testo));
      case "mossa":
        return rispostaStanza(await faiMossa(codice, r.id, r.segreto, r.testo));
      case "sollecita":
        return rispostaStanza(await sollecitaGm(codice, r.id, r.segreto));
      case "salta":
        return rispostaStanza(await salta(codice, r.id, r.segreto, r.diChi));
      case "esci":
        return rispostaStanza(await esci(codice, r.id, r.segreto));
    }
  } catch (e) {
    return rispostaErrore(e);
  }
}
