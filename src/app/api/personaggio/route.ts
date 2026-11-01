import { NextResponse } from "next/server";
import { z } from "zod";
import { essenzaDemo } from "@/lib/personaggio/demo";
import { claudeDisponibile, generaEssenzaConClaude } from "@/lib/gm/claude";

const Richiesta = z.object({ descrizione: z.string().min(3).max(1500) });

export async function POST(req: Request) {
  const parsed = Richiesta.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errore: "Scrivi una descrizione tra 3 e 1500 caratteri." }, { status: 400 });
  }
  const { descrizione } = parsed.data;

  if (claudeDisponibile()) {
    try {
      return NextResponse.json({ essenza: await generaEssenzaConClaude(descrizione), fonte: "claude" });
    } catch (e) {
      console.error("Generazione con Claude fallita, uso la modalità demo:", e);
    }
  }
  return NextResponse.json({ essenza: essenzaDemo(descrizione), fonte: "demo" });
}
