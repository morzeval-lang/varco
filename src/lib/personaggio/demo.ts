import { normalizzaEssenza, type Essenza } from "./essenza";

/**
 * Generatore di Essenza senza AI, a parole chiave. Serve per giocare in locale senza
 * chiavi API e come ripiego se Claude non risponde. Deterministico: stesso testo, stesso personaggio.
 */

const COLORI: [RegExp, string][] = [
  [/\bross[oaie]\b|scarlatt|cremisi/, "#b3261e"],
  [/blu|azzurr|cobalto/, "#2f5fa7"],
  [/verd[eia]|smeraldo/, "#2e7d4f"],
  [/ner[oaie]|corvino|oscur/, "#1f1f24"],
  [/bianc[oaie]|argent|candid/, "#e6e6ea"],
  [/oro|dorat|giall/, "#d4a017"],
  [/viol|porpor|lilla/, "#6a3fa0"],
  [/arancion|rame|ruggin/, "#b5562b"],
  [/marron|cuoio|terra/, "#6b4423"],
  [/grig|acciaio|cenere/, "#7d8288"],
  [/ros[aie]\b|rosa /, "#d77fa1"],
];

const CAPELLI_COLORI: [RegExp, string][] = [
  [/capelli (ross|rame)/, "#a5402d"],
  [/capelli (bianch|argent|grig)/, "#d8d8d8"],
  [/capelli (biond|dorat)/, "#d9b45a"],
  [/capelli (blu|azzurr)/, "#3a6fd8"],
  [/capelli (verd)/, "#3f9e5a"],
  [/capelli (viol|rosa)/, "#b05ac8"],
];

function hash(testo: string): number {
  let h = 2166136261;
  for (let i = 0; i < testo.length; i++) {
    h ^= testo.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const NOMI = ["Kaelen", "Mira", "Dario Vex", "Sela", "Orin", "Nadia Rook", "Tavi", "Ysolde", "Bruno Ferro", "Lyra"];
const RISERVA_PALETTE = ["#3b5b92", "#7a2e2e", "#2e5e4e", "#5b3b82", "#8a6a2e", "#2e4a6a"];
const PELLI = ["#f1c7a5", "#d9a47a", "#c68642", "#8d5524", "#5c3a21"];

export function essenzaDemo(descrizione: string): Essenza {
  const t = descrizione.toLowerCase();
  const h = hash(t);
  const trova = <T,>(regole: [RegExp, T][]) => regole.filter(([r]) => r.test(t)).map(([, v]) => v);

  const colori = trova(COLORI);
  const primario = colori[0] ?? RISERVA_PALETTE[h % RISERVA_PALETTE.length];
  const secondario = colori[1] ?? "#d9d4c7";

  const segno: Essenza["segnoDistintivo"]["tipo"] =
    /braccio (meccanico|robot|bionico|di metallo)|cyborg|protesi/.test(t) ? "braccio_meccanico"
    : /mantell|cappa/.test(t) ? "mantello"
    : /corn[ai]/.test(t) ? "corna"
    : /\bali\b|alato|piume/.test(t) ? "ali"
    : /occhi? (luminos|brillant|che brilla)|occhio (cibernetico|magico)/.test(t) ? "occhio_luminoso"
    : /cicatric/.test(t) ? "cicatrice"
    : /aura|alone|energia che/.test(t) ? "aura"
    : "nessuno";

  const arma: Essenza["arma"]["tipo"] =
    /spad|lama|katana|ascia|coltell|pugnal/.test(t) ? "spada"
    : /bastone|mago|maga|strega|incantes|magi[ac]/.test(t) ? "bastone"
    : /arco|frecc/.test(t) ? "arco"
    : /pistol|fucil|blaster|revolver|laser/.test(t) ? "pistola"
    : /scudo/.test(t) ? "scudo"
    : "pugni";

  const corporatura: Essenza["corporatura"] =
    /gigant|enorme|colosso|imponent/.test(t) ? "imponente"
    : /robust|muscolos|massicc|tarchiat/.test(t) ? "robusta"
    : /esile|magr|minut|sottile|agile/.test(t) ? "esile"
    : "media";

  const altezza = /altissim|gigant/.test(t) ? 1.15 : /\balt[oa]\b/.test(t) ? 1.08 : /bass[oa]|minut|piccol/.test(t) ? 0.88 : 1;

  const stile: Essenza["capelli"]["stile"] =
    /rasat|calv|pelat/.test(t) ? "rasati"
    : /cresta|mohawk/.test(t) ? "cresta"
    : /cappuccio/.test(t) ? "cappuccio"
    : /elmo|casco/.test(t) ? "elmo"
    : /capelli lungh|chioma/.test(t) ? "lunghi"
    : "corti";

  const base = { forza: 12, agilita: 12, mente: 12, tempra: 12 };
  if (arma === "spada" || arma === "pugni") base.forza += 3;
  if (arma === "arco" || arma === "pistola") base.agilita += 3;
  if (arma === "bastone") base.mente += 3;
  if (arma === "scudo" || corporatura === "imponente" || corporatura === "robusta") base.tempra += 3;
  if (corporatura === "esile") base.agilita += 2;

  const nomeEsplicito = descrizione.match(/(?:[Ss]i chiama|[Cc]hiamat[oa]|[Nn]ome[:\s]+)\s*([A-ZÀ-Ý][\wà-ÿ'-]+(?:\s[A-ZÀ-Ý][\wà-ÿ'-]+)?)/);

  return normalizzaEssenza({
    nome: nomeEsplicito?.[1] ?? NOMI[h % NOMI.length],
    concetto: descrizione.trim().split(/[.!?]/)[0].slice(0, 160) || "Un viaggiatore tra i varchi",
    corporatura,
    altezza,
    pelle: PELLI[(h >>> 3) % PELLI.length],
    capelli: { stile, colore: trova(CAPELLI_COLORI)[0] ?? "#2b2420" },
    palette: { primario, secondario, accento: segno === "braccio_meccanico" ? "#4fd1ff" : "#ffb347" },
    segnoDistintivo: { tipo: segno, descrizione: segno === "nessuno" ? "" : segno.replace("_", " ") },
    arma: { tipo: arma, descrizione: arma },
    tratti: ["determinato"],
    statistiche: base,
  });
}
