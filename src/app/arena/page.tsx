"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Essenza } from "@/lib/personaggio/essenza";
import { essenzaDemo } from "@/lib/personaggio/demo";
import { caricaPersonaggio } from "@/lib/personaggio/salvataggio";
import type { Combattente, Copione, Mossa, TiroRegistrato } from "@/lib/rules/types";

const ArenaScena = dynamic(() => import("@/components/three/ArenaScena"), { ssr: false });

const NEMICO_DESCRIZIONE =
  "Un predone delle lande, imponente e robusto, con un elmo di latta, vestiti marroni e grigi, una cicatrice e pugni corazzati. Si chiama Grosso Bruno.";

const MOSSE_NEMICO: Mossa[] = [
  { archetipo: "fendente", elemento: "cinetico", intensita: 1, nome: "Pugno di latta" },
  { archetipo: "proiettile", elemento: "tossico", intensita: 1, nome: "Barattolo radioattivo" },
  { archetipo: "area_esplosiva", elemento: "fuoco", intensita: 2, nome: "Bidone esplosivo" },
  { archetipo: "raffica", elemento: "cinetico", intensita: 1, nome: "Gragnola di pugni" },
];

const SUGGERIMENTI = [
  "Lancio una bottiglia incendiaria contro il predone",
  "Carico un fendente con la spada, con tutta la forza",
  "Sparo un raggio di plasma dal braccio meccanico",
  "Evoco uno sciame di rottami che gli piove addosso",
  "Mi riparo dietro uno scudo di lamiere",
  "Mi curo con una benda e un sorso d'acqua",
];

interface Voce {
  tipo: "giocatore" | "gm" | "nemico" | "sistema";
  testo: string;
  tiri?: TiroRegistrato[];
}

function daEssenza(id: string, e: Essenza, bonusPv = 0): Combattente {
  const pvMax = 20 + e.statistiche.tempra + bonusPv;
  return { id, nome: e.nome, statistiche: e.statistiche, pv: pvMax, pvMax, energia: 10, energiaMax: 10, stati: [] };
}

function descriviTiri(tiri: TiroRegistrato[]) {
  return tiri.map((t) => `${t.scopo} ${t.formula} → [${t.risultati.join(", ")}]`).join(" · ");
}

interface ScenaInCorso {
  copione: Copione;
  attore: Combattente;
  bersaglio: Combattente;
  diNemico: boolean;
}

export default function Arena() {
  const [essenzaGiocatore, setEssenzaGiocatore] = useState<Essenza | null>(null);
  const essenzaNemico = useRef(essenzaDemo(NEMICO_DESCRIZIONE)).current;
  const [giocatore, setGiocatore] = useState<Combattente | null>(null);
  const [nemico, setNemico] = useState<Combattente>(() => daEssenza("nemico", essenzaNemico, 6));
  const [diario, setDiario] = useState<Voce[]>([]);
  const [testo, setTesto] = useState("");
  const [inAttesa, setInAttesa] = useState(false);
  const [scena, setScena] = useState<ScenaInCorso | null>(null);
  const [didascaliaVisibile, setDidascaliaVisibile] = useState(false);
  const partita = useRef(`arena-${Date.now().toString(36)}`);
  const turno = useRef(0);
  const fineDiario = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const e = caricaPersonaggio();
    setEssenzaGiocatore(e);
    setGiocatore(daEssenza("giocatore", e));
    setDiario([
      {
        tipo: "gm",
        testo: `L'autostrada è un cimitero di lamiere. Dal fumo di un'autocisterna emerge ${essenzaNemico.nome}, un predone grosso come un armadio, che batte i pugni corazzati. "Quello che hai addosso adesso è mio." Cosa fai?`,
      },
    ]);
  }, [essenzaNemico.nome]);

  useEffect(() => {
    fineDiario.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [diario]);

  const finita = !!giocatore && (giocatore.pv === 0 || nemico.pv === 0);

  async function turnoDi(attore: Combattente, bersaglio: Combattente, corpo: { testo?: string; mossa?: Mossa }, diNemico: boolean) {
    const res = await fetch("/api/mossa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partita: partita.current, turno: turno.current++, arena: "postapo_autostrada", attore, bersaglio, ...corpo }),
    });
    const dati = await res.json();
    if (!res.ok) throw new Error(dati.errore ?? "Errore del server");
    setDidascaliaVisibile(false);
    setTimeout(() => setDidascaliaVisibile(true), 900);
    setScena({ copione: dati.copione, attore: dati.attore, bersaglio: dati.bersaglio, diNemico });
  }

  async function agisci(e?: React.FormEvent) {
    e?.preventDefault();
    if (!giocatore || !testo.trim() || inAttesa || finita) return;
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

  /** Fine della scena 3D: si applicano i risultati, si torna al testo, poi tocca al nemico. */
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
      setDiario((d) => [
        ...d,
        { tipo: "sistema", testo: diNemico ? `${g.nome} è a terra. Il varco si richiude... per ora.` : `${n.nome} crolla tra le lamiere. Vittoria!` },
      ]);
      setInAttesa(false);
      return;
    }
    if (!diNemico) {
      const mossa = MOSSE_NEMICO[turno.current % MOSSE_NEMICO.length];
      setTimeout(() => {
        turnoDi(n, g, { mossa }, true).catch((err) => {
          setDiario((d) => [...d, { tipo: "sistema", testo: err instanceof Error ? err.message : "Errore" }]);
          setInAttesa(false);
        });
      }, 1200);
    } else {
      setInAttesa(false);
    }
  }

  function rigioca() {
    if (!essenzaGiocatore) return;
    setGiocatore(daEssenza("giocatore", essenzaGiocatore));
    setNemico(daEssenza("nemico", essenzaNemico, 6));
    setDiario([{ tipo: "gm", testo: `${essenzaNemico.nome} si rialza, sputa polvere e ride. "Secondo round."` }]);
    partita.current = `arena-${Date.now().toString(36)}`;
    turno.current = 0;
  }

  if (!giocatore || !essenzaGiocatore) return <main className="contenitore tenue">Apertura del varco...</main>;

  return (
    <main className="contenitore" style={{ maxWidth: 760 }}>
      <p className="piccolo"><Link href="/">← VARCO</Link> · <Link href="/crea">cambia personaggio</Link></p>
      <h1>Autostrada in rovina</h1>
      <p className="tenue piccolo">Post-apocalisse · scrivi la tua mossa: il codice tira i dadi, poi la scena clou parte in 3D.</p>

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
            {SUGGERIMENTI.map((s) => (
              <button key={s} type="button" className="secondario piccolo" style={{ padding: "4px 10px" }} onClick={() => setTesto(s)} disabled={inAttesa}>
                {s}
              </button>
            ))}
          </div>
        </form>
      )}

      {scena && (
        <div className="scena-clou" role="dialog" aria-label="Scena di combattimento">
          <ArenaScena
            key={scena.copione.seme}
            sinistra={{ id: "giocatore", essenza: essenzaGiocatore, ko: giocatore.pv === 0 }}
            destra={{ id: "nemico", essenza: essenzaNemico, ko: nemico.pv === 0 }}
            copione={scena.copione}
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
