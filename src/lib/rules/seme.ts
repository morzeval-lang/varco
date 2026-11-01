import "server-only";
import { createHmac } from "node:crypto";

/**
 * Seme dei dadi derivato da partita e turno con un segreto che resta sul server:
 * il risultato è ripetibile per l'audit ma nessun giocatore può prevederlo.
 */
export function semeDadi(partita: string, turno: number): number {
  const segreto = process.env.VARCO_DICE_SECRET || "varco-sviluppo-locale";
  return createHmac("sha256", segreto).update(`${partita}:${turno}`).digest().readUInt32BE(0);
}
