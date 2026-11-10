import { normalizzaEssenza, type Essenza } from "@/lib/personaggio/essenza";
import type { SchedaEroe } from "./tipi";

const essenza = (e: Essenza) => normalizzaEssenza(e);

/**
 * Eroi pronti: archetipi classici reinterpretati in chiave originale.
 * Valerio: cambia pure nomi, descrizioni, colori e statistiche (somma sempre 48, ognuna 6-16).
 */
export const EROI: SchedaEroe[] = [
  // ───────────── Fantasy medievale ─────────────
  {
    id: "aldric",
    universo: "fantasy_medievale",
    classe: "Paladino",
    descrizione:
      "Cavaliere di un ordine sciolto da anni, continua a rispettarne il giuramento anche se nessuno glielo chiede più. Armatura lucidata ogni sera, battute pessime.",
    essenza: essenza({
      nome: "Ser Aldric Valmonte",
      concetto: "Paladino senza ordine, fedele a un giuramento che solo lui ricorda",
      corporatura: "robusta",
      altezza: 1.06,
      pelle: "#e8c19c",
      capelli: { stile: "elmo", colore: "#8a6a3a" },
      palette: { primario: "#2f5fa7", secondario: "#d9d4c7", accento: "#ffe9a3" },
      segnoDistintivo: { tipo: "aura", descrizione: "alone di luce quando giura" },
      arma: { tipo: "spada", descrizione: "spada lunga con l'elsa a croce" },
      tratti: ["leale", "testardo", "battute pessime"],
      statistiche: { forza: 14, agilita: 9, mente: 11, tempra: 14 },
    }),
    mosseFirma: [
      { nome: "Fendente del Giuramento", archetipo: "fendente", elemento: "luce", intensita: 2, frase: "Alzo la spada e cala un fendente di luce gridando il mio giuramento" },
      { nome: "Muro d'Argento", archetipo: "scudo", elemento: "luce", intensita: 1, frase: "Pianto i piedi e alzo la guardia come un muro d'argento" },
      { nome: "Imposizione delle Mani", archetipo: "cura", elemento: "luce", intensita: 2, frase: "Mi inginocchio e chiudo la ferita con la luce delle mani" },
    ],
  },
  {
    id: "ysolde",
    universo: "fantasy_medievale",
    classe: "Ranger",
    descrizione:
      "Guardaboschi delle foreste di confine, parla più con i corvi che con le persone. Non sbaglia un colpo, ma sbaglia spesso le parole.",
    essenza: essenza({
      nome: "Ysolde dei Rovi",
      concetto: "Ranger solitaria che conosce ogni sentiero e nessuna buona maniera",
      corporatura: "esile",
      altezza: 1.04,
      pelle: "#f1d6bd",
      capelli: { stile: "lunghi", colore: "#d9b45a" },
      palette: { primario: "#2e6b45", secondario: "#6b4423", accento: "#b6ff8a" },
      segnoDistintivo: { tipo: "mantello", descrizione: "mantello di foglie cucite" },
      arma: { tipo: "arco", descrizione: "arco lungo di tasso" },
      tratti: ["silenziosa", "precisa", "diffidente"],
      statistiche: { forza: 9, agilita: 16, mente: 12, tempra: 11 },
    }),
    mosseFirma: [
      { nome: "Freccia di Rovo", archetipo: "proiettile", elemento: "tossico", intensita: 1, frase: "Incocco una freccia intinta nel veleno di rovo e tiro alla gola" },
      { nome: "Pioggia di Frecce", archetipo: "raffica", elemento: "cinetico", intensita: 2, frase: "Scocco tre frecce di fila senza respirare" },
      { nome: "Laccio del Bosco", archetipo: "trappola", elemento: "cinetico", intensita: 1, frase: "Tendo un laccio tra le radici e lo attiro dentro" },
    ],
  },
  {
    id: "morgrave",
    universo: "fantasy_medievale",
    classe: "Negromante",
    descrizione:
      "Ex archivista dell'Accademia, cacciato per aver letto il libro sbagliato. Gentile con i morti, molto meno con i vivi.",
    essenza: essenza({
      nome: "Morgrave l'Esiliato",
      concetto: "Negromante bibliotecario che tratta gli scheletri come colleghi",
      corporatura: "esile",
      altezza: 1.1,
      pelle: "#d8cfc4",
      capelli: { stile: "cappuccio", colore: "#1f1f24" },
      palette: { primario: "#3a2a52", secondario: "#1f1f24", accento: "#9b5cff" },
      segnoDistintivo: { tipo: "occhio_luminoso", descrizione: "un occhio viola che vede i morti" },
      arma: { tipo: "bastone", descrizione: "bastone con un teschio di corvo" },
      tratti: ["erudito", "sarcastico", "malinconico"],
      statistiche: { forza: 7, agilita: 11, mente: 16, tempra: 14 },
    }),
    mosseFirma: [
      { nome: "Raggio dell'Ossario", archetipo: "raggio", elemento: "ombra", intensita: 2, frase: "Punto il bastone e gli scarico addosso un raggio d'ombra dall'ossario" },
      { nome: "Richiamo dello Scheletro", archetipo: "evocazione", elemento: "ombra", intensita: 2, frase: "Evoco un vecchio collega scheletro che gli crolla addosso" },
      { nome: "Patto Oscuro", archetipo: "potenziamento", elemento: "ombra", intensita: 1, frase: "Sussurro un patto oscuro e mi concentro" },
    ],
  },
  {
    id: "brunhild",
    universo: "fantasy_medievale",
    classe: "Berserker",
    descrizione:
      "Nana delle miniere del nord, ha trasformato il piccone di famiglia in un'arma. Ride quando prende un pugno, ed è la cosa più spaventosa di lei.",
    essenza: essenza({
      nome: "Brunhild Spaccaroccia",
      concetto: "Berserker nanica che risolve ogni problema con il piccone",
      corporatura: "robusta",
      altezza: 0.86,
      pelle: "#e3b08a",
      capelli: { stile: "cresta", colore: "#a5402d" },
      palette: { primario: "#7a2e2e", secondario: "#5b5552", accento: "#ffb347" },
      segnoDistintivo: { tipo: "corna", descrizione: "elmo da miniera con le corna" },
      arma: { tipo: "pugni", descrizione: "guanti borchiati da minatore" },
      tratti: ["impulsiva", "allegra", "instancabile"],
      statistiche: { forza: 16, agilita: 10, mente: 7, tempra: 15 },
    }),
    mosseFirma: [
      { nome: "Spaccaroccia", archetipo: "fendente", elemento: "cinetico", intensita: 3, frase: "Urlo e calo il pugno con tutta la forza, colpo speciale spaccaroccia" },
      { nome: "Furia del Nord", archetipo: "raffica", elemento: "fuoco", intensita: 2, frase: "Entro in furia e lo tempesto di pugni infuocati" },
      { nome: "Grido di Guerra", archetipo: "potenziamento", elemento: "cinetico", intensita: 1, frase: "Lancio un grido di guerra che fa tremare le pietre" },
    ],
  },

  // ───────────── Post-apocalisse ─────────────
  {
    id: "nadia",
    universo: "post_apocalisse",
    classe: "Soldato veterano",
    descrizione:
      "Ex soldatessa di un esercito che non esiste più. Il braccio meccanico l'ha costruito da sola con pezzi di semaforo, e ancora lampeggia quando si arrabbia.",
    essenza: essenza({
      nome: "Nadia Rook",
      concetto: "Veterana col braccio meccanico fatto di semafori",
      corporatura: "media",
      altezza: 1.02,
      pelle: "#8d5524",
      capelli: { stile: "rasati", colore: "#2b2420" },
      palette: { primario: "#b3261e", secondario: "#2f5fa7", accento: "#4fd1ff" },
      segnoDistintivo: { tipo: "braccio_meccanico", descrizione: "braccio meccanico arrugginito" },
      arma: { tipo: "spada", descrizione: "lama ricavata da un cartello stradale" },
      tratti: ["disciplinata", "protettiva", "rancorosa"],
      statistiche: { forza: 14, agilita: 12, mente: 9, tempra: 13 },
    }),
    mosseFirma: [
      { nome: "Raggio Semaforo", archetipo: "raggio", elemento: "plasma", intensita: 2, frase: "Sparo un raggio di plasma dal braccio meccanico" },
      { nome: "Taglio Stradale", archetipo: "fendente", elemento: "cinetico", intensita: 1, frase: "Carico un fendente con la lama del cartello stradale" },
      { nome: "Copertura", archetipo: "scudo", elemento: "cinetico", intensita: 1, frase: "Mi riparo dietro uno scudo di lamiere" },
    ],
  },
  {
    id: "gecko",
    universo: "post_apocalisse",
    classe: "Razziatore",
    descrizione:
      "Ragazzo cresciuto nei tunnel della metro, ruba qualsiasi cosa luccichi. Ha un occhio cibernetico trovato in una discarica e non sa bene cosa veda.",
    essenza: essenza({
      nome: "Gecko",
      concetto: "Razziatore dei tunnel con un occhio cibernetico di seconda mano",
      corporatura: "esile",
      altezza: 0.92,
      pelle: "#c68642",
      capelli: { stile: "cappuccio", colore: "#2b2420" },
      palette: { primario: "#5b6b3a", secondario: "#3d3633", accento: "#ff4ad8" },
      segnoDistintivo: { tipo: "occhio_luminoso", descrizione: "occhio cibernetico rosa" },
      arma: { tipo: "pistola", descrizione: "pistola a chiodi modificata" },
      tratti: ["furbo", "nervoso", "generoso con gli amici"],
      statistiche: { forza: 8, agilita: 16, mente: 13, tempra: 11 },
    }),
    mosseFirma: [
      { nome: "Raffica di Chiodi", archetipo: "raffica", elemento: "cinetico", intensita: 2, frase: "Svuoto il caricatore della pistola a chiodi in una raffica" },
      { nome: "Bottiglia Incendiaria", archetipo: "proiettile", elemento: "fuoco", intensita: 1, frase: "Lancio una bottiglia incendiaria contro di lui" },
      { nome: "Sparire nel Fumo", archetipo: "schivata", elemento: "cinetico", intensita: 1, frase: "Rotolo dietro un rottame e sparisco nel fumo" },
    ],
  },
  {
    id: "madre_ruggine",
    universo: "post_apocalisse",
    classe: "Sciamana delle radiazioni",
    descrizione:
      "Anziana guaritrice che vive vicino al vecchio reattore. Dice di parlare con le radiazioni, e le radiazioni sembrano risponderle.",
    essenza: essenza({
      nome: "Madre Ruggine",
      concetto: "Sciamana che cura e avvelena con la stessa mano",
      corporatura: "media",
      altezza: 0.96,
      pelle: "#d9a47a",
      capelli: { stile: "lunghi", colore: "#d8d8d8" },
      palette: { primario: "#b5562b", secondario: "#6b4423", accento: "#8dff4a" },
      segnoDistintivo: { tipo: "aura", descrizione: "alone verde radioattivo" },
      arma: { tipo: "bastone", descrizione: "bastone fatto con una barra di grafite" },
      tratti: ["saggia", "inquietante", "materna"],
      statistiche: { forza: 7, agilita: 9, mente: 16, tempra: 16 },
    }),
    mosseFirma: [
      { nome: "Nube Calda", archetipo: "area_esplosiva", elemento: "tossico", intensita: 2, frase: "Sbatto il bastone a terra e libero una nube radioattiva" },
      { nome: "Rimedio della Nonna", archetipo: "cura", elemento: "tossico", intensita: 2, frase: "Bevo il mio intruglio verde e mi curo" },
      { nome: "Sguardo del Reattore", archetipo: "raggio", elemento: "tossico", intensita: 1, frase: "Lo fisso e un raggio verde gli esce dagli occhi" },
    ],
  },
  {
    id: "tank",
    universo: "post_apocalisse",
    classe: "Difensore",
    descrizione:
      "Camionista gigante che guidava l'ultimo convoglio di rifornimenti. Usa la portiera del suo camion come scudo e non lascia indietro nessuno.",
    essenza: essenza({
      nome: "Tank Okonkwo",
      concetto: "Camionista gigante con la portiera del suo camion come scudo",
      corporatura: "imponente",
      altezza: 1.12,
      pelle: "#5c3a21",
      capelli: { stile: "elmo", colore: "#2b2420" },
      palette: { primario: "#d4a017", secondario: "#3d3633", accento: "#ff6a2b" },
      segnoDistintivo: { tipo: "cicatrice", descrizione: "cicatrice sul sopracciglio" },
      arma: { tipo: "scudo", descrizione: "portiera di camion" },
      tratti: ["calmo", "protettivo", "canta alla radio"],
      statistiche: { forza: 14, agilita: 6, mente: 12, tempra: 16 },
    }),
    mosseFirma: [
      { nome: "Portierata", archetipo: "fendente", elemento: "cinetico", intensita: 2, frase: "Lo travolgo con un colpo forte di portiera" },
      { nome: "Muraglia del Convoglio", archetipo: "scudo", elemento: "cinetico", intensita: 1, frase: "Alzo la portiera e mi faccio scudo" },
      { nome: "Bidone Esplosivo", archetipo: "area_esplosiva", elemento: "fuoco", intensita: 2, frase: "Calcio un bidone di benzina verso di lui e lo faccio esplodere" },
    ],
  },
];
