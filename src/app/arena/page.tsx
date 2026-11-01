"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CartaPersonaggio } from "@/components/scena/CartaPersonaggio";
import { EROI, NEMICI, UNIVERSI, arenaDi, combattenteDa, trovaEroe, trovaNemico, type SchedaNemico } from "@/data";
import type { Essenza } from "@/lib/personaggio/essenza";
import { caricaPersonaggio } from "@/lib/personaggio/salvataggio";
import type { Combattente, Copione, Mossa, TiroRegistrato } from "@/lib/rules/types";

const ScenaCartoncini = dynamic(() => import("@/components/scena/ScenaCartoncini"), { ssr: false });

const SUGGERIMENTI_GENERICI = [
  "Carico un fendente con tutta la forza",
  "Lancio una bottiglia incendiaria",
  "Evoco uno sciame di rottami che gli piove addosso",
  "Mi riparo dietro uno scudo",
  "Mi curo con una benda e un sorso d'acqua",
];

interface Voce {
  tipo: "giocatore" | "gm" | "nemico" | "sistema";
  testo: string;
  tiri?: TiroRegistrato[];
}

interface Eroe {
  id: string;
  essenza: Essenza;
  immagine?: string;
  suggerimenti: string[];
}

interface ScenaInCorso {
  copione: Copione;
  attore: Combattente;
  bersaglio: Combattente;
  diNemico: boolean;
}

function descriviTiri(tiri: TiroRegistrato[]) {
  return tiri.map((t) => `${t.scopo} ${t.formula} → [${t.risultati.join(", ")}]`).join(" · ");
}

