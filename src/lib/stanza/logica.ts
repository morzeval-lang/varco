import { NEMICI, UNIVERSI, arenaDi, combattenteDa, trovaNemico, type IdUniverso, type Rango } from "@/data";
import { recuperaEnergia, risolviMossa } from "@/lib/rules/combat";
import type { Combattente, Mossa } from "@/lib/rules/types";
import { MAX_GIOCATORI, MAX_VOCI, type GiocatoreStanza, type Stanza, type Voce } from "./tipi";

/**
 * Regole della stanza: funzioni pure che prendono una stanza e ne restituiscono una nuova.
 * Niente rete e niente AI: il GM e i dadi arrivano da fuori (vedi servizio.ts).
 */

export class ErroreStanza extends Error {}

/** Quello che il GM decide dopo un giro di esplorazione. */
export interface Narrazione {
  racconto: string;
  /** Id del nemico che entra in scena, o null se la storia continua senza scontri. */
  nemico: string | null;
}

/** PV in più del nemico per ogni giocatore oltre il primo: in squadra si picchia di più. */
export const PV_NEMICO_PER_GIOCATORE = 12;

const ORDINE_RANGO: Record<Rango, number> = { gregario: 0, campione: 1, boss: 2 };

function clona(s: Stanza): Stanza {
  return structuredClone(s);
}

function aggiungiVoce(s: Stanza, v: Omit<Voce, "id" | "ora">, ora: string) {
  s.racconto.push({ ...v, id: s.prossimaVoce++, ora });
  if (s.racconto.length > MAX_VOCI) s.racconto.splice(0, s.racconto.length - MAX_VOCI);
}

export function nuovaStanza(codice: string, universo: IdUniverso, ora: string): Stanza {
  const u = UNIVERSI[universo];
  const s: Stanza = {
    codice,
    universo,
    creataIl: ora,
    giocatori: [],
    racconto: [],
    prossimaVoce: 1,
    fase: "esplorazione",
    azioni: {},
    giri: 0,
    giriSenzaScontri: 0,
    vittorie: 0,
    combattimenti: 0,
    combattimento: null,
    gmAlLavoroDal: null,
    versione: 0,
  };
  aggiungiVoce(
    s,
    {
      tipo: "gm",
      testo: `Il Varco si apre su ${u.nome}. ${u.tono} ${arenaDi(universo).descrizione} Siete arrivati insieme, o quasi. Cosa fate?`,
    },
    ora,
  );
  return s;
}

export function trovaGiocatore(s: Stanza, id: string): GiocatoreStanza | undefined {
  return s.giocatori.find((g) => g.id === id);
}

export function nomeDi(s: Stanza, id: string): string {
  return trovaGiocatore(s, id)?.essenza.nome ?? "Qualcuno";
}

export function aggiungiGiocatore(s0: Stanza, g: GiocatoreStanza, ora: string): Stanza {
  if (s0.giocatori.some((x) => x.id === g.id)) return s0;
  if (s0.giocatori.length >= MAX_GIOCATORI) throw new ErroreStanza(`La stanza è piena: al massimo ${MAX_GIOCATORI} giocatori.`);
  const s = clona(s0);
  s.giocatori.push(g);
  const extra = s.fase === "combattimento" ? " Entrerà in campo dal prossimo scontro." : "";
  aggiungiVoce(s, { tipo: "sistema", testo: `${g.essenza.nome} attraversa il Varco.${extra}` }, ora);
  return s;
}

export function esciGiocatore(s0: Stanza, id: string, ora: string): Stanza {
  const g = trovaGiocatore(s0, id);
  if (!g) return s0;
  const s = clona(s0);
  s.giocatori = s.giocatori.filter((x) => x.id !== id);
  delete s.azioni[id];
  const c = s.combattimento;
  if (c && c.ordine.includes(id)) {
    const attuale = c.ordine[c.indice];
    c.ordine = c.ordine.filter((x) => x !== id);
    delete c.eroi[id];
    c.indice = attuale === id ? c.indice % Math.max(1, c.ordine.length) : Math.max(0, c.ordine.indexOf(attuale));
    if (c.ordine.length === 0) {
      s.fase = "esplorazione";
      s.combattimento = null;
    }
  }
  aggiungiVoce(s, { tipo: "sistema", testo: `${g.essenza.nome} lascia la stanza.` }, ora);
  return s;
}

// ———————————————————————————— esplorazione ————————————————————————————

/** Il giocatore scrive cosa fa in questo giro. Riscrivere sostituisce l'azione precedente. */
export function registraAzione(s0: Stanza, id: string, testo: string, ora: string): Stanza {
  if (s0.fase !== "esplorazione") throw new ErroreStanza("Si sta combattendo: aspetta il tuo turno per la mossa.");
  if (!trovaGiocatore(s0, id)) throw new ErroreStanza("Non sei in questa stanza.");
  const s = clona(s0);
  s.azioni[id] = testo;
  aggiungiVoce(s, { tipo: "giocatore", autore: id, testo }, ora);
  return s;
}

