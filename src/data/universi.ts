import type { IdUniverso, SchedaUniverso } from "./tipi";

export const UNIVERSI: Record<IdUniverso, SchedaUniverso> = {
  fantasy_medievale: {
    id: "fantasy_medievale",
    nome: "Regni di Calceterna",
    sottotitolo: "Fantasy medievale",
    tono: "Epico e un po' ironico: regni in guerra, giuramenti, taverne, draghi che nessuno ha visto davvero.",
    leggi: [
      "La magia funziona e si paga in Mana.",
      "La tecnologia è instabile: un congegno moderno si 'incanta' e può fare cose impreviste.",
      "I giuramenti hanno peso: rompere una promessa lascia un segno sul personaggio.",
    ],
    risorsa: "Mana",
    arene: [
      {
        id: "cortile_castello",
        nome: "Cortile di Rocca Grigia",
        descrizione:
          "Il cortile di Rocca Grigia è deserto: stendardi strappati, torce che sfrigolano nella sera, il portone sfondato da qualcosa di molto grosso.",
      },
    ],
  },
  post_apocalisse: {
    id: "post_apocalisse",
    nome: "Le Lande di Cenere",
    sottotitolo: "Post-apocalisse",
    tono: "Sopravvivenza e ironia nera: tutto è riciclato, ogni oggetto ha una storia, nessuno spreca un proiettile.",
    leggi: [
      "Tutto si consuma: gli oggetti hanno durabilità e si rompono.",
      "Le Scorte (cibo, acqua, munizioni) sono la vera moneta.",
      "Le radiazioni mutano: chi resta troppo nelle zone calde cambia, nel bene e nel male.",
    ],
    risorsa: "Scorte",
    arene: [
      {
        id: "postapo_autostrada",
        nome: "Autostrada in rovina",
        descrizione: "L'autostrada è un cimitero di lamiere. Il vento porta sabbia e odore di benzina vecchia.",
      },
    ],
  },
};

export function arenaDi(universo: IdUniverso) {
  return UNIVERSI[universo].arene[0];
}

export function universoDellArena(idArena: string): SchedaUniverso | undefined {
  return Object.values(UNIVERSI).find((u) => u.arene.some((a) => a.id === idArena));
}
