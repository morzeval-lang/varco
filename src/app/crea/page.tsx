"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartaPersonaggio } from "@/components/scena/CartaPersonaggio";
import { EROI, UNIVERSI, arenaDi, type IdUniverso } from "@/data";
import type { Essenza } from "@/lib/personaggio/essenza";
import { caricaPersonaggio, DESCRIZIONE_ESEMPIO, salvaPersonaggio } from "@/lib/personaggio/salvataggio";

const ETICHETTE_STAT = { forza: "Forza", agilita: "Agilità", mente: "Mente", tempra: "Tempra" } as const;

/** Spunti per chi non sa da dove partire: stereotipi classici da personalizzare. */
const SPUNTI = [
  "Un paladino anziano e burbero, con un'armatura dorata ammaccata e uno scudo con un leone, che cura i compagni con la luce.",
  "Una ladra elfica esile con un cappuccio verde, capelli lunghi argentati e due pugnali, ironica e velocissima.",
  "Un mago giovane e goffo con un bastone di cristallo azzurro, mantello blu stellato e occhi che brillano quando lancia incantesimi.",
  "Un'ex meccanica gigante e robusta, con un braccio meccanico che spara chiodi, capelli a cresta rosa e una tuta arancione.",
  "Un cacciatore di mutanti con un fucile, un occhio cibernetico rosso, cicatrice sul volto e un cappotto marrone logoro.",
];

export default function CreaPersonaggio() {
  const [descrizione, setDescrizione] = useState(DESCRIZIONE_ESEMPIO);
  const [essenza, setEssenza] = useState<Essenza | null>(null);
  const [fonte, setFonte] = useState<"claude" | "demo" | "catalogo" | null>(null);
  const [universo, setUniverso] = useState<IdUniverso>("post_apocalisse");
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => setEssenza(caricaPersonaggio()), []);

  async function genera() {
    setCaricamento(true);
    setErrore(null);
    try {
      const res = await fetch("/api/personaggio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descrizione }),
      });
      const dati = await res.json();
      if (!res.ok) throw new Error(dati.errore ?? "Errore");
      setEssenza(dati.essenza);
      setFonte(dati.fonte);
      salvaPersonaggio(dati.essenza);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore sconosciuto");
    } finally {
      setCaricamento(false);
    }
  }

  function scegliEroe(id: string) {
    const eroe = EROI.find((e) => e.id === id);
    if (!eroe) return;
    setEssenza(eroe.essenza);
    setDescrizione(eroe.descrizione);
    setUniverso(eroe.universo);
    setFonte("catalogo");
    salvaPersonaggio(eroe.essenza);
  }

  const arena = arenaDi(universo);

  return (
    <main className="contenitore">
      <p className="piccolo"><Link href="/">← VARCO</Link></p>
      <h1>Crea il tuo personaggio</h1>
      <p className="tenue">Descrivilo come vuoi: aspetto, segni particolari, arma, carattere. Oppure parti da un eroe pronto.</p>

      <div className="griglia-2" style={{ marginTop: 16 }}>
        <section className="pannello" style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} maxLength={1500} aria-label="Descrizione del personaggio" />
          <div className="riga">
            <button onClick={genera} disabled={caricamento || descrizione.trim().length < 3}>
              {caricamento ? "Il varco si apre..." : "Genera personaggio"}
            </button>
            {fonte && <span className="etichetta">{fonte === "claude" ? "creato da Claude" : fonte === "catalogo" ? "eroe pronto" : "modalità demo"}</span>}
          </div>
          {errore && <p style={{ color: "var(--pericolo)" }}>{errore}</p>}
          <div className="riga">
            <span className="piccolo tenue">Spunti:</span>
            {SPUNTI.map((s, i) => (
              <button key={i} className="secondario piccolo" style={{ padding: "4px 10px" }} onClick={() => setDescrizione(s)}>
                {s.split(",")[0]}
              </button>
            ))}
          </div>

          {essenza && (
            <div style={{ display: "grid", gap: 10, borderTop: "1px solid var(--bordo)", paddingTop: 12 }}>
              <div>
                <h2 style={{ marginBottom: 4 }}>{essenza.nome}</h2>
                <p className="tenue" style={{ margin: 0 }}>{essenza.concetto}</p>
              </div>
              <div className="riga">
                <span className="etichetta">{essenza.corporatura}</span>
                <span className="etichetta">arma: {essenza.arma.descrizione || essenza.arma.tipo}</span>
                {essenza.segnoDistintivo.tipo !== "nessuno" && <span className="etichetta">{essenza.segnoDistintivo.descrizione}</span>}
                {essenza.tratti.map((t) => <span key={t} className="etichetta">{t}</span>)}
              </div>
              {(Object.keys(ETICHETTE_STAT) as (keyof typeof ETICHETTE_STAT)[]).map((k) => (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "72px 1fr 28px", gap: 8, alignItems: "center" }}>
                  <span className="piccolo">{ETICHETTE_STAT[k]}</span>
                  <div className="barra"><span style={{ width: `${(essenza.statistiche[k] / 16) * 100}%` }} /></div>
                  <span className="piccolo">{essenza.statistiche[k]}</span>
                </div>
              ))}
              <Link href="/arena"><button className="secondario">Porta {essenza.nome} in arena →</button></Link>
            </div>
          )}
        </section>

        <section className="pannello" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateRows: "auto 1fr" }}>
          <div className="riga" style={{ padding: 12, borderBottom: "1px solid var(--bordo)" }}>
            <span className="piccolo tenue">Forma in:</span>
            {Object.values(UNIVERSI).map((u) => (
              <button key={u.id} className={u.id === universo ? "" : "secondario"} style={{ padding: "4px 10px" }} onClick={() => setUniverso(u.id)}>
                {u.sottotitolo}
              </button>
            ))}
          </div>
          <div style={{ aspectRatio: "620 / 785", background: "#000" }}>
            {essenza && <CartaPersonaggio essenza={essenza} arena={arena.id} immagineSfondo={arena.immagine} />}
          </div>
        </section>
      </div>

      <h2 style={{ marginTop: 32 }}>Oppure scegli un eroe pronto</h2>
      <div className="riga">
        {EROI.map((e) => (
          <button key={e.id} className="secondario" onClick={() => scegliEroe(e.id)}>
            {e.essenza.nome} <span className="tenue piccolo">· {e.classe}</span>
          </button>
        ))}
      </div>
      <p className="tenue piccolo" style={{ marginTop: 16 }}>
        La figura è un segnaposto disegnato dal codice. Le illustrazioni anime definitive si aggiungono in
        <code> public/immagini</code> (vedi <code>docs/stile-grafico.md</code>).
      </p>
    </main>
  );
}
