"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartaPersonaggio } from "@/components/scena/CartaPersonaggio";
import { UNIVERSI, arenaDi, type IdUniverso } from "@/data";
import type { Giocatore, Identita } from "@/lib/personaggio/giocatore";
import { caricaGiocatore, dimenticaGiocatore, DESCRIZIONE_ESEMPIO, salvaGiocatore } from "@/lib/personaggio/salvataggio";

const ETICHETTE_STAT = { forza: "Forza", agilita: "Agilità", mente: "Mente", tempra: "Tempra" } as const;

/** Spunti per chi non sa da dove partire. */
const SPUNTI = [
  "Sono Brann, fabbro di un villaggio di confine. Le mani grandi e bruciate, la barba rossa, un martello da forgia. Hanno bruciato la mia bottega e voglio sapere chi è stato.",
  "Mi chiamano Vespa. Corro sui tetti delle città in rovina con due coltelli e un occhio cibernetico verde. Rubo ai predoni e rivendo ai predoni.",
  "Sono Iselde, ultima allieva di una torre di maghi crollata. Mantello blu bruciacchiato, bastone di cristallo incrinato. Il mio maestro mi ha lasciato una mappa del Varco.",
];

type Bozza = Identita & { fonte: "claude" | "demo" };

/**
 * "Chi sei?": la prima cosa che il gioco chiede. Dalla risposta nascono aspetto, statistiche e background;
 * quando il giocatore conferma, si crea l'illustrazione una volta sola e da lì in poi il personaggio è quello in ogni scena.
 */
