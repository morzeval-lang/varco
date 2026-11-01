import { describe, expect, it } from "vitest";
import { EROI, NEMICI } from "@/data";
import { promptCartoncino, promptSfondo, STILE } from "./prompt";

describe("prompt per le illustrazioni", () => {
  it.each([...EROI, ...NEMICI].map((s) => [s.id, s] as const))("%s ha un prompt completo", (_, s) => {
    const p = promptCartoncino(s.essenza, s.descrizione);
    expect(p).toContain(STILE);
    expect(p).toContain(s.essenza.concetto);
    expect(p).toContain("facing right");
    expect(p).not.toMatch(/undefined|null/);
  });
  it("lo sfondo chiede una scena senza personaggi", () => {
    expect(promptSfondo("un cortile")).toContain("no characters");
  });
});
