import { describe, expect, it } from "vitest";
import { essenzaDemo } from "./demo";
import { normalizzaStatistiche, SOMMA_STATISTICHE } from "./essenza";

const somma = (s: { forza: number; agilita: number; mente: number; tempra: number }) => s.forza + s.agilita + s.mente + s.tempra;

describe("normalizzaStatistiche", () => {
  it("porta sempre la somma a 48 dentro i limiti", () => {
    for (const s of [
      { forza: 99, agilita: 99, mente: 99, tempra: 99 },
      { forza: 0, agilita: 0, mente: 0, tempra: 0 },
      { forza: 16, agilita: 6, mente: 13, tempra: 13 },
      { forza: NaN, agilita: 12, mente: 12, tempra: 12 },
    ]) {
      const n = normalizzaStatistiche(s);
      expect(somma(n)).toBe(SOMMA_STATISTICHE);
      Object.values(n).forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(6);
        expect(v).toBeLessThanOrEqual(16);
      });
    }
  });
});

describe("essenzaDemo", () => {
  const testo = "Una ex soldatessa con un braccio meccanico arrugginito, capelli rasati, un mantello rosso e una spada.";

  it("riconosce le parole chiave", () => {
    const e = essenzaDemo(testo);
    expect(e.segnoDistintivo.tipo).toBe("braccio_meccanico");
    expect(e.capelli.stile).toBe("rasati");
    expect(e.arma.tipo).toBe("spada");
    expect(e.palette.primario).toBe("#b3261e");
    expect(somma(e.statistiche)).toBe(SOMMA_STATISTICHE);
  });

  it("è deterministico", () => {
    expect(essenzaDemo(testo)).toEqual(essenzaDemo(testo));
  });

  it("usa il nome se indicato", () => {
    expect(essenzaDemo("Un mago alto, si chiama Orlando Vento").nome).toBe("Orlando Vento");
  });
});

describe("essenzaDemo, casi limite", () => {
  it("riconosce 'Si chiama' con la maiuscola e non scambia 'grosso' per rosso", () => {
    const e = essenzaDemo("Un predone grosso con vestiti marroni. Si chiama Grosso Bruno.");
    expect(e.nome).toBe("Grosso Bruno");
    expect(e.palette.primario).toBe("#6b4423");
  });
});
