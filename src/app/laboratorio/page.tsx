"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { essenzaDemo } from "@/lib/personaggio/demo";
import { DESCRIZIONE_ESEMPIO } from "@/lib/personaggio/salvataggio";
import { famiglia } from "@/lib/rules/combat";
import { ARCHETIPI, ELEMENTI, type Archetipo, type Copione, type Elemento, type Esito, type Intensita } from "@/lib/rules/types";

const ArenaScena = dynamic(() => import("@/components/three/ArenaScena"), { ssr: false });

const ESITI: Esito[] = ["colpito", "critico", "mancato", "fallimento", "riuscito"];
const CAMERA: Record<string, Copione["camera"]> = {
  mischia: ["spalla_attore", "carica", "impatto_bersaglio", "larga"],
  distanza: ["spalla_attore", "segui_proiettile", "impatto_bersaglio", "larga"],
  raggio: ["laterale", "segui_proiettile", "impatto_bersaglio", "larga"],
  area: ["primo_piano_attore", "laterale", "impatto_bersaglio", "larga"],
  supporto: ["primo_piano_attore", "aura", "larga"],
};

/**
 * Laboratorio delle scene: per regolare a mano archetipi, elementi e inquadrature.
 * Con "Blocca" la scena si ferma all'istante scelto, utile per controllare gli effetti.
 */
export default function Laboratorio() {
  const giocatore = useMemo(() => essenzaDemo(DESCRIZIONE_ESEMPIO), []);
  const nemico = useMemo(() => essenzaDemo("Un predone imponente con elmo, vestiti marroni e pugni corazzati. Si chiama Grosso Bruno."), []);
  const [archetipo, setArchetipo] = useState<Archetipo>("raggio");
  const [elemento, setElemento] = useState<Elemento>("plasma");
  const [intensita, setIntensita] = useState<Intensita>(2);
  const [esito, setEsito] = useState<Esito>("colpito");
  const [blocca, setBlocca] = useState(false);
  const [tempo, setTempo] = useState(1.1);
  const [giro, setGiro] = useState(0);

  const copione: Copione = {
    arena: "postapo_autostrada",
    attore: "giocatore",
    bersaglio: "nemico",
    archetipo,
    elemento,
    intensita,
    esito,
    danno: esito === "critico" ? 24 : esito === "colpito" ? 9 : 0,
    cura: archetipo === "cura" ? 8 : 0,
    stati: [],
    ko: false,
    camera: CAMERA[famiglia(archetipo)],
    didascalia: `${archetipo} di ${elemento}, intensità ${intensita}: ${esito}`,
    seme: giro,
    tiri: [],
  };

  return (
    <main style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100vh" }}>
      <div className="riga" style={{ padding: 12, borderBottom: "1px solid var(--bordo)" }}>
        <Link href="/" className="piccolo">← VARCO</Link>
        <strong>Laboratorio scene</strong>
        <select value={archetipo} onChange={(e) => setArchetipo(e.target.value as Archetipo)} style={{ width: "auto" }} aria-label="Archetipo">
          {ARCHETIPI.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={elemento} onChange={(e) => setElemento(e.target.value as Elemento)} style={{ width: "auto" }} aria-label="Elemento">
          {ELEMENTI.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={intensita} onChange={(e) => setIntensita(Number(e.target.value) as Intensita)} style={{ width: "auto" }} aria-label="Intensità">
          {[1, 2, 3].map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={esito} onChange={(e) => setEsito(e.target.value as Esito)} style={{ width: "auto" }} aria-label="Esito">
          {ESITI.map((a) => <option key={a}>{a}</option>)}
        </select>
        <label className="riga piccolo"><input type="checkbox" checked={blocca} onChange={(e) => setBlocca(e.target.checked)} style={{ width: "auto" }} /> Blocca a</label>
        <input type="range" min={0} max={3.6} step={0.05} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} style={{ width: 160 }} aria-label="Istante" />
        <span className="piccolo tenue">{tempo.toFixed(2)} s</span>
        <button onClick={() => setGiro((g) => g + 1)}>Rigioca</button>
      </div>
      <div style={{ position: "relative" }}>
        <ArenaScena
          key={`${giro}-${archetipo}-${elemento}-${intensita}-${esito}-${blocca ? tempo : "x"}`}
          sinistra={{ id: "giocatore", essenza: giocatore }}
          destra={{ id: "nemico", essenza: nemico }}
          copione={copione}
          onFine={() => undefined}
          tempoFisso={blocca ? tempo : undefined}
        />
      </div>
    </main>
  );
}
