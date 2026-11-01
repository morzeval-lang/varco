import { NextResponse } from "next/server";
import { z } from "zod";
import { risolviMossa } from "@/lib/rules/combat";
import { semeDadi } from "@/lib/rules/seme";
import { ARCHETIPI, ELEMENTI, type Mossa } from "@/lib/rules/types";
import { interpretaMossaDemo } from "@/lib/gm/mossa";
import { claudeDisponibile, interpretaMossaConClaude } from "@/lib/gm/claude";
import { EROI } from "@/data";

const MOSSE_FIRMA = new Map(EROI.flatMap((e) => e.mosseFirma).map((m) => [m.frase.trim().toLowerCase(), m]));

const Stat = z.number().int().min(1).max(30);
const CombattenteSchema = z.object({
  id: z.string().max(60),
  nome: z.string().max(60),
  statistiche: z.object({ forza: Stat, agilita: Stat, mente: Stat, tempra: Stat }),
  pv: z.number().int().min(0).max(999),
  pvMax: z.number().int().min(1).max(999),
  energia: z.number().int().min(0).max(99),
  energiaMax: z.number().int().min(0).max(99),
  stati: z.array(z.enum(["in_fiamme", "congelato", "stordito", "avvelenato", "accecato", "scudo", "potenziato", "in_guardia"])),
});

const Richiesta = z.object({
  partita: z.string().min(1).max(80),
  turno: z.number().int().min(0),
  arena: z.string().max(60).default("postapo_autostrada"),
  attore: CombattenteSchema,
  bersaglio: CombattenteSchema,
  /** Testo libero del giocatore, interpretato dal GM. */
  testo: z.string().max(500).optional(),
  /** In alternativa al testo: mossa già strutturata (usata per i nemici). */
  mossa: z
    .object({
      archetipo: z.enum(ARCHETIPI),
      elemento: z.enum(ELEMENTI),
      intensita: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      nome: z.string().max(60).optional(),
    })
    .optional(),
});

/**
 * Prototipo di turno di combattimento. Nota: nella Fase 1 lo stato dei combattenti
 * verrà letto dal database e non dal client; qui arriva dal browser per semplicità.
 */
export async function POST(req: Request) {
  const parsed = Richiesta.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errore: parsed.error.message }, { status: 400 });
  const { partita, turno, arena, attore, bersaglio, testo, mossa: mossaStrutturata } = parsed.data;

  let mossa: Mossa;
  let fonte: "claude" | "demo" | "strutturata" | "firma" = "strutturata";
  const firma = testo ? MOSSE_FIRMA.get(testo.trim().toLowerCase()) : undefined;
  if (firma) {
    // Una mossa firma dell'eroe scritta così com'è: niente interpretazione, nome e forma sono già noti.
    const { nome, archetipo, elemento, intensita } = firma;
    mossa = { nome, archetipo, elemento, intensita, bonusNarrativo: 1 };
    fonte = "firma";
  } else if (mossaStrutturata) {
    mossa = { ...mossaStrutturata, bonusNarrativo: 0 };
  } else if (testo) {
    fonte = "demo";
    mossa = interpretaMossaDemo(testo);
    if (claudeDisponibile()) {
      try {
        mossa = await interpretaMossaConClaude(testo, `${attore.nome} affronta ${bersaglio.nome}.`);
        fonte = "claude";
      } catch (e) {
        console.error("Interpretazione con Claude fallita, uso la modalità demo:", e);
      }
    }
  } else {
    return NextResponse.json({ errore: "Serve un testo o una mossa." }, { status: 400 });
  }

  const risultato = risolviMossa({ attore, bersaglio, mossa, seme: semeDadi(partita, turno), arena });
  return NextResponse.json({ ...risultato, mossa, fonte });
}
