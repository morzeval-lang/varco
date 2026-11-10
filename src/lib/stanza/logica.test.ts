import { describe, expect, it } from "vitest";
import { EROI } from "@/data";
import type { Mossa } from "@/lib/rules/types";
import {
  ErroreStanza,
  aggiungiGiocatore,
  applicaMossa,
  applicaNarrazione,
  diChiETurno,
  esciGiocatore,
  gmOccupato,
  inAttesaDi,
  iniziaCombattimento,
  nemiciPossibili,
  nuovaStanza,
  prenotaGm,
  prontoPerGm,
  registraAzione,
  saltaTurno,
} from "./logica";
import { narraDemo } from "@/lib/gm/narra";
import { pubblica, type GiocatoreStanza, type Stanza } from "./tipi";

const ORA = "2026-11-10T10:00:00.000Z";
const seme = (t: number) => 1000 + t * 7919;
const FENDENTE: Mossa = { archetipo: "fendente", elemento: "cinetico", intensita: 1, bonusNarrativo: 0 };

function giocatore(id: string, i = 0): GiocatoreStanza {
  return { id, segreto: `s-${id}`, essenza: EROI[i].essenza, haRitratto: false, entratoIl: ORA };
}

function stanzaCon(n: number): Stanza {
  let s = nuovaStanza("ABC234", "post_apocalisse", ORA);
  for (let i = 0; i < n; i++) s = aggiungiGiocatore(s, giocatore(`g${i}`, i), ORA);
  return s;
}

describe("stanza", () => {
  it("nasce con il racconto d'apertura e accoglie fino a 4 giocatori", () => {
    const s = stanzaCon(4);
    expect(s.racconto[0].tipo).toBe("gm");
    expect(s.giocatori).toHaveLength(4);
    expect(() => aggiungiGiocatore(s, giocatore("g9"), ORA)).toThrow(ErroreStanza);
  });

  it("non manda i segreti ai browser", () => {
    const p = pubblica(stanzaCon(2));
    expect(JSON.stringify(p)).not.toContain("s-g0");
  });

  it("il GM risponde quando tutti hanno scritto, o se sollecitato", () => {
    let s = stanzaCon(2);
    s = registraAzione(s, "g0", "Esploro le lamiere", ORA);
    expect(inAttesaDi(s)).toEqual(["g1"]);
    expect(prontoPerGm(s)).toBe(false);
    expect(prontoPerGm(s, true)).toBe(true);
    s = registraAzione(s, "g1", "Ascolto la radio", ORA);
    expect(prontoPerGm(s)).toBe(true);
  });

  it("la prenotazione del GM scade dopo un po'", () => {
    const s = prenotaGm(stanzaCon(1), ORA);
    expect(gmOccupato(s, "2026-11-10T10:00:30.000Z")).toBe(true);
    expect(gmOccupato(s, "2026-11-10T10:05:00.000Z")).toBe(false);
  });

  it("la narrazione chiude il giro e può far partire uno scontro", () => {
    let s = registraAzione(stanzaCon(2), "g0", "Attacco il primo che vedo", ORA);
    const n = narraDemo(s, [{ nome: "X", testo: "Attacco il primo che vedo" }], nemiciPossibili(s));
    expect(n.nemico).not.toBeNull();
    s = applicaNarrazione(prenotaGm(s, ORA), n, ORA);
    expect(s.fase).toBe("combattimento");
    expect(s.azioni).toEqual({});
    expect(s.gmAlLavoroDal).toBeNull();
    expect(diChiETurno(s)).toBe("g0");
  });

  it("all'inizio solo gregari, poi si sale di rango", () => {
    const s = stanzaCon(1);
    expect(nemiciPossibili(s).every((n) => n.rango === "gregario")).toBe(true);
    expect(nemiciPossibili({ ...s, vittorie: 3 }).some((n) => n.rango === "boss")).toBe(true);
  });

  it("in squadra il nemico ha più PV", () => {
    const uno = iniziaCombattimento(stanzaCon(1), "ghoul_radioattivo", ORA).combattimento!;
    const tre = iniziaCombattimento(stanzaCon(3), "ghoul_radioattivo", ORA).combattimento!;
    expect(tre.nemico.pvMax).toBeGreaterThan(uno.nemico.pvMax);
  });
});

describe("combattimento in stanza", () => {
  it("si gioca a turno e dopo il giro agisce il nemico", () => {
    let s = iniziaCombattimento(stanzaCon(2), "ghoul_radioattivo", ORA);
    expect(() => applicaMossa(s, "g1", "colpisco", FENDENTE, seme, ORA)).toThrow("Non è il tuo turno");
    s = applicaMossa(s, "g0", "colpisco", FENDENTE, seme, ORA);
    if (s.fase !== "combattimento") return; // KO al primo colpo: improbabile ma lecito
    expect(diChiETurno(s)).toBe("g1");
    const mossePrima = s.combattimento!.mosseNemico;
    s = applicaMossa(s, "g1", "colpisco anch'io", FENDENTE, seme, ORA);
    if (s.fase !== "combattimento") return;
    expect(s.combattimento!.mosseNemico).toBe(mossePrima + 1);
    const scenaNemico = s.racconto.filter((v) => v.scena?.diNemico);
    expect(scenaNemico).toHaveLength(1);
    expect(scenaNemico[0].scena!.copione.attore).toBe("nemico");
  });

  it("è deterministico: stesse mosse e stesso seme, stesso esito", () => {
    const gioca = () => {
      let s = iniziaCombattimento(stanzaCon(2), "ghoul_radioattivo", ORA);
      for (let i = 0; i < 6 && s.fase === "combattimento"; i++) s = applicaMossa(s, diChiETurno(s)!, "colpo", FENDENTE, seme, ORA);
      return s;
    };
    expect(gioca()).toEqual(gioca());
  });

  it("finisce con una vittoria o una sconfitta e si torna al racconto", () => {
    let s = iniziaCombattimento(stanzaCon(1), "ghoul_radioattivo", ORA);
    for (let i = 0; i < 200 && s.fase === "combattimento"; i++) s = applicaMossa(s, diChiETurno(s)!, "colpo", FENDENTE, seme, ORA);
    expect(s.fase).toBe("esplorazione");
    expect(s.combattimento).toBeNull();
    expect(s.racconto.at(-1)!.testo).toMatch(/Vittoria|a terra/);
  });

  it("si può saltare il turno di chi non risponde", () => {
    let s = iniziaCombattimento(stanzaCon(2), "ghoul_radioattivo", ORA);
    s = saltaTurno(s, "g1", seme, ORA);
    expect(diChiETurno(s)).toBe("g1");
  });

  it("chi esce durante lo scontro non blocca il turno", () => {
    let s = iniziaCombattimento(stanzaCon(2), "ghoul_radioattivo", ORA);
    s = esciGiocatore(s, "g0", ORA);
    expect(diChiETurno(s)).toBe("g1");
    s = esciGiocatore(s, "g1", ORA);
    expect(s.fase).toBe("esplorazione");
  });
});
