import { z } from "zod";
import { UNIVERSI, type SchedaNemico } from "@/data";
import type { Narrazione } from "@/lib/stanza/logica";
import type { Stanza } from "@/lib/stanza/tipi";

/** Quello che il GM restituisce dopo un giro di esplorazione (output strutturato di Claude). */
export const NarrazioneSchema = z.object({
  racconto: z.string().describe("Il racconto del GM: da 3 a 6 frasi, in seconda persona plurale, che finisce con una domanda o una scelta"),
  nemico: z.string().nullable().describe("Id del nemico che entra in scena adesso, preso dall'elenco, oppure null"),
});

const PAROLE_SCONTRO = /\b(attacc|combatt|colpisc|sfid|provoc|caric|cerc\w* guai|tir\w* fuori l'arma|sguain|spar|lotta|picchi)/i;

const PASSI: Record<string, string[]> = {
  fantasy_medievale: [
    "Una campana suona lontano, tre colpi e poi silenzio.",
    "Tra le mura qualcuno ha acceso un fuoco: l'odore di resina e di carne bruciata arriva fin qui.",
    "Una pergamena strappata vola via col vento, con sopra un sigillo che nessuno di voi riconosce.",
    "Dal fango spuntano impronte enormi, fresche, dirette verso il bosco.",
  ],
  post_apocalisse: [
    "Un contatore Geiger, da qualche parte, comincia a ticchettare più in fretta.",
    "Sul cofano di un camion qualcuno ha scritto con la vernice: TORNATE INDIETRO.",
    "Una radio gracchia tra le lamiere, una voce ripete numeri senza senso.",
    "All'orizzonte si alza una colonna di polvere: qualcosa si muove, e si muove veloce.",
  ],
};

/** Ripiego senza Claude: ripete le azioni dei giocatori, aggiunge un dettaglio del mondo e ogni tanto fa entrare un nemico. */
export function narraDemo(s: Stanza, azioni: { nome: string; testo: string }[], candidati: SchedaNemico[]): Narrazione {
  const passi = PASSI[s.universo] ?? PASSI.post_apocalisse;
  const fatti = azioni.map((a) => `${a.nome}: "${a.testo.length > 120 ? `${a.testo.slice(0, 117)}...` : a.testo}"`).join(" ");
  const cercaGuai = azioni.some((a) => PAROLE_SCONTRO.test(a.testo));
  const scontro = candidati.length > 0 && (cercaGuai || s.giriSenzaScontri >= 2);
  if (scontro) {
    const nemico = candidati[(s.combattimenti + s.giri) % candidati.length];
    return {
      racconto: `${fatti} Il Varco ascolta, e risponde. ${passi[s.giri % passi.length]} Poi un rumore alle vostre spalle: non siete soli.`,
      nemico: nemico.id,
    };
  }
  return {
    racconto: `${fatti} ${passi[s.giri % passi.length]} ${UNIVERSI[s.universo].leggi[s.giri % UNIVERSI[s.universo].leggi.length]} Cosa fate?`,
    nemico: null,
  };
}

/** Il contesto che il GM legge: mondo, squadra, ultime righe del racconto e azioni di questo giro. */
export function contestoPerGm(s: Stanza, azioni: { nome: string; testo: string }[], candidati: SchedaNemico[]): string {
  const u = UNIVERSI[s.universo];
  const squadra = s.giocatori.map((g) => `- ${g.essenza.nome}: ${g.essenza.concetto}${g.presentazione ? `. ${g.presentazione}` : ""}`).join("\n");
  const recenti = s.racconto
    .slice(-12)
    .map((v) => `[${v.tipo}] ${v.testo}`)
    .join("\n");
  const nemici = candidati.map((n) => `- ${n.id} (${n.rango}): ${n.essenza.nome}, ${n.descrizione}`).join("\n");
  return `<mondo>
${u.nome} (${u.sottotitolo}). Tono: ${u.tono}
Leggi: ${u.leggi.join(" ")}
</mondo>
<squadra>
${squadra}
</squadra>
<racconto_recente>
${recenti}
</racconto_recente>
<nemici_disponibili>
${nemici}
</nemici_disponibili>
Giri senza scontri: ${s.giriSenzaScontri}. Vittorie della squadra: ${s.vittorie}.
<azioni_di_questo_giro>
${azioni.map((a) => `${a.nome}: ${a.testo}`).join("\n")}
</azioni_di_questo_giro>`;
}
