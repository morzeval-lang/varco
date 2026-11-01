import type { Combattente } from "@/lib/rules/types";
import type { Essenza } from "@/lib/personaggio/essenza";
import { EROI } from "./eroi";
import { NEMICI } from "./nemici";
import type { IdUniverso, SchedaEroe, SchedaNemico } from "./tipi";

export * from "./tipi";
export { EROI } from "./eroi";
export { NEMICI } from "./nemici";
export { UNIVERSI, arenaDi, universoDellArena } from "./universi";

export const ENERGIA_BASE = 10;

/** Formula unica per trasformare un'Essenza in un combattente pronto. */
export function combattenteDa(id: string, essenza: Essenza, pvBonus = 0): Combattente {
  const pvMax = Math.max(8, 20 + essenza.statistiche.tempra + pvBonus);
  return { id, nome: essenza.nome, statistiche: essenza.statistiche, pv: pvMax, pvMax, energia: ENERGIA_BASE, energiaMax: ENERGIA_BASE, stati: [] };
}

export function eroiDi(universo: IdUniverso): SchedaEroe[] {
  return EROI.filter((e) => e.universo === universo);
}

export function nemiciDi(universo: IdUniverso): SchedaNemico[] {
  return NEMICI.filter((n) => n.universo === universo);
}

export function trovaEroe(id: string): SchedaEroe | undefined {
  return EROI.find((e) => e.id === id);
}

export function trovaNemico(id: string): SchedaNemico | undefined {
  return NEMICI.find((n) => n.id === id);
}