export default function Arena() {
  const [mio, setMio] = useState<Essenza | null>(null);
  const [eroeId, setEroeId] = useState<string>("mio");
  const [nemicoId, setNemicoId] = useState<string>("grosso_bruno");
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    setMio(caricaPersonaggio());
    const q = new URLSearchParams(window.location.search);
    const e = q.get("eroe");
    const n = q.get("nemico");
    if (e && trovaEroe(e)) setEroeId(e);
    if (n && trovaNemico(n)) setNemicoId(n);
    else if (e && trovaEroe(e)) setNemicoId(NEMICI.find((x) => x.universo === trovaEroe(e)!.universo)!.id);
  }, []);

  if (!mio) return <main className="contenitore tenue">Apertura del varco...</main>;

  const scheda = trovaEroe(eroeId);
  const eroe: Eroe = scheda
    ? { id: scheda.id, essenza: scheda.essenza, immagine: scheda.immagine, suggerimenti: [...scheda.mosseFirma.map((m) => m.frase), ...SUGGERIMENTI_GENERICI.slice(3)] }
    : { id: "mio", essenza: mio, suggerimenti: SUGGERIMENTI_GENERICI };
  const nemico = trovaNemico(nemicoId)!;

  if (inCorso) return <Combattimento eroe={eroe} nemico={nemico} onEsci={() => setInCorso(false)} />;

  const arena = arenaDi(nemico.universo);
  return (
    <main className="contenitore">
      <p className="piccolo"><Link href="/">← VARCO</Link> · <Link href="/galleria">galleria</Link></p>
      <h1>Arena</h1>
      <p className="tenue">Scegli chi combatte e contro chi. Il luogo dipende dall&apos;universo del nemico.</p>

      <h2 style={{ marginTop: 20 }}>Il tuo eroe</h2>
      <div className="griglia-carte" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
        {[{ id: "mio", essenza: mio, sotto: "il tuo personaggio" }, ...EROI.map((e) => ({ id: e.id, essenza: e.essenza, sotto: e.classe, immagine: e.immagine }))].map((e) => (
          <button key={e.id} className={`carta scelta ${eroeId === e.id ? "selezionata" : ""}`} onClick={() => setEroeId(e.id)} style={{ padding: 0, background: "var(--pannello)", color: "inherit", textAlign: "left" }}>
            <div className="carta-figura"><CartaPersonaggio essenza={e.essenza} immagine={"immagine" in e ? e.immagine : undefined} arena={arena.id} /></div>
            <div className="carta-testo"><strong className="piccolo">{e.essenza.nome}</strong><span className="tenue piccolo">{e.sotto}</span></div>
          </button>
        ))}
      </div>

      <h2 style={{ marginTop: 24 }}>Il nemico</h2>
      {Object.values(UNIVERSI).map((u) => (
        <div key={u.id} style={{ marginBottom: 12 }}>
          <p className="piccolo tenue" style={{ margin: "4px 0" }}>{u.nome} · {u.sottotitolo}</p>
          <div className="riga">
            {NEMICI.filter((n) => n.universo === u.id).map((n) => (
              <button key={n.id} className={nemicoId === n.id ? "" : "secondario"} onClick={() => setNemicoId(n.id)}>
                {n.essenza.nome} <span className="piccolo" style={{ opacity: 0.7 }}>· {n.rango}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="pannello riga" style={{ marginTop: 20, justifyContent: "space-between" }}>
        <span><strong>{eroe.essenza.nome}</strong> contro <strong>{nemico.essenza.nome}</strong> · {arena.nome}</span>
        <button onClick={() => setInCorso(true)}>Entra nel varco ⚔</button>
      </div>
    </main>
  );
}

function Combattimento({ eroe, nemico: schedaNemico, onEsci }: { eroe: Eroe; nemico: SchedaNemico; onEsci: () => void }) {
  const arena = arenaDi(schedaNemico.universo);
  const nuovoGiocatore = useCallback(() => combattenteDa("giocatore", eroe.essenza), [eroe.essenza]);
  const nuovoNemico = useCallback(() => combattenteDa("nemico", schedaNemico.essenza, schedaNemico.pvBonus), [schedaNemico]);
  const introduzione = useCallback(
    (): Voce[] => [{ tipo: "gm", testo: `${arena.descrizione} ${schedaNemico.ingresso} Cosa fai?` }],
    [arena.descrizione, schedaNemico.ingresso],
  );

  const [giocatore, setGiocatore] = useState<Combattente>(nuovoGiocatore);
  const [nemico, setNemico] = useState<Combattente>(nuovoNemico);
  const [diario, setDiario] = useState<Voce[]>(introduzione);
  const [testo, setTesto] = useState("");
  const [inAttesa, setInAttesa] = useState(false);
  const [scena, setScena] = useState<ScenaInCorso | null>(null);
  const [didascaliaVisibile, setDidascaliaVisibile] = useState(false);
  const partita = useRef(`arena-${Date.now().toString(36)}`);
  const turno = useRef(0);
  const turnoNemico = useRef(0);
  const fineDiario = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fineDiario.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [diario]);

  const finita = giocatore.pv === 0 || nemico.pv === 0;

  async function turnoDi(attore: Combattente, bersaglio: Combattente, corpo: { testo?: string; mossa?: Mossa }, diNemico: boolean) {
    const res = await fetch("/api/mossa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partita: partita.current, turno: turno.current++, arena: arena.id, attore, bersaglio, ...corpo }),
    });
    const dati = await res.json();
    if (!res.ok) throw new Error(dati.errore ?? "Errore del server");
    setDidascaliaVisibile(false);
    setTimeout(() => setDidascaliaVisibile(true), 900);
    setScena({ copione: dati.copione, attore: dati.attore, bersaglio: dati.bersaglio, diNemico });
  }

  async function agisci(e?: React.FormEvent) {
    e?.preventDefault();
    if (!testo.trim() || inAttesa || finita) return;
    const frase = testo.trim();
    setTesto("");
    setInAttesa(true);
    setDiario((d) => [...d, { tipo: "giocatore", testo: frase }]);
    try {
      await turnoDi(giocatore, nemico, { testo: frase }, false);
    } catch (err) {
      setDiario((d) => [...d, { tipo: "sistema", testo: err instanceof Error ? err.message : "Errore" }]);
      setInAttesa(false);
    }
  }

  /** Fine della scena: si applicano i risultati, si torna al testo, poi tocca al nemico. */
  function fineScena() {
    if (!scena) return;
    const { copione, attore, bersaglio, diNemico } = scena;
    const g = diNemico ? bersaglio : attore;
    const n = diNemico ? attore : bersaglio;
    setGiocatore(g);
    setNemico(n);
    setScena(null);
    setDiario((d) => [...d, { tipo: diNemico ? "nemico" : "gm", testo: copione.didascalia, tiri: copione.tiri }]);

    if (copione.ko) {
      setDiario((d) => [...d, { tipo: "sistema", testo: diNemico ? `${g.nome} è a terra. Il varco si richiude... per ora.` : `${n.nome} crolla. Vittoria!` }]);
      setInAttesa(false);
      return;
    }
    if (!diNemico) {
      const { nome, archetipo, elemento, intensita } = schedaNemico.mosse[turnoNemico.current++ % schedaNemico.mosse.length];
      setTimeout(() => {
        turnoDi(n, g, { mossa: { nome, archetipo, elemento, intensita } }, true).catch((err) => {
          setDiario((d) => [...d, { tipo: "sistema", testo: err instanceof Error ? err.message : "Errore" }]);
          setInAttesa(false);
        });
      }, 1000);
    } else {
      setInAttesa(false);
    }
  }

  function rigioca() {
    setGiocatore(nuovoGiocatore());
    setNemico(nuovoNemico());
    setDiario([{ tipo: "gm", testo: `${schedaNemico.essenza.nome} si rialza. "Secondo round."` }]);
    partita.current = `arena-${Date.now().toString(36)}`;
    turno.current = 0;
    turnoNemico.current = 0;
  }

  return (
    <main className="contenitore" style={{ maxWidth: 760 }}>
      <p className="piccolo"><button className="secondario piccolo" style={{ padding: "2px 10px" }} onClick={onEsci}>← cambia sfida</button></p>
      <h1>{arena.nome}</h1>
      <p className="tenue piccolo">{UNIVERSI[schedaNemico.universo].sottotitolo} · scrivi la tua mossa: il codice tira i dadi, poi parte la scena.</p>

      <div className="griglia-2" style={{ margin: "16px 0" }}>
        {[giocatore, nemico].map((c) => (
          <div key={c.id} className="pannello" style={{ display: "grid", gap: 6 }}>
            <div className="riga" style={{ justifyContent: "space-between" }}>
              <strong>{c.nome}</strong>
              <span className="piccolo tenue">PV {c.pv}/{c.pvMax} · EN {c.energia}</span>
            </div>
            <div className="barra pv"><span style={{ width: `${(c.pv / c.pvMax) * 100}%` }} /></div>
            <div className="barra"><span style={{ width: `${(c.energia / c.energiaMax) * 100}%` }} /></div>
            {c.stati.length > 0 && <div className="riga">{c.stati.map((s) => <span key={s} className="etichetta">{s.replace("_", " ")}</span>)}</div>}
          </div>
        ))}
      </div>

      <div className="diario" aria-live="polite">
        {diario.map((v, i) => (
          <div key={i} className={`voce ${v.tipo}`}>
            {v.tipo === "giocatore" && <span className="piccolo tenue">{giocatore.nome}: </span>}
            {v.testo}
            {v.tiri && v.tiri.length > 0 && <div className="tiri">🎲 {descriviTiri(v.tiri)}</div>}
          </div>
        ))}
        <div ref={fineDiario} />
      </div>

      {finita ? (
        <div className="riga" style={{ marginTop: 16 }}>
          <button onClick={rigioca}>Rigioca</button>
          <button className="secondario" onClick={onEsci}>Cambia sfida</button>
        </div>
      ) : (
        <form onSubmit={agisci} style={{ display: "grid", gap: 8, marginTop: 16 }}>
          <textarea
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) agisci(e);
            }}
            placeholder="Scrivi cosa fai..."
            style={{ minHeight: 70 }}
            disabled={inAttesa}
            maxLength={500}
          />
          <div className="riga">
            <button type="submit" disabled={inAttesa || !testo.trim()}>{inAttesa ? "Turno in corso..." : "Agisci"}</button>
          </div>
          <div className="riga">
            {eroe.suggerimenti.map((s) => (
              <button key={s} type="button" className="secondario piccolo" style={{ padding: "4px 10px" }} onClick={() => setTesto(s)} disabled={inAttesa}>
                {s}
              </button>
            ))}
          </div>
        </form>
      )}

      {scena && (
        <div className="scena-clou" role="dialog" aria-label="Scena di combattimento">
          <ScenaCartoncini
            key={scena.copione.seme}
            sinistra={{ id: "giocatore", essenza: eroe.essenza, immagine: eroe.immagine, ko: giocatore.pv === 0 }}
            destra={{ id: "nemico", essenza: schedaNemico.essenza, immagine: schedaNemico.immagine, ko: nemico.pv === 0 }}
            copione={scena.copione}
            immagineSfondo={arena.immagine}
            onFine={fineScena}
          />
          <span className="marchio">VARCO</span>
          <button className="salta secondario" onClick={fineScena}>Salta ⏭</button>
          {didascaliaVisibile && <div className="didascalia">{scena.copione.didascalia}</div>}
        </div>
      )}
    </main>
  );
}