/** Chi deve ancora scrivere in questo giro. */
export function inAttesaDi(s: Stanza): string[] {
  return s.giocatori.filter((g) => !(g.id in s.azioni)).map((g) => g.id);
}

/** Il GM risponde quando tutti hanno scritto, oppure quando qualcuno lo sollecita. */
export function prontoPerGm(s: Stanza, sollecitato = false): boolean {
  if (s.fase !== "esplorazione" || Object.keys(s.azioni).length === 0) return false;
  return sollecitato || inAttesaDi(s).length === 0;
}

/** Dopo quanti secondi un GM "al lavoro" si considera bloccato e si può riprovare. */
export const SCADENZA_GM_SECONDI = 90;

export function gmOccupato(s: Stanza, ora: string): boolean {
  if (!s.gmAlLavoroDal) return false;
  return Date.parse(ora) - Date.parse(s.gmAlLavoroDal) < SCADENZA_GM_SECONDI * 1000;
}

export function prenotaGm(s0: Stanza, ora: string): Stanza {
  const s = clona(s0);
  s.gmAlLavoroDal = ora;
  return s;
}

/** Le azioni del giro, con il nome di chi le ha scritte, nell'ordine dei giocatori. */
export function azioniDelGiro(s: Stanza): { nome: string; testo: string }[] {
  return s.giocatori.filter((g) => g.id in s.azioni).map((g) => ({ nome: g.essenza.nome, testo: s.azioni[g.id] }));
}

/** Nemici adatti al prossimo scontro: si sale di rango vincendo. */
export function nemiciPossibili(s: Stanza) {
  const max = s.vittorie >= 3 ? 2 : s.vittorie >= 1 ? 1 : 0;
  return NEMICI.filter((n) => n.universo === s.universo && ORDINE_RANGO[n.rango] <= max);
}

export function applicaNarrazione(s0: Stanza, n: Narrazione, ora: string): Stanza {
  let s = clona(s0);
  s.gmAlLavoroDal = null;
  s.azioni = {};
  s.giri++;
  aggiungiVoce(s, { tipo: "gm", testo: n.racconto }, ora);
  const nemico = n.nemico ? trovaNemico(n.nemico) : undefined;
  if (nemico && nemico.universo === s.universo && s.giocatori.length > 0) {
    s = iniziaCombattimento(s, nemico.id, ora);
  } else {
    s.giriSenzaScontri++;
  }
  return s;
}

/** Se il GM non risponde si libera la prenotazione, così si può riprovare. */
export function liberaGm(s0: Stanza): Stanza {
  const s = clona(s0);
  s.gmAlLavoroDal = null;
  return s;
}

// ———————————————————————————— combattimento ————————————————————————————

export function iniziaCombattimento(s0: Stanza, nemicoId: string, ora: string): Stanza {
  const scheda = trovaNemico(nemicoId);
  if (!scheda) throw new ErroreStanza("Nemico sconosciuto.");
  const s = clona(s0);
  const extraPv = PV_NEMICO_PER_GIOCATORE * Math.max(0, s.giocatori.length - 1);
  const eroi: Record<string, Combattente> = {};
  for (const g of s.giocatori) eroi[g.id] = combattenteDa(g.id, g.essenza);
  s.fase = "combattimento";
  s.giriSenzaScontri = 0;
  s.combattimenti++;
  s.combattimento = {
    nemicoId,
    nemico: combattenteDa("nemico", scheda.essenza, scheda.pvBonus + extraPv),
    eroi,
    ordine: s.giocatori.map((g) => g.id),
    indice: 0,
    turno: 0,
    mosseNemico: 0,
  };
  aggiungiVoce(s, { tipo: "nemico", testo: scheda.ingresso }, ora);
  aggiungiVoce(s, { tipo: "sistema", testo: `Scontro con ${scheda.essenza.nome}! Inizia ${nomeDi(s, s.giocatori[0].id)}.` }, ora);
  return s;
}

/** Id del giocatore che deve fare la mossa, o null se non si combatte. */
export function diChiETurno(s: Stanza): string | null {
  const c = s.combattimento;
  if (s.fase !== "combattimento" || !c || c.ordine.length === 0) return null;
  return c.ordine[c.indice] ?? null;
}

function vivi(c: NonNullable<Stanza["combattimento"]>): string[] {
  return c.ordine.filter((id) => (c.eroi[id]?.pv ?? 0) > 0);
}

/** Passa al prossimo eroe in piedi. Restituisce true se il giro è finito (tocca al nemico). */
function avanza(c: NonNullable<Stanza["combattimento"]>): boolean {
  let giroFinito = false;
  for (let i = 0; i < c.ordine.length; i++) {
    c.indice++;
    if (c.indice >= c.ordine.length) {
      c.indice = 0;
      giroFinito = true;
    }
    if ((c.eroi[c.ordine[c.indice]]?.pv ?? 0) > 0) break;
  }
  return giroFinito;
}

