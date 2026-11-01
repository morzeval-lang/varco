"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Azione } from "@/components/three/Personaggio";
import type { Essenza } from "@/lib/personaggio/essenza";
import { caricaPersonaggio, DESCRIZIONE_ESEMPIO, salvaPersonaggio } from "@/lib/personaggio/salvataggio";

const Piedistallo = dynamic(() => import("@/components/three/Piedistallo"), { ssr: false });

const AZIONI: [Azione, string][] = [
  ["idle", "Riposo"],
  ["attacco", "Attacco"],
  ["lancio", "Lancio"],
  ["difesa", "Difesa"],
  ["colpito", "Colpito"],
  ["vittoria", "Vittoria"],
  ["ko", "KO"],
];

const ETICHETTE_STAT = { forza: "Forza", agilita: "Agilità", mente: "Mente", tempra: "Tempra" } as const;

export default function CreaPersonaggio() {
  const [descrizione, setDescrizione] = useState(DESCRIZIONE_ESEMPIO);
  const [essenza, setEssenza] = useState<Essenza | null>(null);
  const [fonte, setFonte] = useState<"claude" | "demo" | null>(null);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [azione, setAzione] = useState<Azione>("idle");
  const [azioneId, setAzioneId] = useState(0);

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
      prova("vittoria");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore sconosciuto");
    } finally {
      setCaricamento(false);
    }
  }

  function prova(a: Azione) {
    setAzione(a);
    setAzioneId((n) => n + 1);
  }

  return (
    <main className="contenitore">
      <p className="piccolo"><Link href="/">← VARCO</Link></p>
      <h1>Crea il tuo personaggio</h1>
      <p className="tenue">Descrivilo come vuoi: aspetto, segni particolari, arma, carattere.</p>

      <div className="griglia-2" style={{ marginTop: 16 }}>
        <section className="pannello" style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} maxLength={1500} aria-label="Descrizione del personaggio" />
          <div className="riga">
            <button onClick={genera} disabled={caricamento || descrizione.trim().length < 3}>
              {caricamento ? "Il varco si apre..." : "Genera personaggio"}
            </button>
            {fonte && <span className="etichetta">{fonte === "claude" ? "creato da Claude" : "modalità demo"}</span>}
          </div>
          {errore && <p style={{ color: "var(--pericolo)" }}>{errore}</p>}

          {essenza && (
            <div style={{ display: "grid", gap: 10 }}>
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
              <div className="riga" style={{ marginTop: 4 }}>
                <span className="piccolo" style={{ display: "inline-flex", gap: 4 }}>
                  {Object.values(essenza.palette).map((c) => (
                    <span key={c} style={{ width: 16, height: 16, borderRadius: 4, background: c, display: "inline-block" }} />
                  ))}
                </span>
                <Link href="/arena"><button className="secondario">Porta {essenza.nome} in arena →</button></Link>
              </div>
            </div>
          )}
        </section>

        <section className="pannello" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateRows: "1fr auto" }}>
          <div style={{ height: 460 }}>{essenza && <Piedistallo essenza={essenza} azione={azione} azioneId={azioneId} />}</div>
          <div className="riga" style={{ padding: 12, borderTop: "1px solid var(--bordo)" }}>
            {AZIONI.map(([a, label]) => (
              <button key={a} className="secondario" onClick={() => prova(a)} style={{ padding: "6px 10px" }}>{label}</button>
            ))}
          </div>
        </section>
      </div>
      <p className="tenue piccolo" style={{ marginTop: 16 }}>
        Prototipo: il modello è costruito dal kit modulare a partire dall&apos;Essenza. Il modello generato con
        un servizio text-to-3D arriva nel passo successivo della Fase 0.
      </p>
    </main>
  );
}
