import { NextResponse } from "next/server";
import { ErroreStanza } from "@/lib/stanza/logica";
import { pubblica, type Stanza } from "@/lib/stanza/tipi";
import { archivioAffidabile } from "@/lib/stanza/archivio";
import { claudeDisponibile } from "@/lib/gm/claude";

export function rispostaStanza(s: Stanza, extra: Record<string, unknown> = {}) {
  return NextResponse.json({
    stanza: pubblica(s),
    ambiente: { gm: claudeDisponibile() ? "claude" : "demo", archivioAffidabile: archivioAffidabile() },
    ...extra,
  });
}

export function rispostaErrore(e: unknown) {
  if (e instanceof ErroreStanza) return NextResponse.json({ errore: e.message }, { status: 409 });
  console.error(e);
  return NextResponse.json({ errore: "Qualcosa si è inceppato nel Varco. Riprova tra poco." }, { status: 500 });
}
