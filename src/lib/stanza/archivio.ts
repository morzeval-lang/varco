import "server-only";
import type { Stanza } from "./tipi";

/**
 * Dove vivono le stanze. In locale bastano in memoria; online servono in un database condiviso
 * (Supabase), perché su Vercel ogni richiesta può arrivare a un server diverso.
 * La scrittura è "ottimistica": si salva solo se nessun altro ha cambiato la stanza nel frattempo.
 */
export interface Archivio {
  tipo: "memoria" | "supabase";
  leggi(codice: string): Promise<Stanza | null>;
  /** Crea la stanza; false se il codice esiste già. */
  crea(s: Stanza): Promise<boolean>;
  /** Salva se la versione sul server è ancora `versionePrima`; false se qualcuno è arrivato prima. */
  aggiorna(s: Stanza, versionePrima: number): Promise<boolean>;
  leggiRitratto(codice: string, giocatore: string): Promise<string | null>;
  salvaRitratto(codice: string, giocatore: string, immagine: string): Promise<void>;
}

// ———————————————————————————— in memoria ————————————————————————————

interface Memoria {
  stanze: Map<string, Stanza>;
  ritratti: Map<string, string>;
}

const globale = globalThis as typeof globalThis & { __varcoMemoria?: Memoria };

function archivioInMemoria(): Archivio {
  // su globalThis, così sopravvive ai ricaricamenti di `next dev`
  const m = (globale.__varcoMemoria ??= { stanze: new Map(), ritratti: new Map() });
  return {
    tipo: "memoria",
    async leggi(codice) {
      const s = m.stanze.get(codice);
      return s ? structuredClone(s) : null;
    },
    async crea(s) {
      if (m.stanze.has(s.codice)) return false;
      m.stanze.set(s.codice, structuredClone(s));
      return true;
    },
    async aggiorna(s, versionePrima) {
      const attuale = m.stanze.get(s.codice);
      if (!attuale || attuale.versione !== versionePrima) return false;
      m.stanze.set(s.codice, structuredClone(s));
      return true;
    },
    async leggiRitratto(codice, giocatore) {
      return m.ritratti.get(`${codice}/${giocatore}`) ?? null;
    },
    async salvaRitratto(codice, giocatore, immagine) {
      m.ritratti.set(`${codice}/${giocatore}`, immagine);
    },
  };
}

// ———————————————————————————— Supabase ————————————————————————————

/** Supabase via la sua API REST, con la chiave segreta che resta sul server. Tabelle in supabase/schema.sql. */
function archivioSupabase(url: string, chiave: string): Archivio {
  const base = `${url.replace(/\/$/, "")}/rest/v1`;
  // le chiavi nuove (sb_secret_...) vanno solo in `apikey`; quelle vecchie (JWT) anche come Bearer
  const intestazioni: Record<string, string> = { apikey: chiave, "Content-Type": "application/json" };
  if (!chiave.startsWith("sb_")) intestazioni.Authorization = `Bearer ${chiave}`;

  async function chiama(percorso: string, init: RequestInit & { prefer?: string } = {}) {
    const { prefer, ...resto } = init;
    const res = await fetch(`${base}${percorso}`, {
      ...resto,
      cache: "no-store",
      headers: { ...intestazioni, ...(prefer ? { Prefer: prefer } : {}) },
    });
    return res;
  }

  async function errore(res: Response, cosa: string): Promise<never> {
    throw new Error(`Supabase (${cosa}): ${res.status} ${await res.text().catch(() => "")}`);
  }

  const cod = (c: string) => encodeURIComponent(c);

  return {
    tipo: "supabase",
    async leggi(codice) {
      const res = await chiama(`/stanze?codice=eq.${cod(codice)}&select=dati`);
      if (!res.ok) return errore(res, "lettura");
      const righe = (await res.json()) as { dati: Stanza }[];
      return righe[0]?.dati ?? null;
    },
    async crea(s) {
      const res = await chiama("/stanze", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ codice: s.codice, versione: s.versione, dati: s }),
      });
      if (res.status === 409) return false;
      if (!res.ok) return errore(res, "creazione");
      return true;
    },
    async aggiorna(s, versionePrima) {
      const res = await chiama(`/stanze?codice=eq.${cod(s.codice)}&versione=eq.${versionePrima}`, {
        method: "PATCH",
        prefer: "return=representation",
        body: JSON.stringify({ versione: s.versione, dati: s, aggiornata_il: new Date().toISOString() }),
      });
      if (!res.ok) return errore(res, "salvataggio");
      const righe = (await res.json()) as unknown[];
      return righe.length === 1;
    },
    async leggiRitratto(codice, giocatore) {
      const res = await chiama(`/ritratti?stanza=eq.${cod(codice)}&giocatore=eq.${cod(giocatore)}&select=immagine`);
      if (!res.ok) return errore(res, "lettura ritratto");
      const righe = (await res.json()) as { immagine: string }[];
      return righe[0]?.immagine ?? null;
    },
    async salvaRitratto(codice, giocatore, immagine) {
      const res = await chiama("/ritratti", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify({ stanza: codice, giocatore, immagine }),
      });
      if (!res.ok) return errore(res, "salvataggio ritratto");
    },
  };
}

let scelto: Archivio | null = null;

export function archivio(): Archivio {
  if (scelto) return scelto;
  const url = process.env.SUPABASE_URL;
  const chiave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  scelto = url && chiave ? archivioSupabase(url, chiave) : archivioInMemoria();
  return scelto;
}

/** Online senza database le stanze si perdono tra un server e l'altro: la pagina lo segnala. */
export function archivioAffidabile(): boolean {
  return archivio().tipo === "supabase" || !process.env.VERCEL;
}
