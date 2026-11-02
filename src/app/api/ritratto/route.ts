import { NextResponse } from "next/server";
import { z } from "zod";
import { EssenzaSchema, normalizzaEssenza } from "@/lib/personaggio/essenza";
import { promptCartoncino } from "@/lib/grafica/prompt";
import { generaRitratto, generatoreDisponibile } from "@/lib/grafica/generatore";

const Richiesta = z.object({ essenza: EssenzaSchema, descrizione: z.string().max(2500).optional() });

/**
 * L'illustrazione del personaggio, creata una volta sola quando il giocatore conferma chi è.
 * Senza generatore configurato risponde `immagine: null` e il gioco usa la figura SVG.
 */
export async function POST(req: Request) {
  const parsed = Richiesta.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errore: "Personaggio non valido." }, { status: 400 });
  if (!generatoreDisponibile()) return NextResponse.json({ immagine: null, fonte: "svg" });

  const essenza = normalizzaEssenza(parsed.data.essenza);
  try {
    const immagine = await generaRitratto(promptCartoncino(essenza, parsed.data.descrizione));
    return NextResponse.json({ immagine, fonte: "generatore" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ immagine: null, fonte: "svg", errore: "Il ritratto non è venuto: per ora resta la figura disegnata." });
  }
}
