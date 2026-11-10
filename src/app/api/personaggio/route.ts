import { NextResponse } from "next/server";
import { z } from "zod";
import { identitaDemo } from "@/lib/personaggio/giocatore";
import { claudeDisponibile, generaIdentitaConClaude } from "@/lib/gm/claude";

const Richiesta = z.object({ descrizione: z.string().min(3).max(2500) });

/** "Chi sei?": dalla risposta del giocatore nascono Essenza e background. */
export async function POST(req: Request) {
  const parsed = Richiesta.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errore: "Raccontati in una frase o due (fino a 2500 caratteri)." }, { status: 400 });
  }
  const { descrizione } = parsed.data;

  if (claudeDisponibile()) {
    try {
      return NextResponse.json({ ...(await generaIdentitaConClaude(descrizione)), fonte: "claude" });
    } catch (e) {
      console.error("Generazione con Claude fallita, uso la modalità demo:", e);
    }
  }
  return NextResponse.json({ ...identitaDemo(descrizione), fonte: "demo" });
}
