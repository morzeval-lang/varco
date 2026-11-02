import { describe, expect, it } from "vitest";
import { identitaDemo } from "./giocatore";

describe("identità in modalità demo", () => {
  it("ricava essenza e storia dalla descrizione", () => {
    const id = identitaDemo("Sono Lia, una cacciatrice con un arco lungo. Vengo dalle paludi. Cerco mio fratello. Odio i ragni.");
    expect(id.essenza.arma.tipo).toBe("arco");
    expect(id.storia).toBe("Sono Lia, una cacciatrice con un arco lungo. Vengo dalle paludi. Cerco mio fratello.");
    expect(id.origine.length).toBeGreaterThan(0);
  });
  it("accorcia le storie troppo lunghe", () => {
    expect(identitaDemo("parola ".repeat(200)).storia.length).toBeLessThanOrEqual(360);
  });
});
