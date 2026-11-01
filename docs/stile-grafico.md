# Stile grafico di VARCO

Le scene sono **2D stile anime "a cartoncini"**: sfondo fisso dipinto, personaggi immobili già in posa
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

## Regole di stile

- Contorni neri decisi, colorazione piatta a due toni, niente sfumature realistiche.
- Palette per universo: Fantasy medievale con viola del crepuscolo e calore delle torce; Post-apocalisse con
  arancio polveroso e ruggine.
- Personaggi originali: ispirati a generi e stereotipi, mai copie di personaggi di giochi o anime esistenti.
