import { NextResponse } from "next/server";
import { z } from "zod";
import { UNIVERSI, type IdUniverso } from "@/data";
import { creaStanza } from "@/lib/stanza/servizio";
import { rispostaErrore, rispostaStanza } from "./rispondi";

const Richiesta = z.object({ universo: z.enum(Object.keys(UNIVERSI) as [IdUniverso, ...IdUniverso[]]) });

/** Crea una stanza nuova e restituisce il suo codice: il link è /stanza/CODICE. */
export async function POST(req: Request) {
  const parsed = Richiesta.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errore: "Universo non valido." }, { status: 400 });
  try {
    return rispostaStanza(await creaStanza(parsed.data.universo));
  } catch (e) {
    return rispostaErrore(e);
  }
}
