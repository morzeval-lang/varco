# Stile grafico di VARCO

Le scene sono **2D "a cartoncini"** nello **Stile Varco**: sfondo fisso dipinto, personaggi immobili già in posa
di combattimento che scorrono sopra lo sfondo come sagome di carta. Niente animazione dei corpi: si muovono
le sagome intere (scorrono, saltano, vengono spinte indietro, cadono di piatto), più effetti e testi in stile manga.

## Cosa c'è adesso

Ogni personaggio e ogni sfondo ha un **segnaposto disegnato dal codice** (SVG), così il gioco funziona già.
Appena c'è un'illustrazione vera, la si mette in `public/immagini/` e si collega alla scheda: il gioco usa
quella al posto del segnaposto, senza toccare altro.

## Come aggiungere un'illustrazione

1. Apri la **Galleria** e premi **Copia prompt** sotto il personaggio. Il prompt ha già lo stile fisso,
   la posa e i colori della scheda.
2. Generalo con il generatore di immagini che preferisci. Per uno stile coerente usa sempre lo stesso strumento.
3. Requisiti del file:
   - **Personaggi:** PNG con sfondo trasparente, quadrato (es. 1024×1024), figura intera rivolta a **destra**,
     piedi in basso al centro. Salva in `public/immagini/personaggi/<id>.png` (l'id è quello della scheda, es. `aldric`).
   - **Sfondi:** PNG o JPG 1800×1000, senza personaggi, con una fascia di terreno libera nel quarto in basso.
     Salva in `public/immagini/sfondi/<id-arena>.png` (es. `cortile_castello`).
4. Collega il file nella scheda aggiungendo il campo `immagine`:
   - eroi in `src/data/eroi.ts`, nemici in `src/data/nemici.ts`: `immagine: "/immagini/personaggi/aldric.png"`
   - arene in `src/data/universi.ts`: `immagine: "/immagini/sfondi/cortile_castello.png"`
5. Controlla il risultato nel **Laboratorio**: ferma la scena a un istante e guarda proporzioni e posizione dei piedi.

## Regole di stile: lo "Stile Varco"

Il tono è quello dei manga e degli anime d'azione di fine anni '80 e primi '90: serio, epico, nostalgico.
Niente aria da cartone per bambini.

- **Personaggi:** proporzioni adulte (circa sette teste), spalle e muscoli leggibili, occhi stretti e taglienti,
  sopracciglia corrucciate, capelli a ciocche affilate, pose d'azione con il peso sulla gamba avanti.
- **Inchiostro e colore:** contorni scuri decisi, colori piatti con un'ombra netta (la luce arriva da destra in alto),
  qualche lama di luce sui bordi. Palette calda e un po' smorzata.
- **Ambienti:** luce drammatica di fine giornata, profondità a strati che si velano con la distanza, raggi di luce,
  polvere sospesa e vignetta. Contorni più sottili dei personaggi, così i cartoncini restano in primo piano.
- **Palette per universo:** Fantasy medievale con crepuscolo viola e cremisi, pietra calda e torce;
  Post-apocalisse con cielo color ruggine, foschia di polvere e palazzi sventrati.
- **Nei prompt** si descrivono i tratti, non si nominano autori, opere o personaggi esistenti.
- Personaggi originali: ispirati a generi e stereotipi, mai copie di personaggi di giochi o anime esistenti.
