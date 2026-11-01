"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { EROI, NEMICI, UNIVERSI } from "@/data";
import { famiglia } from "@/lib/rules/combat";
import { ARCHETIPI, ELEMENTI, type Archetipo, type Copione, type Elemento, type Esito, type Intensita } from "@/lib/rules/types";
import { tempiScena } from "@/components/scena/ScenaCartoncini";

const ScenaCartoncini = dynamic(() => import("@/components/scena/ScenaCartoncini"), { ssr: false });

const ESITI: Esito[] = ["colpito", "critico", "mancato", "fallimento", "riuscito"];
const CAMERA: Record<string, Copione["camera"]> = {
  mischia: ["spalla_attore", "carica", "impatto_bersaglio", "larga"],
  distanza: ["spalla_attore", "segui_proiettile", "impatto_bersaglio", "larga"],
  raggio: ["laterale", "segui_proiettile", "impatto_bersaglio", "larga"],
  area: ["primo_piano_attore", "laterale", "impatto_bersaglio", "larga"],
  supporto: ["primo_piano_attore", "aura", "larga"],
};

const PERSONAGGI = [
  ...EROI.map((e) => ({ id: e.id, nome: `${e.essenza.nome} (${e.classe})`, essenza: e.essenza, immagine: e.immagine })),
  ...NEMICI.map((n) => ({ id: n.id, nome: `${n.essenza.nome} (${n.rango})`, essenza: n.essenza, immagine: n.immagine })),
];
const ARENE = Object.values(UNIVERSI).flatMap((u) => u.arene);

/**
 * Laboratorio delle scene: per provare ogni combinazione di personaggi, arena, mossa ed esito.
 * Con "Blocca" la scena si ferma all'istante scelto, utile per regolare effetti e inquadrature.
 */
export default function Laboratorio() {
  const [attoreId, setAttoreId] = useState("aldric");
  const [bersaglioId, setBersaglioId] = useState("re_troll");
  const [arenaId, setArenaId] = useState("cortile_castello");
  const [archetipo, setArchetipo] = useState<Archetipo>("fendente");
  const [elemento, setElemento] = useState<Elemento>("luce");
  const [intensita, setIntensita] = useState<Intensita>(2);
  const [esito, setEsito] = useState<Esito>("colpito");
  const [ko, setKo] = useState(false);
  const [blocca, setBlocca] = useState(false);
  const [tempo, setTempo] = useState(0.9);
  const [giro, setGiro] = useState(0);

  const attore = PERSONAGGI.find((p) => p.id === attoreId)!;
  const bersaglio = PERSONAGGI.find((p) => p.id === bersaglioId)!;
  const arena = ARENE.find((a) => a.id === arenaId)!;

  const copione: Copione = {
    arena: arenaId,
    attore: "sx",
    bersaglio: "dx",
    archetipo,
    elemento,
    intensita,
    esito,
    danno: esito === "critico" ? 24 : esito === "colpito" ? 9 : 0,
    cura: archetipo === "cura" ? 8 : 0,
    stati: [],
    ko: ko && (esito === "colpito" || esito === "critico"),
    camera: CAMERA[famiglia(archetipo)],
    didascalia: `${archetipo} di ${elemento}, intensità ${intensita}: ${esito}`,
    seme: giro,
    tiri: [],
  };
  const durata = tempiScena(copione).fine;
  const sel = { width: "auto" } as const;

  return (
    <main style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100vh" }}>
      <div className="riga" style={{ padding: 12, borderBottom: "1px solid var(--bordo)" }}>
        <Link href="/" className="piccolo">← VARCO</Link>
        <strong>Laboratorio scene</strong>
        <select value={attoreId} onChange={(e) => setAttoreId(e.target.value)} style={sel} aria-label="Attore">
          {PERSONAGGI.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <span className="tenue">→</span>
        <select value={bersaglioId} onChange={(e) => setBersaglioId(e.target.value)} style={sel} aria-label="Bersaglio">
          {PERSONAGGI.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select value={arenaId} onChange={(e) => setArenaId(e.target.value)} style={sel} aria-label="Arena">
          {ARENE.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <select value={archetipo} onChange={(e) => setArchetipo(e.target.value as Archetipo)} style={sel} aria-label="Archetipo">
          {ARCHETIPI.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={elemento} onChange={(e) => setElemento(e.target.value as Elemento)} style={sel} aria-label="Elemento">
          {ELEMENTI.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={intensita} onChange={(e) => setIntensita(Number(e.target.value) as Intensita)} style={sel} aria-label="Intensità">
          {[1, 2, 3].map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={esito} onChange={(e) => setEsito(e.target.value as Esito)} style={sel} aria-label="Esito">
          {ESITI.map((a) => <option key={a}>{a}</option>)}
        </select>
        <label className="riga piccolo"><input type="checkbox" checked={ko} onChange={(e) => setKo(e.target.checked)} style={sel} aria-label="KO" /> KO</label>
        <label className="riga piccolo"><input type="checkbox" checked={blocca} onChange={(e) => setBlocca(e.target.checked)} style={sel} aria-label="Blocca" /> Blocca a</label>
        <input type="range" min={0} max={durata} step={0.05} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} style={{ width: 140 }} aria-label="Istante" />
        <span className="piccolo tenue">{tempo.toFixed(2)} s</span>
        <button onClick={() => setGiro((g) => g + 1)}>Rigioca</button>
      </div>
      <div style={{ position: "relative", minHeight: 0 }}>
        <ScenaCartoncini
          key={`${giro}-${blocca}`}
          sinistra={{ id: "sx", essenza: attore.essenza, immagine: attore.immagine }}
          destra={{ id: "dx", essenza: bersaglio.essenza, immagine: bersaglio.immagine }}
          copione={copione}
          immagineSfondo={arena.immagine}
          onFine={() => undefined}
          tempoFisso={blocca ? tempo : undefined}
        />
      </div>
    </main>
  );
}
