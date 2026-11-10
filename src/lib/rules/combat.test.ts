import { describe, expect, it } from "vitest";
import { costoEnergia, difesa, modificatore, recuperaEnergia, risolviMossa } from "./combat";
import { Dadi } from "./rng";
import type { Combattente, Mossa } from "./types";

const eroe: Combattente = {
  id: "eroe",
  nome: "Eroe",
  statistiche: { forza: 14, agilita: 12, mente: 12, tempra: 10 },
  pv: 30,
  pvMax: 30,
  energia: 10,
  energiaMax: 10,
  stati: [],
};
const ghoul: Combattente = { ...eroe, id: "ghoul", nome: "Ghoul", statistiche: { forza: 12, agilita: 10, mente: 6, tempra: 14 } };
const fendente: Mossa = { archetipo: "fendente", elemento: "cinetico", intensita: 1 };

function trovaSeme(cond: (d20: number) => boolean): number {
  for (let seme = 1; seme < 100_000; seme++) {
    if (cond(new Dadi(seme).tira(1, 20, "x").totale)) return seme;
  }
  throw new Error("nessun seme trovato");
}

describe("dadi", () => {
  it("stesso seme, stessi tiri", () => {
    expect(new Dadi(42).tira(5, 20, "x").risultati).toEqual(new Dadi(42).tira(5, 20, "x").risultati);
  });
  it("i risultati stanno tra 1 e le facce", () => {
    const t = new Dadi(7).tira(2000, 6, "x");
    expect(Math.min(...t.risultati)).toBe(1);
    expect(Math.max(...t.risultati)).toBe(6);
  });
});

describe("regole base", () => {
  it("modificatore e costo energia", () => {
    expect(modificatore(10)).toBe(0);
    expect(modificatore(14)).toBe(2);
    expect(modificatore(7)).toBe(-2);
    expect(costoEnergia(1)).toBe(0);
    expect(costoEnergia(3)).toBe(6);
  });
  it("in guardia alza la difesa", () => {
    expect(difesa({ ...ghoul, stati: ["in_guardia"] })).toBe(difesa(ghoul) + 3);
  });
});

describe("risolviMossa", () => {
  it("è deterministica", () => {
    const a = risolviMossa({ attore: eroe, bersaglio: ghoul, mossa: fendente, seme: 123, arena: "test" });
    const b = risolviMossa({ attore: eroe, bersaglio: ghoul, mossa: fendente, seme: 123, arena: "test" });
    expect(a).toEqual(b);
  });

  it("non modifica gli oggetti in ingresso", () => {
    const copia = structuredClone(ghoul);
    risolviMossa({ attore: eroe, bersaglio: ghoul, mossa: fendente, seme: trovaSeme((d) => d === 20), arena: "t" });
    expect(ghoul).toEqual(copia);
  });

  it("20 naturale è critico e raddoppia i dadi di danno", () => {
    const seme = trovaSeme((d) => d === 20);
    const r = risolviMossa({ attore: eroe, bersaglio: ghoul, mossa: { ...fendente, intensita: 2 }, seme, arena: "t" });
    expect(r.copione.esito).toBe("critico");
    expect(r.copione.tiri[1].formula).toBe("4d8");
    expect(r.bersaglio.pv).toBe(ghoul.pv - r.copione.danno);
  });

  it("1 naturale è fallimento senza danno", () => {
    const seme = trovaSeme((d) => d === 1);
    const r = risolviMossa({ attore: eroe, bersaglio: ghoul, mossa: fendente, seme, arena: "t" });
    expect(r.copione.esito).toBe("fallimento");
    expect(r.copione.danno).toBe(0);
  });

  it("il bonus narrativo è limitato a +2", () => {
    const seme = trovaSeme((d) => d === 5);
    const conBonus = risolviMossa({ attore: eroe, bersaglio: ghoul, mossa: { ...fendente, bonusNarrativo: 50 }, seme, arena: "t" });
    const conDue = risolviMossa({ attore: eroe, bersaglio: ghoul, mossa: { ...fendente, bonusNarrativo: 2 }, seme, arena: "t" });
    expect(conBonus.copione).toEqual(conDue.copione);
  });

  it("i PV non scendono sotto zero e segnalano il KO", () => {
    const seme = trovaSeme((d) => d === 20);
    const r = risolviMossa({ attore: eroe, bersaglio: { ...ghoul, pv: 1 }, mossa: fendente, seme, arena: "t" });
    expect(r.bersaglio.pv).toBe(0);
    expect(r.copione.ko).toBe(true);
  });

  it("senza energia la mossa non parte", () => {
    const r = risolviMossa({ attore: { ...eroe, energia: 0 }, bersaglio: ghoul, mossa: { ...fendente, intensita: 3 }, seme: 1, arena: "t" });
    expect(r.copione.esito).toBe("senza_energia");
    expect(r.copione.tiri).toHaveLength(0);
  });

  it("lo scudo dimezza il danno e poi si consuma", () => {
    const seme = trovaSeme((d) => d === 20);
    const senza = risolviMossa({ attore: eroe, bersaglio: ghoul, mossa: fendente, seme, arena: "t" });
    const con = risolviMossa({ attore: eroe, bersaglio: { ...ghoul, stati: ["scudo"] }, mossa: fendente, seme, arena: "t" });
    expect(con.copione.danno).toBe(Math.max(1, Math.floor(senza.copione.danno / 2)));
    expect(con.bersaglio.stati).not.toContain("scudo");
  });

  it("la cura non supera i PV massimi", () => {
    const r = risolviMossa({ attore: { ...eroe, pv: 29 }, bersaglio: ghoul, mossa: { archetipo: "cura", elemento: "luce", intensita: 1 }, seme: 9, arena: "t" });
    expect(r.copione.esito).toBe("riuscito");
    expect(r.attore.pv).toBe(30);
  });
});

describe("recuperaEnergia", () => {
  const base: Combattente = { id: "x", nome: "X", statistiche: { forza: 12, agilita: 12, mente: 12, tempra: 12 }, pv: 10, pvMax: 30, energia: 3, energiaMax: 10, stati: [] };
  it("ricarica senza superare il massimo", () => {
    expect(recuperaEnergia(base).energia).toBe(5);
    expect(recuperaEnergia({ ...base, energia: 9 }).energia).toBe(10);
  });
  it("chi è a terra non recupera", () => {
    expect(recuperaEnergia({ ...base, pv: 0 }).energia).toBe(3);
  });
});
