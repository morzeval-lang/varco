import { describe, expect, it } from "vitest";
import { EROI, NEMICI, UNIVERSI, combattenteDa, eroiDi, nemiciDi } from "./index";
import { SOMMA_STATISTICHE, EssenzaSchema } from "@/lib/personaggio/essenza";
import { ARCHETIPI, ELEMENTI } from "@/lib/rules/types";

const tutti = [...EROI.map((e) => ({ id: e.id, essenza: e.essenza })), ...NEMICI.map((n) => ({ id: n.id, essenza: n.essenza }))];
const somma = (s: Record<string, number>) => Object.values(s).reduce((a, b) => a + b, 0);

describe("catalogo", () => {
  it("gli id sono unici", () => {
    const ids = tutti.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(tutti)("$id ha un'Essenza valida con statistiche bilanciate", ({ essenza }) => {
    expect(EssenzaSchema.safeParse(essenza).success).toBe(true);
    expect(somma(essenza.statistiche)).toBe(SOMMA_STATISTICHE);
  });

  it("ogni universo ha almeno 4 eroi, un gregario, un campione e un boss", () => {
    for (const u of Object.values(UNIVERSI)) {
      expect(eroiDi(u.id).length).toBeGreaterThanOrEqual(4);
      const ranghi = nemiciDi(u.id).map((n) => n.rango);
      expect(ranghi).toEqual(expect.arrayContaining(["gregario", "campione", "boss"]));
      expect(u.arene.length).toBeGreaterThan(0);
    }
  });

  it("le mosse usano archetipi ed elementi esistenti", () => {
    const mosse = [...EROI.flatMap((e) => e.mosseFirma), ...NEMICI.flatMap((n) => n.mosse)];
    for (const m of mosse) {
      expect(ARCHETIPI).toContain(m.archetipo);
      expect(ELEMENTI).toContain(m.elemento);
      expect([1, 2, 3]).toContain(m.intensita);
    }
  });

  it("i boss hanno più PV dei gregari", () => {
    const pv = (id: string) => {
      const n = NEMICI.find((x) => x.id === id)!;
      return combattenteDa(n.id, n.essenza, n.pvBonus).pvMax;
    };
    expect(pv("re_troll")).toBeGreaterThan(pv("goblin_razziatore") * 1.5);
    expect(pv("regina_rottami")).toBeGreaterThan(pv("ghoul_radioattivo") * 1.5);
  });
});