function chiudiCombattimento(s: Stanza, vittoria: boolean, ora: string) {
  const c = s.combattimento!;
  const scheda = trovaNemico(c.nemicoId)!;
  if (vittoria) {
    s.vittorie++;
    aggiungiVoce(s, { tipo: "sistema", testo: `${scheda.essenza.nome} crolla. Vittoria! Il racconto riprende: cosa fate adesso?` }, ora);
  } else {
    aggiungiVoce(
      s,
      { tipo: "sistema", testo: `La squadra è a terra. ${scheda.essenza.nome} se ne va ridendo. Vi rialzate a fatica: cosa fate adesso?` },
      ora,
    );
  }
  s.fase = "esplorazione";
  s.combattimento = null;
  s.azioni = {};
}

/** Il nemico colpisce gli eroi a rotazione, scegliendo tra quelli ancora in piedi. */
function turnoDelNemico(s: Stanza, seme: (turno: number) => number, ora: string) {
  const c = s.combattimento!;
  const scheda = trovaNemico(c.nemicoId)!;
  const bersagli = vivi(c);
  if (bersagli.length === 0) return;
  const idBersaglio = bersagli[c.mosseNemico % bersagli.length];
  const { nome, archetipo, elemento, intensita } = scheda.mosse[c.mosseNemico % scheda.mosse.length];
  c.mosseNemico++;
  const arena = arenaDi(s.universo).id;
  const r = risolviMossa({ attore: recuperaEnergia(c.nemico), bersaglio: c.eroi[idBersaglio], mossa: { nome, archetipo, elemento, intensita, bonusNarrativo: 0 }, seme: seme(c.turno++), arena });
  c.nemico = r.attore;
  c.eroi[idBersaglio] = r.bersaglio;
  aggiungiVoce(s, { tipo: "nemico", testo: r.copione.didascalia, tiri: r.copione.tiri, scena: { copione: r.copione, eroe: idBersaglio, nemico: c.nemicoId, diNemico: true } }, ora);
  if (r.copione.ko) aggiungiVoce(s, { tipo: "sistema", testo: `${nomeDi(s, idBersaglio)} è a terra.` }, ora);
}

/**
 * La mossa dell'eroe di turno, già interpretata (archetipo, elemento, intensità).
 * Se chiude il giro, nella stessa chiamata agisce anche il nemico.
 */
export function applicaMossa(
  s0: Stanza,
  id: string,
  testo: string,
  mossa: Mossa,
  seme: (turno: number) => number,
  ora: string,
): Stanza {
  if (diChiETurno(s0) !== id) throw new ErroreStanza("Non è il tuo turno.");
  const s = clona(s0);
  const c = s.combattimento!;
  const arena = arenaDi(s.universo).id;
  aggiungiVoce(s, { tipo: "giocatore", autore: id, testo }, ora);
  const r = risolviMossa({ attore: recuperaEnergia(c.eroi[id]), bersaglio: c.nemico, mossa, seme: seme(c.turno++), arena });
  c.eroi[id] = r.attore;
  c.nemico = r.bersaglio;
  aggiungiVoce(s, { tipo: "gm", testo: r.copione.didascalia, tiri: r.copione.tiri, scena: { copione: r.copione, eroe: id, nemico: c.nemicoId, diNemico: false } }, ora);
  return dopoLaMossa(s, seme, ora);
}

/** Salta il turno di chi non risponde (chiunque nella stanza può farlo, per non bloccare gli altri). */
export function saltaTurno(s0: Stanza, chiChiede: string, seme: (turno: number) => number, ora: string): Stanza {
  const attuale = diChiETurno(s0);
  if (!attuale) throw new ErroreStanza("Non si sta combattendo.");
  if (!trovaGiocatore(s0, chiChiede)) throw new ErroreStanza("Non sei in questa stanza.");
  const s = clona(s0);
  aggiungiVoce(s, { tipo: "sistema", testo: `${nomeDi(s, attuale)} esita e perde il turno.` }, ora);
  return dopoLaMossa(s, seme, ora);
}

function dopoLaMossa(s: Stanza, seme: (turno: number) => number, ora: string): Stanza {
  const c = s.combattimento!;
  if (c.nemico.pv <= 0) {
    chiudiCombattimento(s, true, ora);
    return s;
  }
  const giroFinito = avanza(c);
  if (giroFinito) {
    turnoDelNemico(s, seme, ora);
    if (vivi(c).length === 0) {
      chiudiCombattimento(s, false, ora);
      return s;
    }
    // se il nemico ha steso l'eroe che doveva iniziare il giro, passa al prossimo in piedi
    if ((c.eroi[c.ordine[c.indice]]?.pv ?? 0) <= 0) avanza(c);
  }
  aggiungiVoce(s, { tipo: "sistema", testo: `Tocca a ${nomeDi(s, c.ordine[c.indice])}.` }, ora);
  return s;
}
