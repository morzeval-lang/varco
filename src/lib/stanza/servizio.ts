import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { trovaNemico, type IdUniverso } from "@/data";
import { claudeDisponibile, narraConClaude } from "@/lib/gm/claude";
import { interpretaMossa } from "@/lib/gm/interpreta";
import { contestoPerGm, narraDemo } from "@/lib/gm/narra";
import type { Essenza } from "@/lib/personaggio/essenza";
import { semeDadi } from "@/lib/rules/seme";
import { archivio } from "./archivio";
import {
  ErroreStanza,
  aggiungiGiocatore,
  applicaMossa,
  applicaNarrazione,
  azioniDelGiro,
  diChiETurno,
  esciGiocatore,
  gmOccupato,
  liberaGm,
  nemiciPossibili,
  nuovaStanza,
  prenotaGm,
  prontoPerGm,
  registraAzione,
  saltaTurno,
  type Narrazione,
} from "./logica";
import type { GiocatoreStanza, Stanza } from "./tipi";

/** Lettere senza ambiguità (niente 0/O, 1/I/L): il codice si detta anche a voce. */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function nuovoCodice(): string {
  return Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

const ora = () => new Date().toISOString();

export function normalizzaCodice(c: string): string {
  return c.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

export async function caricaStanza(codice: string): Promise<Stanza> {
  const s = await archivio().leggi(normalizzaCodice(codice));
  if (!s) throw new ErroreStanza("Stanza non trovata: controlla il link.");
  return s;
}

/**
 * Legge, applica `cambia` e salva; se nel frattempo un altro giocatore ha salvato, riprova da capo.
 * `cambia` restituisce la stessa stanza per dire "niente da salvare".
 */
async function modifica(codice: string, cambia: (s: Stanza) => Stanza): Promise<Stanza> {
  for (let tentativo = 0; tentativo < 8; tentativo++) {
    const prima = await caricaStanza(codice);
    const dopo = cambia(prima);
    if (dopo === prima) return prima;
    dopo.versione = prima.versione + 1;
    if (await archivio().aggiorna(dopo, prima.versione)) return dopo;
    await new Promise((r) => setTimeout(r, 40 + Math.floor(Math.random() * 120)));
  }
  throw new ErroreStanza("Troppa gente che scrive insieme: riprova.");
}

function seme(s: Stanza) {
  const n = s.combattimenti;
  return (turno: number) => semeDadi(`stanza-${s.codice}-${n}`, turno);
}

function autentica(s: Stanza, id: string, segreto: string): GiocatoreStanza {
  const g = s.giocatori.find((x) => x.id === id);
  if (!g || g.segreto !== segreto) throw new ErroreStanza("Non sei in questa stanza: rientra dal link.");
  return g;
}

export async function creaStanza(universo: IdUniverso): Promise<Stanza> {
  for (let i = 0; i < 5; i++) {
    const s = nuovaStanza(nuovoCodice(), universo, ora());
    if (await archivio().crea(s)) return s;
  }
  throw new Error("Non riesco a creare la stanza.");
}

export async function entra(
  codice: string,
  dati: { essenza: Essenza; presentazione?: string; immagine?: string },
): Promise<{ stanza: Stanza; id: string; segreto: string }> {
  const id = randomBytes(6).toString("hex");
  const segreto = randomBytes(18).toString("base64url");
  const g: GiocatoreStanza = {
    id,
    segreto,
    essenza: dati.essenza,
    presentazione: dati.presentazione,
    haRitratto: Boolean(dati.immagine),
    entratoIl: ora(),
  };
  const c = normalizzaCodice(codice);
  // il ritratto prima: quando gli altri vedono il nuovo giocatore, l'immagine è già pronta
  if (dati.immagine) await archivio().salvaRitratto(c, id, dati.immagine);
  const stanza = await modifica(c, (s) => aggiungiGiocatore(s, g, ora()));
  return { stanza, id, segreto };
}

export async function esci(codice: string, id: string, segreto: string): Promise<Stanza> {
  return modifica(codice, (s) => {
    autentica(s, id, segreto);
    return esciGiocatore(s, id, ora());
  });
}

/** Esplorazione: scrive l'azione e, se il giro è completo, fa rispondere il GM. */
export async function scriviAzione(codice: string, id: string, segreto: string, testo: string): Promise<Stanza> {
  const s = await modifica(codice, (s) => {
    autentica(s, id, segreto);
    return registraAzione(s, id, testo, ora());
  });
  return prontoPerGm(s) ? faiRispondereGm(codice, false) : s;
}

/** Il GM risponde anche se non tutti hanno scritto (per chi è in ritardo o fuori). */
export async function sollecitaGm(codice: string, id: string, segreto: string): Promise<Stanza> {
  autentica(await caricaStanza(codice), id, segreto);
  return faiRispondereGm(codice, true);
}

async function faiRispondereGm(codice: string, sollecitato: boolean): Promise<Stanza> {
  // 1. prenota il GM, così due giocatori non lo fanno rispondere due volte
  const prenotazione = { riuscita: false };
  const prenotata = await modifica(codice, (s) => {
    prenotazione.riuscita = false;
    if (!prontoPerGm(s, sollecitato) || gmOccupato(s, ora())) return s;
    prenotazione.riuscita = true;
    return prenotaGm(s, ora());
  });
  if (!prenotazione.riuscita) return prenotata;

  // 2. il GM scrive (può volerci qualche secondo)
  const azioni = azioniDelGiro(prenotata);
  const candidati = nemiciPossibili(prenotata);
  let narrazione: Narrazione = narraDemo(prenotata, azioni, candidati);
  if (claudeDisponibile()) {
    try {
      const n = await narraConClaude(contestoPerGm(prenotata, azioni, candidati));
      const valido = n.nemico && candidati.some((c) => c.id === n.nemico) ? n.nemico : null;
      narrazione = { racconto: n.racconto, nemico: valido };
    } catch (e) {
      console.error("Narrazione con Claude fallita, uso la modalità demo:", e);
    }
  }

  // 3. applica il racconto: le azioni arrivate mentre il GM scriveva restano per il prossimo giro
  try {
    return await modifica(codice, (s) => {
      if (!s.gmAlLavoroDal) return s;
      const nuove = Object.fromEntries(Object.entries(s.azioni).filter(([k, v]) => prenotata.azioni[k] !== v));
      const dopo = applicaNarrazione(s, narrazione, ora());
      if (dopo.fase === "esplorazione") dopo.azioni = nuove;
      return dopo;
    });
  } catch (e) {
    await modifica(codice, (s) => (s.gmAlLavoroDal ? liberaGm(s) : s)).catch(() => {});
    throw e;
  }
}

/** Combattimento: la mossa dell'eroe di turno, interpretata dal GM e risolta dai dadi. */
export async function faiMossa(codice: string, id: string, segreto: string, testo: string): Promise<Stanza> {
  const prima = await caricaStanza(codice);
  const g = autentica(prima, id, segreto);
  if (diChiETurno(prima) !== id) throw new ErroreStanza("Non è il tuo turno.");
  const nemico = trovaNemico(prima.combattimento!.nemicoId)!;
  const { mossa } = await interpretaMossa(testo, `${g.essenza.nome} (${g.essenza.concetto}) affronta ${nemico.essenza.nome}.`);
  return modifica(codice, (s) => {
    autentica(s, id, segreto);
    return applicaMossa(s, id, testo, mossa, seme(s), ora());
  });
}

export async function salta(codice: string, id: string, segreto: string, diChi: string): Promise<Stanza> {
  return modifica(codice, (s) => {
    autentica(s, id, segreto);
    // se nel frattempo il turno è già passato, non si salta nessuno
    if (diChiETurno(s) !== diChi) return s;
    return saltaTurno(s, id, seme(s), ora());
  });
}
