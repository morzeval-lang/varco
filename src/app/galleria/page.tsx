"use client";

import Link from "next/link";
import { useState } from "react";
import { CartaPersonaggio } from "@/components/scena/CartaPersonaggio";
import { EROI, NEMICI, UNIVERSI, arenaDi, type IdUniverso } from "@/data";
import { salvaPersonaggio } from "@/lib/personaggio/salvataggio";
import { promptCartoncino, promptSfondo } from "@/lib/grafica/prompt";

function copia(testo: string) {
  navigator.clipboard?.writeText(testo).catch(() => undefined);
}

const RANGO = { gregario: "Gregario", campione: "Campione", boss: "Boss" } as const;

export default function Galleria() {
  const [universo, setUniverso] = useState<IdUniverso>("fantasy_medievale");
  const arena = arenaDi(universo);
  const eroi = EROI.filter((e) => e.universo === universo);
  const nemici = NEMICI.filter((n) => n.universo === universo);

  return (
    <main className="contenitore">
      <p className="piccolo"><Link href="/">← VARCO</Link></p>
      <h1>Galleria</h1>
      <div className="riga" style={{ margin: "8px 0 20px" }}>
        {Object.values(UNIVERSI).map((u) => (
          <button key={u.id} className={u.id === universo ? "" : "secondario"} onClick={() => setUniverso(u.id)}>
            {u.nome} · {u.sottotitolo}
          </button>
        ))}
      </div>
      <p className="tenue" style={{ maxWidth: 720 }}>{UNIVERSI[universo].tono}</p>
      <div className="riga">
        <span className="piccolo tenue">Arena: {arena.nome}</span>
        <button className="secondario piccolo" style={{ padding: "4px 10px" }} onClick={() => copia(promptSfondo(arena.descrizione))}>Copia prompt sfondo</button>
      </div>

      <h2 style={{ marginTop: 24 }}>Eroi</h2>
      <div className="griglia-carte">
        {eroi.map((e) => (
          <article key={e.id} className="carta">
            <div className="carta-figura"><CartaPersonaggio essenza={e.essenza} immagine={e.immagine} arena={arena.id} immagineSfondo={arena.immagine} /></div>
            <div className="carta-testo">
              <span className="etichetta">{e.classe}</span>
              <h3>{e.essenza.nome}</h3>
              <p className="tenue piccolo">{e.descrizione}</p>
              <p className="piccolo">{e.mosseFirma.map((m) => m.nome).join(" · ")}</p>
              <div className="riga">
                <Link href={`/arena?eroe=${e.id}`}><button>Gioca</button></Link>
                <button className="secondario" onClick={() => salvaPersonaggio(e.essenza)}>Usa come mio</button>
                <button className="secondario piccolo" onClick={() => copia(promptCartoncino(e.essenza, e.descrizione))} title="Copia il prompt per generare l'illustrazione">Copia prompt</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>Bestiario</h2>
      <div className="griglia-carte">
        {nemici.map((n) => (
          <article key={n.id} className="carta">
            <div className="carta-figura"><CartaPersonaggio essenza={n.essenza} immagine={n.immagine} arena={arena.id} immagineSfondo={arena.immagine} /></div>
            <div className="carta-testo">
              <span className={`etichetta rango-${n.rango}`}>{RANGO[n.rango]}</span>
              <h3>{n.essenza.nome}</h3>
              <p className="tenue piccolo">{n.descrizione}</p>
              <p className="piccolo">{n.mosse.map((m) => m.nome).join(" · ")}</p>
              <div className="riga">
                <Link href={`/arena?nemico=${n.id}`}><button className="secondario">Affronta</button></Link>
                <button className="secondario piccolo" onClick={() => copia(promptCartoncino(n.essenza, n.descrizione))} title="Copia il prompt per generare l'illustrazione">Copia prompt</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
