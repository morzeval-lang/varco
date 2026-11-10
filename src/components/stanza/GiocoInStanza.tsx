"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CartaPersonaggio } from "@/components/scena/CartaPersonaggio";
import { EROI, UNIVERSI, arenaDi, trovaNemico } from "@/data";
import type { Essenza } from "@/lib/personaggio/essenza";
import type { Giocatore } from "@/lib/personaggio/giocatore";
import { caricaGiocatore } from "@/lib/personaggio/salvataggio";
import type { Combattente, TiroRegistrato } from "@/lib/rules/types";
import type { GiocatorePubblico, ScenaVoce, StanzaPubblica, Voce } from "@/lib/stanza/tipi";

const ScenaCartoncini = dynamic(() => import("@/components/scena/ScenaCartoncini"), { ssr: false });

interface Credenziali {
  id: string;
  segreto: string;
}

interface Ambiente {
  gm: "claude" | "demo";
  archivioAffidabile: boolean;
}

const SUGGERIMENTI_MOSSA = [
  "Carico un fendente con tutta la forza",
  "Lancio una bottiglia incendiaria",
  "Mi riparo dietro uno scudo",
  "Mi curo con una benda e un sorso d'acqua",
];

/** Ogni quanto il browser chiede se c'è del nuovo (più piano se la scheda è nascosta). */
const INTERVALLO_MS = 1500;
const INTERVALLO_NASCOSTA_MS = 6000;

const chiaveCredenziali = (codice: string) => `varco.stanza.${codice}`;

function leggiCredenziali(codice: string): Credenziali | null {
  try {
    const v = localStorage.getItem(chiaveCredenziali(codice));
    return v ? (JSON.parse(v) as Credenziali) : null;
  } catch {
    return null;
  }
}

function salvaCredenziali(codice: string, c: Credenziali | null) {
  try {
    if (c) localStorage.setItem(chiaveCredenziali(codice), JSON.stringify(c));
    else localStorage.removeItem(chiaveCredenziali(codice));
  } catch {
    // senza localStorage si resta nella stanza solo finché la pagina è aperta
  }
}

function descriviTiri(tiri: TiroRegistrato[]) {
  return tiri.map((t) => `${t.scopo} ${t.formula} → [${t.risultati.join(", ")}]`).join(" · ");
}

function ritrattoDi(codice: string, g: GiocatorePubblico | undefined) {
  return g?.haRitratto ? `/api/stanze/${codice}/ritratto/${g.id}` : undefined;
}

