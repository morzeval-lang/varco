import { describe, expect, it } from "vitest";
import { interpretaMossaDemo, normalizzaMossa } from "./mossa";

describe("interpretaMossaDemo", () => {
  it("riconosce archetipo ed elemento", () => {
    expect(interpretaMossaDemo("Lancio una bottiglia incendiaria sul ghoul")).toMatchObject({ archetipo: "proiettile", elemento: "fuoco" });
    expect(interpretaMossaDemo("Sparo un raggio laser")).toMatchObject({ archetipo: "raggio", elemento: "plasma" });
    expect(interpretaMossaDemo("Mi curo con una benda")).toMatchObject({ archetipo: "cura" });
  });
  it("senza indizi è un fendente cinetico", () => {
    expect(interpretaMossaDemo("vado avanti")).toMatchObject({ archetipo: "fendente", elemento: "cinetico", intensita: 1 });
  });
});

describe("normalizzaMossa", () => {
  it("limita intensità e bonus", () => {
    const m = normalizzaMossa({ nome: "x", archetipo: "raggio", elemento: "luce", intensita: 9, bonusNarrativo: -4 });
    expect(m.intensita).toBe(3);
    expect(m.bonusNarrativo).toBe(0);
  });
});
