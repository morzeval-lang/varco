import type { Essenza } from "@/lib/personaggio/essenza";

/**
 * Prompt per generare le illustrazioni definitive con un generatore di immagini.
 * Lo stile è fisso e uguale per tutti, così cartoncini e sfondi sembrano dello stesso gioco.
 * Sono in inglese perché i generatori rendono meglio così.
 */

/**
 * "Stile Varco": manga e anime d'azione anni '80 e '90, serio e nostalgico. Proporzioni adulte, anatomia
 * leggibile, sguardi taglienti, inchiostro deciso, ombre nette a due toni, luce drammatica di fine giornata.
 * Si descrivono i tratti e non si nominano autori o opere esistenti.
 */
export const STILE =
  "2D hand-drawn retro action anime illustration, late 80s - early 90s cel animation look, adult proportions about seven heads tall, " +
  "defined musculature and readable anatomy, sharp narrow eyes and determined expression, bold confident ink lines, " +
  "flat cel shading with crisp two-tone shadows and a warm rim light, dramatic dusk lighting, slightly muted warm palette, " +
  "subtle film grain, serious heroic tone, crisp readable silhouette, no text, no watermark";

const CORPORATURA: Record<Essenza["corporatura"], string> = {
  esile: "slender build",
  media: "average build",
  robusta: "sturdy muscular build",
  imponente: "huge imposing build",
};

const ARMA: Record<Essenza["arma"]["tipo"], string> = {
  spada: "holding a blade",
  bastone: "holding a magic staff",
  arco: "holding a bow",
  pistola: "holding a handgun",
  pugni: "bare-knuckle brawler fists raised",
  scudo: "holding a large shield",
};

export function promptCartoncino(e: Essenza, descrizione?: string): string {
  return [
    `${STILE}.`,
    `Full body character, ${CORPORATURA[e.corporatura]}, dynamic battle stance, facing right in three-quarter view, feet visible at the bottom.`,
    `Character: ${e.concetto}.`,
    descrizione ? `Details: ${descrizione}` : "",
    `Weapon: ${e.arma.descrizione || e.arma.tipo} (${ARMA[e.arma.tipo]}).`,
    e.segnoDistintivo.tipo !== "nessuno" ? `Distinctive feature: ${e.segnoDistintivo.descrizione}.` : "",
    `Main colors ${e.palette.primario}, ${e.palette.secondario}, accent ${e.palette.accento}; skin ${e.pelle}; hair ${e.capelli.colore}.`,
    "Square image, the whole body fills about 85% of the height, feet near the bottom edge, centered horizontally.",
    "Plain transparent background (PNG), no ground, no shadow, single character only.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function promptSfondo(descrizioneLuogo: string): string {
  return [
    `${STILE}.`,
    "Wide background painting for a battle scene, 16:9 (1800x1000), no characters, empty flat ground strip across the lower quarter",
    "where two characters will stand facing each other, camera at eye level, strong depth.",
    `Location: ${descrizioneLuogo}`,
  ].join(" ");
}