/** La partita condivisa: racconto comune, turni, scene di combattimento viste da tutti. */
export function GiocoInStanza({ codice }: { codice: string }) {
  const [stanza, setStanza] = useState<StanzaPubblica | null>(null);
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [io, setIo] = useState<Credenziali | null>(null);
  const [pronto, setPronto] = useState(false);
  const [scene, setScene] = useState<ScenaVoce[]>([]);
  const versione = useRef<number | null>(null);
  const ultimaVoceVista = useRef<number | null>(null);

  /** Nuova versione della stanza: le scene arrivate dopo l'apertura della pagina vanno in coda. */
  const ricevi = useCallback((s: StanzaPubblica, amb?: Ambiente) => {
    versione.current = s.versione;
    if (amb) setAmbiente(amb);
    const ultima = s.racconto.at(-1)?.id ?? 0;
    if (ultimaVoceVista.current !== null) {
      const nuove = s.racconto.filter((v) => v.id > ultimaVoceVista.current! && v.scena).map((v) => v.scena!);
      if (nuove.length > 0) setScene((q) => [...q, ...nuove]);
    }
    ultimaVoceVista.current = Math.max(ultimaVoceVista.current ?? 0, ultima);
    setStanza(s);
  }, []);

  const aggiorna = useCallback(async () => {
    const q = versione.current === null ? "" : `?v=${versione.current}`;
    const res = await fetch(`/api/stanze/${codice}${q}`, { cache: "no-store" });
    const dati = await res.json();
    if (!res.ok) {
      setErrore(dati.errore ?? "Errore");
      return;
    }
    setErrore(null);
    if (!dati.invariata) ricevi(dati.stanza, dati.ambiente);
  }, [codice, ricevi]);

  useEffect(() => {
    setIo(leggiCredenziali(codice));
    setPronto(true);
    let fermo = false;
    let timer: ReturnType<typeof setTimeout>;
    const giro = async () => {
      try {
        await aggiorna();
      } catch {
        // rete assente: si riprova al prossimo giro
      }
      if (!fermo) timer = setTimeout(giro, document.hidden ? INTERVALLO_NASCOSTA_MS : INTERVALLO_MS);
    };
    giro();
    return () => {
      fermo = true;
      clearTimeout(timer);
    };
  }, [aggiorna, codice]);

  /** Manda un'azione al server e mostra subito la stanza aggiornata. */
  const invia = useCallback(
    async (corpo: Record<string, unknown>) => {
      if (!io) return;
      const res = await fetch(`/api/stanze/${codice}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...corpo, id: io.id, segreto: io.segreto }),
      });
      const dati = await res.json();
      if (!res.ok) throw new Error(dati.errore ?? "Errore");
      ricevi(dati.stanza, dati.ambiente);
    },
    [codice, io, ricevi],
  );

  if (!pronto || (!stanza && !errore)) return <main className="contenitore tenue">Apertura del varco...</main>;
  if (!stanza) {
    return (
      <main className="contenitore">
        <p className="piccolo"><Link href="/stanza">← stanze</Link></p>
        <h1>Stanza {codice}</h1>
        <p style={{ color: "var(--pericolo)" }}>{errore}</p>
      </main>
    );
  }

  const me = io ? stanza.giocatori.find((g) => g.id === io.id) : undefined;
  if (io && !me && pronto) {
    // le credenziali salvate non valgono più (stanza ricreata o giocatore uscito)
    salvaCredenziali(codice, null);
  }

  return (
    <main className="contenitore" style={{ maxWidth: 980 }}>
      <Intestazione stanza={stanza} ambiente={ambiente} />
      {errore && <p className="piccolo" style={{ color: "var(--pericolo)" }}>{errore}</p>}
      {me ? (
        <Partita stanza={stanza} me={me} invia={invia} onEsci={() => { salvaCredenziali(codice, null); setIo(null); }} />
      ) : (
        <Ingresso
          stanza={stanza}
          onEntrato={(cred, s, amb) => {
            salvaCredenziali(codice, cred);
            setIo(cred);
            ricevi(s, amb);
          }}
        />
      )}
      {scene[0] && <ScenaInCoda key={`${scene[0].copione.seme}-${scene.length}`} stanza={stanza} scena={scene[0]} onFine={() => setScene((q) => q.slice(1))} />}
    </main>
  );
}

// ———————————————————————————— intestazione e invito ————————————————————————————

function Intestazione({ stanza, ambiente }: { stanza: StanzaPubblica; ambiente: Ambiente | null }) {
  const [copiato, setCopiato] = useState(false);
  const u = UNIVERSI[stanza.universo];
  async function copia() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    } catch {
      prompt("Copia questo link e mandalo alla squadra:", window.location.href);
    }
  }
  return (
    <header style={{ display: "grid", gap: 6, marginBottom: 16 }}>
      <p className="piccolo" style={{ margin: 0 }}><Link href="/">← VARCO</Link> · <Link href="/stanza">stanze</Link></p>
      <div className="riga" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>{u.nome}</h1>
        <div className="riga">
          <span className="etichetta" title="Codice della stanza">{stanza.codice}</span>
          <button className="secondario piccolo" style={{ padding: "4px 12px" }} onClick={copia}>{copiato ? "Link copiato ✓" : "Copia il link d'invito"}</button>
        </div>
      </div>
      <p className="tenue piccolo" style={{ margin: 0 }}>
        {u.sottotitolo} · {stanza.giocatori.length}/4 giocatori
        {ambiente?.gm === "demo" && " · GM in modalità demo (senza chiave di Claude racconta a parole chiave)"}
      </p>
      {ambiente && !ambiente.archivioAffidabile && (
        <p className="piccolo" style={{ color: "var(--pericolo)", margin: 0 }}>
          Manca il database: online le stanze possono sparire. Va collegato Supabase (vedi docs/pubblicare.md).
        </p>
      )}
    </header>
  );
}

// ———————————————————————————— ingresso ————————————————————————————

interface Candidato {
  chiave: string;
  essenza: Essenza;
  immagine?: string;
  sotto: string;
  presentazione?: string;
}

function Ingresso({ stanza, onEntrato }: { stanza: StanzaPubblica; onEntrato: (c: Credenziali, s: StanzaPubblica, a: Ambiente) => void }) {
  const [mio, setMio] = useState<Giocatore | null>(null);
  const [scelto, setScelto] = useState<string>("");
  const [inAttesa, setInAttesa] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    const g = caricaGiocatore();
    setMio(g);
    setScelto(g ? "mio" : EROI.find((e) => e.universo === stanza.universo)?.id ?? EROI[0].id);
  }, [stanza.universo]);

  const candidati: Candidato[] = [
    ...(mio ? [{ chiave: "mio", essenza: mio.essenza, immagine: mio.immagine, sotto: "sei tu", presentazione: mio.motivazione }] : []),
    ...EROI.map((e) => ({ chiave: e.id, essenza: e.essenza, immagine: e.immagine, sotto: `${e.classe} · d'esempio`, presentazione: e.descrizione })),
  ];
  const scelta = candidati.find((c) => c.chiave === scelto);
  const piena = stanza.giocatori.length >= 4;

  async function entra() {
    if (!scelta) return;
    setInAttesa(true);
    setErrore(null);
    try {
      const res = await fetch(`/api/stanze/${stanza.codice}/entra`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essenza: scelta.essenza,
          presentazione: scelta.presentazione?.slice(0, 400),
          immagine: scelta.immagine?.startsWith("data:image/") ? scelta.immagine : undefined,
        }),
      });
      const dati = await res.json();
      if (!res.ok) throw new Error(dati.errore ?? "Errore");
      onEntrato(dati.io, dati.stanza, dati.ambiente);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore");
      setInAttesa(false);
    }
  }

  const arena = arenaDi(stanza.universo).id;
  return (
    <section style={{ display: "grid", gap: 16 }}>
      {stanza.giocatori.length > 0 && (
        <p className="tenue" style={{ margin: 0 }}>Già dentro: {stanza.giocatori.map((g) => g.essenza.nome).join(", ")}.</p>
      )}
      <div className="pannello" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Con chi entri?</h2>
        {!mio && (
          <p className="tenue piccolo" style={{ margin: 0 }}>
            Non hai ancora un personaggio tuo. <Link href={`/crea?ritorno=/stanza/${stanza.codice}`}>Raccontati in &quot;Chi sei?&quot;</Link> e torna qui, oppure prendi un eroe d&apos;esempio.
          </p>
        )}
        <div className="griglia-carte" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
          {candidati.map((c) => (
            <button
              key={c.chiave}
              className={`carta scelta ${scelto === c.chiave ? "selezionata" : ""}`}
              onClick={() => setScelto(c.chiave)}
              style={{ padding: 0, background: "var(--pannello)", color: "inherit", textAlign: "left" }}
            >
              <div className="carta-figura"><CartaPersonaggio essenza={c.essenza} immagine={c.immagine} arena={arena} /></div>
              <div className="carta-testo"><strong className="piccolo">{c.essenza.nome}</strong><span className="tenue piccolo">{c.sotto}</span></div>
            </button>
          ))}
        </div>
        <div className="riga">
          <button onClick={entra} disabled={inAttesa || !scelta || piena}>
            {piena ? "Stanza piena" : inAttesa ? "Attraverso il varco..." : `Entra come ${scelta?.essenza.nome ?? "..."}`}
          </button>
        </div>
        {errore && <p className="piccolo" style={{ color: "var(--pericolo)", margin: 0 }}>{errore}</p>}
      </div>
      <Racconto stanza={stanza} />
    </section>
  );
}

