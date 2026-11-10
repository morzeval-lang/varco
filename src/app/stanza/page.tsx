"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UNIVERSI, type IdUniverso } from "@/data";

/** Crea una stanza (e ottieni il link da mandare agli amici) oppure entra con un codice. */
export default function NuovaStanza() {
  const router = useRouter();
  const [universo, setUniverso] = useState<IdUniverso>("fantasy_medievale");
  const [codice, setCodice] = useState("");
  const [inAttesa, setInAttesa] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function crea() {
    setInAttesa(true);
    setErrore(null);
    try {
      const res = await fetch("/api/stanze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ universo }) });
      const dati = await res.json();
      if (!res.ok) throw new Error(dati.errore ?? "Errore");
      router.push(`/stanza/${dati.stanza.codice}`);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore");
      setInAttesa(false);
    }
  }

  return (
    <main className="contenitore" style={{ maxWidth: 760 }}>
      <p className="piccolo"><Link href="/">← VARCO</Link></p>
      <h1>Gioca con gli amici</h1>
      <p className="tenue">Crea una stanza, manda il link alla squadra (fino a 4 giocatori) ed entrate ognuno col suo personaggio.</p>

      <section className="pannello" style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <h2 style={{ margin: 0 }}>Nuova stanza</h2>
        <div className="riga">
          {Object.values(UNIVERSI).map((u) => (
            <button key={u.id} className={universo === u.id ? "" : "secondario"} onClick={() => setUniverso(u.id)}>
              {u.nome} <span className="piccolo" style={{ opacity: 0.7 }}>· {u.sottotitolo}</span>
            </button>
          ))}
        </div>
        <p className="tenue piccolo" style={{ margin: 0 }}>{UNIVERSI[universo].tono}</p>
        <div className="riga">
          <button onClick={crea} disabled={inAttesa}>{inAttesa ? "Apro il varco..." : "Crea la stanza"}</button>
        </div>
        {errore && <p className="piccolo" style={{ color: "var(--pericolo)", margin: 0 }}>{errore}</p>}
      </section>

      <form
        className="pannello"
        style={{ display: "grid", gap: 12, marginTop: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          const c = codice.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
          if (c) router.push(`/stanza/${c}`);
        }}
      >
        <h2 style={{ margin: 0 }}>Hai un codice?</h2>
        <div className="riga">
          <input value={codice} onChange={(e) => setCodice(e.target.value)} placeholder="es. K7M2QX" style={{ maxWidth: 200, textTransform: "uppercase" }} maxLength={12} />
          <button type="submit" className="secondario" disabled={!codice.trim()}>Entra</button>
        </div>
      </form>
    </main>
  );
}
