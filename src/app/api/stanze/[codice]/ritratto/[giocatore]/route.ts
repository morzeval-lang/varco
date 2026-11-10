import { archivio } from "@/lib/stanza/archivio";
import { normalizzaCodice } from "@/lib/stanza/servizio";

/** Il ritratto di un giocatore della stanza, come immagine vera (così il browser la tiene in cache). */
export async function GET(_req: Request, ctx: { params: Promise<{ codice: string; giocatore: string }> }) {
  const { codice, giocatore } = await ctx.params;
  const dataUrl = await archivio().leggiRitratto(normalizzaCodice(codice), giocatore).catch(() => null);
  const m = dataUrl?.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!m) return new Response("Ritratto non trovato", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=86400, immutable" },
  });
}
