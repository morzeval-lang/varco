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

Un cartone d'avventura nostalgico, nostro: la morbidezza dei cartoni surreali di oggi incontra l'energia dei
manga d'avventura anni '80 e '90.

- **Personaggi:** testa grande e tonda, occhioni con doppio riflesso, sopracciglia decise, guance rosate,
  capelli a ciuffi grossi e appuntiti, arti morbidi "a tubo" senza gomiti, mani tonde, scarponi grandi.
- **Contorni:** scuri e spessi, uguali dappertutto. Colori piatti con una sola tinta d'ombra e un riflesso chiaro.
- **Ambienti:** colline tonde, nuvole soffici a bolle, rovine e tecnologia arrotondate (cupole, capsule, antenne
  con la pallina), una leggera grana calda e una vignetta morbida per l'effetto "vecchia videocassetta".
- **Palette per universo:** Fantasy medievale con cielo azzurro che sfuma in pesca, prati verde menta, tetti corallo;
  Post-apocalisse con tramonto arancio-rosa, sole a strisce, rovine lilla e azzurro polvere.
- **Nei prompt** si descrivono i tratti, non si nominano autori, opere o personaggi esistenti.
- Personaggi originali: ispirati a generi e stereotipi, mai copie di personaggi di giochi o anime esistenti.