export default function ChiSei() {
  const [giocatore, setGiocatore] = useState<Giocatore | null>(null);
  const [pronto, setPronto] = useState(false);
  const [descrizione, setDescrizione] = useState("");
  const [universo, setUniverso] = useState<IdUniverso>("fantasy_medievale");
  const [bozza, setBozza] = useState<Bozza | null>(null);
  const [stato, setStato] = useState<"libero" | "leggo" | "ritraggo">("libero");
  const [avviso, setAvviso] = useState<string | null>(null);
  /** Se si arriva da una stanza, dopo la creazione si torna lì. */
  const [ritorno, setRitorno] = useState<string | null>(null);

  useEffect(() => {
    setGiocatore(caricaGiocatore());
    const r = new URLSearchParams(window.location.search).get("ritorno");
    if (r && /^\/stanza\/[A-Za-z0-9]+$/.test(r)) setRitorno(r);
    setPronto(true);
  }, []);

  async function leggi() {
    setStato("leggo");
    setAvviso(null);
    try {
      const res = await fetch("/api/personaggio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descrizione }),
      });
      const dati = await res.json();
      if (!res.ok) throw new Error(dati.errore ?? "Errore");
      setBozza(dati);
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Errore sconosciuto");
    } finally {
      setStato("libero");
    }
  }

  async function conferma() {
    if (!bozza) return;
    setStato("ritraggo");
    setAvviso(null);
    let immagine: string | undefined;
    try {
      const res = await fetch("/api/ritratto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essenza: bozza.essenza, descrizione }),
      });
      const dati = await res.json();
      immagine = dati.immagine ?? undefined;
      if (dati.errore) setAvviso(dati.errore);
    } catch {
      setAvviso("Il ritratto non è venuto: per ora resta la figura disegnata.");
    }
    const nuovo: Giocatore = {
      essenza: bozza.essenza,
      origine: bozza.origine,
      storia: bozza.storia,
      motivazione: bozza.motivazione,
      descrizione,
      universo,
      immagine,
      creatoIl: new Date().toISOString(),
    };
    if (!salvaGiocatore(nuovo)) setAvviso("Il browser non ha spazio per l'illustrazione: il personaggio è salvato con la figura disegnata.");
    setGiocatore(nuovo);
    setBozza(null);
    setStato("libero");
  }

  function ricomincia() {
    if (!confirm("Vuoi davvero ricominciare? Il personaggio attuale verrà dimenticato.")) return;
    dimenticaGiocatore();
    setGiocatore(null);
    setDescrizione(giocatore?.descrizione ?? "");
  }

  if (!pronto) return <main className="contenitore tenue">Il varco si apre...</main>;

  // ——— il personaggio esiste già: è lui, in ogni scena ———
  if (giocatore) {
    return (
      <main className="contenitore">
        <p className="piccolo"><Link href="/">← VARCO</Link></p>
        <div className="griglia-2" style={{ marginTop: 8 }}>
          <section className="pannello" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ aspectRatio: "620 / 785", background: "#000" }}>
              <CartaPersonaggio essenza={giocatore.essenza} immagine={giocatore.immagine} arena={arenaDi(giocatore.universo).id} />
            </div>
          </section>
          <Scheda identita={giocatore}>
            <p className="tenue piccolo" style={{ margin: 0 }}>
              {giocatore.immagine ? "Illustrazione creata dal gioco." : "Figura disegnata dal codice: l'illustrazione arriverà quando sarà collegato il generatore d'immagini."}
            </p>
            {avviso && <p className="piccolo" style={{ color: "var(--pericolo)", margin: 0 }}>{avviso}</p>}
            <div className="riga">
              {ritorno && <Link href={ritorno}><button>Torna alla stanza →</button></Link>}
              <Link href="/arena"><button className={ritorno ? "secondario" : undefined}>In arena →</button></Link>
              <button className="secondario" onClick={ricomincia}>Ricomincia da capo</button>
            </div>
          </Scheda>
        </div>
      </main>
    );
  }

  // ——— la domanda ———
  return (
    <main className="contenitore">
      <p className="piccolo"><Link href="/">← VARCO</Link></p>
      <h1>Chi sei?</h1>
      <p className="tenue">
        Raccontati come vuoi: come ti chiami, che aspetto hai, da dove vieni, cosa ti è successo, come combatti.
        Più dettagli dai, più il personaggio ti somiglierà. Una volta confermato, sarai tu in ogni scena.
      </p>

      <div className="griglia-2" style={{ marginTop: 16 }}>
        <section className="pannello" style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <textarea
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            maxLength={2500}
            rows={8}
            placeholder={DESCRIZIONE_ESEMPIO}
            aria-label="Chi sei?"
          />
          <div className="riga">
            <span className="piccolo tenue">Vieni da:</span>
            {Object.values(UNIVERSI).map((u) => (
              <button key={u.id} className={u.id === universo ? "" : "secondario"} style={{ padding: "4px 10px" }} onClick={() => setUniverso(u.id)}>
                {u.nome}
              </button>
            ))}
          </div>
          <div className="riga">
            <button onClick={leggi} disabled={stato !== "libero" || descrizione.trim().length < 3}>
              {stato === "leggo" ? "Il Varco ti guarda..." : bozza ? "Rileggi la mia storia" : "Attraversa il Varco"}
            </button>
            {bozza && <span className="etichetta">{bozza.fonte === "claude" ? "letto da Claude" : "modalità demo"}</span>}
          </div>
          {avviso && <p style={{ color: "var(--pericolo)", margin: 0 }}>{avviso}</p>}
          {!descrizione && (
            <div className="riga">
              <span className="piccolo tenue">Spunti:</span>
              {SPUNTI.map((s, i) => (
                <button key={i} className="secondario piccolo" style={{ padding: "4px 10px" }} onClick={() => setDescrizione(s)}>
                  {s.split(/[.,]/)[0]}
                </button>
              ))}
            </div>
          )}
        </section>

        {bozza ? (
          <section style={{ display: "grid", gap: 16 }}>
            <div className="pannello" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ aspectRatio: "620 / 785", background: "#000" }}>
                <CartaPersonaggio essenza={bozza.essenza} arena={arenaDi(universo).id} />
              </div>
            </div>
            <Scheda identita={bozza}>
              <div className="riga">
                <button onClick={conferma} disabled={stato !== "libero"}>
                  {stato === "ritraggo" ? "Il gioco ti sta disegnando..." : "Sì, sono io"}
                </button>
                <span className="piccolo tenue">Se non ti somiglia, cambia il testo e rileggi.</span>
              </div>
            </Scheda>
          </section>
        ) : (
          <section className="pannello tenue" style={{ display: "grid", placeItems: "center", minHeight: 240, textAlign: "center" }}>
            Il Varco aspetta la tua risposta.
          </section>
        )}
      </div>
    </main>
  );
}

function Scheda({ identita, children }: { identita: Identita; children?: React.ReactNode }) {
  const { essenza } = identita;
  return (
    <section className="pannello" style={{ display: "grid", gap: 10, alignContent: "start" }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>{essenza.nome}</h2>
        <p className="tenue" style={{ margin: 0 }}>{essenza.concetto}</p>
      </div>
      <p style={{ margin: 0 }}><strong className="piccolo">Origine.</strong> {identita.origine}</p>
      <p style={{ margin: 0 }}><strong className="piccolo">Storia.</strong> {identita.storia}</p>
      <p style={{ margin: 0 }}><strong className="piccolo">Cosa cerchi.</strong> {identita.motivazione}</p>
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
      {children}
    </section>
  );
}
