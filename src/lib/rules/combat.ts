import { Dadi } from "./rng";
import type {
  Archetipo,
  Combattente,
  Copione,
  Elemento,
  Esito,
  Inquadratura,
  Intensita,
  Mossa,
  Statistica,
  Stato,
} from "./types";

type Famiglia = "mischia" | "distanza" | "raggio" | "area" | "supporto";

interface RegolaArchetipo {
  famiglia: Famiglia;
  statistica: Statistica;
  /** Facce del dado di danno (o di cura) per ogni punto di intensità. */
  dado: number;
  offensivo: boolean;
}

export const REGOLE_ARCHETIPI: Record<Archetipo, RegolaArchetipo> = {
  fendente: { famiglia: "mischia", statistica: "forza", dado: 8, offensivo: true },
  affondo: { famiglia: "mischia", statistica: "agilita", dado: 6, offensivo: true },
  raffica: { famiglia: "mischia", statistica: "agilita", dado: 4, offensivo: true },
  proiettile: { famiglia: "distanza", statistica: "agilita", dado: 6, offensivo: true },
  raggio: { famiglia: "raggio", statistica: "mente", dado: 8, offensivo: true },
  area_esplosiva: { famiglia: "area", statistica: "mente", dado: 6, offensivo: true },
  trappola: { famiglia: "area", statistica: "mente", dado: 6, offensivo: true },
  evocazione: { famiglia: "area", statistica: "mente", dado: 8, offensivo: true },
  scudo: { famiglia: "supporto", statistica: "tempra", dado: 0, offensivo: false },
  cura: { famiglia: "supporto", statistica: "mente", dado: 8, offensivo: false },
  potenziamento: { famiglia: "supporto", statistica: "mente", dado: 0, offensivo: false },
  schivata: { famiglia: "supporto", statistica: "agilita", dado: 0, offensivo: false },
};

const STATO_DA_ELEMENTO: Partial<Record<Elemento, Stato>> = {
  fuoco: "in_fiamme",
  gelo: "congelato",
  fulmine: "stordito",
  tossico: "avvelenato",
  luce: "accecato",
};

const CAMERA: Record<Famiglia, Inquadratura[]> = {
  mischia: ["spalla_attore", "carica", "impatto_bersaglio", "larga"],
  distanza: ["spalla_attore", "segui_proiettile", "impatto_bersaglio", "larga"],
  raggio: ["laterale", "segui_proiettile", "impatto_bersaglio", "larga"],
  area: ["primo_piano_attore", "laterale", "impatto_bersaglio", "larga"],
  supporto: ["primo_piano_attore", "aura", "larga"],
};

/** Modificatore classico: 10 è neutro, ogni 2 punti vale +1. */
export function modificatore(valore: number): number {
  return Math.floor((valore - 10) / 2);
}

/** Costo in energia: intensità 1 è gratis, poi 3 punti per livello. */
export function costoEnergia(intensita: Intensita): number {
  return (intensita - 1) * 3;
}

/** Difesa base: 10 + Agilità, più bonus se il bersaglio è in guardia. */
export function difesa(c: Combattente): number {
  return 10 + modificatore(c.statistiche.agilita) + (c.stati.includes("in_guardia") ? 3 : 0);
}

export interface InputMossa {
  attore: Combattente;
  bersaglio: Combattente;
  mossa: Mossa;
  seme: number;
  arena: string;
}

export interface RisultatoMossa {
  copione: Copione;
  attore: Combattente;
  bersaglio: Combattente;
}

function conStato(c: Combattente, s: Stato): Combattente {
  return c.stati.includes(s) ? c : { ...c, stati: [...c.stati, s] };
}

function senzaStato(c: Combattente, s: Stato): Combattente {
  return { ...c, stati: c.stati.filter((x) => x !== s) };
}

/**
 * Risolve una mossa in modo deterministico: stesso input e stesso seme danno sempre
 * lo stesso esito. Restituisce il copione per la scena 3D e i combattenti aggiornati.
 */
