import { z } from "zod";
import { ARCHETIPI, ELEMENTI, type Mossa } from "@/lib/rules/types";

/** Come Claude (o il ripiego a parole chiave) traduce una frase in una mossa strutturata. */
export const MossaInterpretataSchema = z.object({
  nome: z.string().describe("Nome breve ed evocativo della mossa, in italiano"),
  archetipo: z.enum(ARCHETIPI),
  elemento: z.enum(ELEMENTI),
  intensita: z.number().describe("1 leggera, 2 forte, 3 mossa speciale"),
  bonusNarrativo: z.number().describe("0, 1 o 2: premia descrizioni creative e coerenti con la scena"),
});
export type MossaInterpretata = z.infer<typeof MossaInterpretataSchema>;

export function normalizzaMossa(m: MossaInterpretata): Mossa {
  const intensita = Math.max(1, Math.min(3, Math.round(m.intensita))) as 1 | 2 | 3;
  return {
    nome: m.nome.trim().slice(0, 60),
    archetipo: m.archetipo,
    elemento: m.elemento,
    intensita,
    bonusNarrativo: Math.max(0, Math.min(2, Math.round(m.bonusNarrativo))),
  };
}

const REGOLE_ARCHETIPO: [RegExp, Mossa["archetipo"]][] = [
  [/cur[ao]|guarisc|rigener|benda/, "cura"],
  [/scud|barrier|protegg|ripar/, "scudo"],
  [/schiv|evit|salto indietro|rotol/, "schivata"],
  [/potenz|concentr|caric[oa] (l'|la )?energia|urlo di guerra|grido/, "potenziamento"],
  [/raggio|laser|fascio/, "raggio"],
  [/esplo|bomba|granata|onda d'urto|deflagr/, "area_esplosiva"],
  [/trappol|mina|rete/, "trappola"],
  [/evoc|chiamo|richiam|invoc/, "evocazione"],
  [/raffica|serie di colpi|tempesta di|pugni rapidi|combo/, "raffica"],
  [/affond|trafigg|pugnal|stocc/, "affondo"],
  [/lanci|sparo|spar[ao]|scocc|tir[oa]|frecc|palla|proiettil|bottiglia/, "proiettile"],
  [/fend|tagli|spad|colpisc|ascia|mazz|pugno|calcio/, "fendente"],
];

const REGOLE_ELEMENTO: [RegExp, Mossa["elemento"]][] = [
  [/fuoco|fiamm|incendi|brucia|lava/, "fuoco"],
  [/ghiacc|gelo|neve|congel/, "gelo"],
  [/fulmin|elettric|tuono|saett/, "fulmine"],
  [/veleno|tossic|acido|radioatt/, "tossico"],
  [/luce|sacr|sole|divin/, "luce"],
  [/ombra|oscur|buio|necro/, "ombra"],
  [/plasma|laser|energia/, "plasma"],
];

const NOMI_ARCHETIPO: Record<Mossa["archetipo"], string> = {
  fendente: "Fendente",
  affondo: "Affondo",
  raffica: "Raffica",
  proiettile: "Lancio",
  raggio: "Raggio",
  area_esplosiva: "Esplosione",
  trappola: "Trappola",
  evocazione: "Evocazione",
  scudo: "Scudo",
  cura: "Cura",
  potenziamento: "Concentrazione",
  schivata: "Schivata",
};

/** Interpretazione a parole chiave, usata in modalità demo o se Claude non risponde. */
export function interpretaMossaDemo(testo: string): Mossa {
  const t = testo.toLowerCase();
  const archetipo = REGOLE_ARCHETIPO.find(([r]) => r.test(t))?.[1] ?? "fendente";
  const elemento = REGOLE_ELEMENTO.find(([r]) => r.test(t))?.[1] ?? "cinetico";
  const intensita: 1 | 2 | 3 = /speciale|suprem|final|devastant|con tutt/.test(t) ? 3 : /fort|potent|caric/.test(t) ? 2 : 1;
  const bonusNarrativo = t.split(/\s+/).length > 14 ? 1 : 0;
  const nome = elemento === "cinetico" ? NOMI_ARCHETIPO[archetipo] : `${NOMI_ARCHETIPO[archetipo]} di ${elemento}`;
  return { nome, archetipo, elemento, intensita, bonusNarrativo };
}