// ———————————————————————————— partita ————————————————————————————

function Partita({
  stanza,
  me,
  invia,
  onEsci,
}: {
  stanza: StanzaPubblica;
  me: GiocatorePubblico;
  invia: (corpo: Record<string, unknown>) => Promise<void>;
  onEsci: () => void;
}) {
  const [testo, setTesto] = useState("");
  const [inAttesa, setInAttesa] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const c = stanza.combattimento;
  const diTurno = stanza.fase === "combattimento" && c ? c.ordine[c.indice] : null;
  const mioTurno = diTurno === me.id;
  const inCampo = Boolean(c?.eroi[me.id]);
  const hoScritto = me.id in stanza.azioni;
  const mancano = stanza.giocatori.filter((g) => !(g.id in stanza.azioni));
  const gmAlLavoro = Boolean(stanza.gmAlLavoroDal);
  const nomeDi = (id: string) => stanza.giocatori.find((g) => g.id === id)?.essenza.nome ?? "qualcuno";

  async function esegui(corpo: Record<string, unknown>, svuota = false) {
    setInAttesa(true);
    setErrore(null);
    try {
      await invia(corpo);
      if (svuota) setTesto("");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore");
    } finally {
      setInAttesa(false);
    }
  }

  function manda(e?: React.FormEvent) {
    e?.preventDefault();
    const frase = testo.trim();
    if (!frase || inAttesa) return;
    esegui({ tipo: stanza.fase === "combattimento" ? "mossa" : "azione", testo: frase }, true);
  }

  const puoScrivere = stanza.fase === "esplorazione" ? !gmAlLavoro : mioTurno;
  const segnaposto =
    stanza.fase === "combattimento"
      ? mioTurno
        ? "La tua mossa: descrivi come attacchi, ti difendi o ti curi..."
        : inCampo
          ? `Tocca a ${nomeDi(diTurno!)}...`
          : "Entri in campo dal prossimo scontro."
      : gmAlLavoro
        ? "Il GM sta scrivendo..."
        : hoScritto
          ? "Hai già scritto: puoi cambiare idea finché il GM non risponde."
          : "Cosa fai? Scrivi la tua azione...";

  return (
    <div className="griglia-stanza">
      <aside style={{ display: "grid", gap: 10, alignContent: "start" }}>
        <Squadra stanza={stanza} me={me} />
        <button className="secondario piccolo" style={{ justifySelf: "start", padding: "4px 12px" }} onClick={() => confirm("Vuoi lasciare la stanza?") && esegui({ tipo: "esci" }).then(onEsci)}>
          Lascia la stanza
        </button>
      </aside>

      <section style={{ display: "grid", gap: 12, alignContent: "start" }}>
        {c && <Nemico stanza={stanza} />}
        <Racconto stanza={stanza} />

        <form onSubmit={manda} className="pannello" style={{ display: "grid", gap: 8 }}>
          <StatoGiro stanza={stanza} me={me} mancano={mancano.map((g) => g.essenza.nome)} gmAlLavoro={gmAlLavoro} diTurno={diTurno} nomeDi={nomeDi} />
          <textarea
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) manda(e);
            }}
            placeholder={segnaposto}
            style={{ minHeight: 70 }}
            disabled={!puoScrivere || inAttesa}
            maxLength={stanza.fase === "combattimento" ? 500 : 600}
          />
          <div className="riga">
            <button type="submit" disabled={!puoScrivere || inAttesa || !testo.trim()}>
              {inAttesa ? "..." : stanza.fase === "combattimento" ? "Agisci ⚔" : hoScritto ? "Cambia azione" : "Scrivi"}
            </button>
            {stanza.fase === "esplorazione" && Object.keys(stanza.azioni).length > 0 && mancano.length > 0 && !gmAlLavoro && (
              <button type="button" className="secondario" disabled={inAttesa} onClick={() => esegui({ tipo: "sollecita" })}>
                Fai rispondere il GM senza aspettare
              </button>
            )}
            {stanza.fase === "combattimento" && diTurno && !mioTurno && (
              <button type="button" className="secondario piccolo" disabled={inAttesa} onClick={() => esegui({ tipo: "salta", diChi: diTurno })}>
                Salta il turno di {nomeDi(diTurno)}
              </button>
            )}
          </div>
          {mioTurno && (
            <div className="riga">
              {SUGGERIMENTI_MOSSA.map((s) => (
                <button key={s} type="button" className="secondario piccolo" style={{ padding: "4px 10px" }} onClick={() => setTesto(s)} disabled={inAttesa}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {errore && <p className="piccolo" style={{ color: "var(--pericolo)", margin: 0 }}>{errore}</p>}
        </form>
      </section>
    </div>
  );
}

function StatoGiro({
  stanza,
  me,
  mancano,
  gmAlLavoro,
  diTurno,
  nomeDi,
}: {
  stanza: StanzaPubblica;
  me: GiocatorePubblico;
  mancano: string[];
  gmAlLavoro: boolean;
  diTurno: string | null;
  nomeDi: (id: string) => string;
}) {
  let testo: string;
  if (stanza.fase === "combattimento") testo = diTurno === me.id ? "⚔ Tocca a te!" : `⚔ Tocca a ${nomeDi(diTurno ?? "")}.`;
  else if (gmAlLavoro) testo = "Il GM sta scrivendo...";
  else if (mancano.length === 0) testo = "Tutti hanno scritto.";
  else testo = `Il GM risponde quando avete scritto tutti. Mancano: ${mancano.join(", ")}.`;
  return <p className="piccolo tenue" style={{ margin: 0 }}>{testo}</p>;
}

function BarrePv({ c }: { c: Combattente }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div className="barra pv"><span style={{ width: `${(c.pv / c.pvMax) * 100}%` }} /></div>
      <div className="barra"><span style={{ width: `${(c.energia / Math.max(1, c.energiaMax)) * 100}%` }} /></div>
      <span className="piccolo tenue">PV {c.pv}/{c.pvMax} · EN {c.energia}{c.stati.length > 0 ? ` · ${c.stati.map((s) => s.replace("_", " ")).join(", ")}` : ""}</span>
    </div>
  );
}

function Squadra({ stanza, me }: { stanza: StanzaPubblica; me: GiocatorePubblico }) {
  const arena = arenaDi(stanza.universo).id;
  const c = stanza.combattimento;
  return (
    <>
      {stanza.giocatori.map((g) => {
        const combattente = c?.eroi[g.id];
        const diTurno = c && c.ordine[c.indice] === g.id;
        return (
          <div key={g.id} className="pannello" style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 10, padding: 8, borderColor: diTurno ? "var(--accento)" : undefined }}>
            <div style={{ aspectRatio: "620 / 785", borderRadius: 6, overflow: "hidden", background: "#000" }}>
              <CartaPersonaggio essenza={g.essenza} immagine={ritrattoDi(stanza.codice, g)} arena={arena} />
            </div>
            <div style={{ display: "grid", gap: 4, alignContent: "start" }}>
              <strong className="piccolo">{g.essenza.nome}{g.id === me.id ? " (tu)" : ""}</strong>
              {combattente ? (
                <BarrePv c={combattente} />
              ) : (
                <span className="piccolo tenue">{stanza.fase === "esplorazione" ? (g.id in stanza.azioni ? "ha scritto ✓" : "sta pensando...") : "in attesa del prossimo scontro"}</span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Nemico({ stanza }: { stanza: StanzaPubblica }) {
  const c = stanza.combattimento!;
  const scheda = trovaNemico(c.nemicoId);
  if (!scheda) return null;
  return (
    <div className="pannello" style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 10, padding: 8, borderColor: "var(--pericolo)" }}>
      <div style={{ aspectRatio: "620 / 785", borderRadius: 6, overflow: "hidden", background: "#000" }}>
        <CartaPersonaggio essenza={scheda.essenza} immagine={scheda.immagine} arena={arenaDi(stanza.universo).id} />
      </div>
      <div style={{ display: "grid", gap: 4, alignContent: "start" }}>
        <strong>{scheda.essenza.nome} <span className={`etichetta rango-${scheda.rango}`}>{scheda.rango}</span></strong>
        <BarrePv c={c.nemico} />
      </div>
    </div>
  );
}

function Racconto({ stanza }: { stanza: StanzaPubblica }) {
  const fine = useRef<HTMLDivElement>(null);
  const ultima = stanza.racconto.at(-1)?.id;
  useEffect(() => {
    fine.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [ultima]);
  const nomeDi = (v: Voce) => stanza.giocatori.find((g) => g.id === v.autore)?.essenza.nome ?? "Qualcuno";
  return (
    <div className="diario racconto-stanza" aria-live="polite">
      {stanza.racconto.map((v) => (
        <div key={v.id} className={`voce ${v.tipo}`}>
          {v.tipo === "giocatore" && <span className="piccolo tenue">{nomeDi(v)}: </span>}
          {v.testo}
          {v.tiri && v.tiri.length > 0 && <div className="tiri">🎲 {descriviTiri(v.tiri)}</div>}
        </div>
      ))}
      <div ref={fine} />
    </div>
  );
}

// ———————————————————————————— scena clou ————————————————————————————

function ScenaInCoda({ stanza, scena, onFine }: { stanza: StanzaPubblica; scena: ScenaVoce; onFine: () => void }) {
  const [didascalia, setDidascalia] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDidascalia(true), 900);
    return () => clearTimeout(t);
  }, []);
  const g = stanza.giocatori.find((x) => x.id === scena.eroe);
  const scheda = trovaNemico(scena.nemico);
  useEffect(() => {
    // il giocatore è uscito nel frattempo: niente scena
    if (!g || !scheda) onFine();
  }, [g, scheda, onFine]);
  if (!g || !scheda) return null;
  const arena = arenaDi(stanza.universo);
  return (
    <div className="scena-clou" role="dialog" aria-label="Scena di combattimento">
      <ScenaCartoncini
        sinistra={{ id: g.id, essenza: g.essenza, immagine: ritrattoDi(stanza.codice, g) }}
        destra={{ id: "nemico", essenza: scheda.essenza, immagine: scheda.immagine }}
        copione={scena.copione}
        immagineSfondo={arena.immagine}
        onFine={onFine}
      />
      <span className="marchio">VARCO</span>
      <button className="salta secondario" onClick={onFine}>Salta ⏭</button>
      {didascalia && <div className="didascalia">{scena.copione.didascalia}</div>}
    </div>
  );
}