export function risolviMossa(input: InputMossa): RisultatoMossa {
  const { mossa, seme, arena } = input;
  let attore = { ...input.attore, stati: [...input.attore.stati] };
  let bersaglio = { ...input.bersaglio, stati: [...input.bersaglio.stati] };
  const regola = REGOLE_ARCHETIPI[mossa.archetipo];
  const dadi = new Dadi(seme);
  const bonus = Math.max(0, Math.min(2, Math.round(mossa.bonusNarrativo ?? 0)));
  const mod = modificatore(attore.statistiche[regola.statistica]);

  let esito: Esito;
  let danno = 0;
  let cura = 0;
  const statiApplicati: Stato[] = [];

  const costo = costoEnergia(mossa.intensita);
  if (attore.energia < costo) {
    esito = "senza_energia";
  } else {
    attore.energia -= costo;

    if (!regola.offensivo) {
      esito = "riuscito";
      // Le mosse di supporto agiscono sull'attore stesso.
      if (mossa.archetipo === "cura") {
        cura = Math.max(1, dadi.tira(mossa.intensita, regola.dado, "cura").totale + mod + bonus);
        attore.pv = Math.min(attore.pvMax, attore.pv + cura);
      } else {
        const stato: Stato =
          mossa.archetipo === "scudo" ? "scudo" : mossa.archetipo === "potenziamento" ? "potenziato" : "in_guardia";
        attore = conStato(attore, stato);
        statiApplicati.push(stato);
      }
      bersaglio = { ...bersaglio };
    } else {
      const potenziato = attore.stati.includes("potenziato");
      const d20 = dadi.tira(1, 20, "attacco").totale;
      const totale = d20 + mod + bonus + (potenziato ? 2 : 0);
      if (potenziato) attore = senzaStato(attore, "potenziato");

      if (d20 === 1) esito = "fallimento";
      else if (d20 === 20) esito = "critico";
      else esito = totale >= difesa(bersaglio) ? "colpito" : "mancato";

      if (esito === "colpito" || esito === "critico") {
        const numeroDadi = mossa.intensita * (esito === "critico" ? 2 : 1);
        let grezzo = dadi.tira(numeroDadi, regola.dado, "danno").totale + mod + bonus;
        if (bersaglio.stati.includes("scudo")) {
          grezzo = Math.floor(grezzo / 2);
          bersaglio = senzaStato(bersaglio, "scudo");
        }
        danno = Math.max(1, grezzo);
        bersaglio.pv = Math.max(0, bersaglio.pv - danno);

        const stato = STATO_DA_ELEMENTO[mossa.elemento];
        if (stato && (esito === "critico" || mossa.intensita === 3)) {
          bersaglio = conStato(bersaglio, stato);
          statiApplicati.push(stato);
        }
      }
      bersaglio = senzaStato(bersaglio, "in_guardia");
    }
  }

  const ko = bersaglio.pv === 0;
  const copione: Copione = {
    arena,
    attore: attore.id,
    bersaglio: bersaglio.id,
    archetipo: mossa.archetipo,
    elemento: mossa.elemento,
    intensita: mossa.intensita,
    esito,
    danno,
    cura,
    stati: statiApplicati,
    ko,
    camera: CAMERA[regola.famiglia],
    didascalia: didascalia(attore.nome, bersaglio.nome, mossa, esito, danno, cura, ko),
    seme,
    tiri: dadi.registro,
  };
  return { copione, attore, bersaglio };
}

export function famiglia(archetipo: Archetipo): Famiglia {
  return REGOLE_ARCHETIPI[archetipo].famiglia;
}

function didascalia(
  attore: string,
  bersaglio: string,
  mossa: Mossa,
  esito: Esito,
  danno: number,
  cura: number,
  ko: boolean,
): string {
  const nome = mossa.nome?.trim() || `${mossa.archetipo.replace("_", " ")} di ${mossa.elemento}`;
  switch (esito) {
    case "senza_energia":
      return `${attore} prova ${nome}, ma non ha abbastanza energia.`;
    case "fallimento":
      return `${attore} tenta ${nome} e inciampa in modo spettacolare.`;
    case "mancato":
      return `${attore} usa ${nome}, ma ${bersaglio} schiva.`;
    case "riuscito":
      return cura > 0 ? `${attore} usa ${nome} e recupera ${cura} PV.` : `${attore} usa ${nome}.`;
    case "critico":
      return `Colpo critico! ${nome} di ${attore} infligge ${danno} danni a ${bersaglio}${ko ? ", che crolla a terra" : ""}.`;
    case "colpito":
      return `${nome} di ${attore} colpisce ${bersaglio}: ${danno} danni${ko ? ", KO!" : "."}`;
  }
}
