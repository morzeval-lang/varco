import type { Elemento } from "@/lib/rules/types";

export const COLORI_ELEMENTO: Record<Elemento, string> = {
  fuoco: "#ff6a2b",
  gelo: "#8fe3ff",
  fulmine: "#ffe94a",
  tossico: "#8dff4a",
  luce: "#fff3b0",
  ombra: "#9b5cff",
  cinetico: "#ffffff",
  plasma: "#ff4ad8",
};

function canali(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function esadecimale([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0")).join("")}`;
}

/** Tono d'ombra per la colorazione a due toni (cel shading). */
export function scurisci(hex: string, f = 0.72): string {
  return esadecimale(canali(hex).map((c) => c * f) as [number, number, number]);
}

export function schiarisci(hex: string, f = 0.35): string {
  return esadecimale(canali(hex).map((c) => c + (255 - c) * f) as [number, number, number]);
}

export const CONTORNO = "#1b1622";
