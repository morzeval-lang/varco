# VARCO: istruzioni per chi sviluppa (umani e Claude)

Gioco di ruolo testuale a turni nel multiverso. Design: https://claude.ai/artifact/Cak2nZbwT6Wx4hm5eQgWQi

## Regole del progetto

- **Lingua:** interfaccia, testi di gioco, nomi di dominio e commenti in italiano.
- **I dadi li decide il codice.** `src/lib/rules/` è TypeScript puro e deterministico: niente rete, niente AI,
  niente `Math.random`. Ogni modifica alle regole va con un test in `*.test.ts`.
- **Claude interpreta e racconta, non decide.** Le chiamate a Claude stanno in `src/lib/gm/` (solo server)
  e restituiscono dati strutturati validati con zod. Senza `ANTHROPIC_API_KEY` tutto deve funzionare
  in modalità demo (ripieghi a parole chiave).
- **Scene 2D "a cartoncini", niente 3D.** Sfondo fisso + personaggi immobili in posa che scorrono (stile anime).
  `src/components/scena/` legge un `Copione` e il tempo t, e non cambia lo stato di gioco. Nuove mosse si
  aggiungono come archetipo + elemento + intensità, non come animazioni su misura.
- **Contenuti come dati.** Universi, eroi e nemici stanno in `src/data/`. Le illustrazioni definitive vanno in
  `public/immagini/` e si collegano con il campo `immagine` (vedi `docs/stile-grafico.md`); senza, si usa il segnaposto SVG.
- **Gioco originale:** niente personaggi, nomi o marchi di opere esistenti.

## Comandi

- `npm run dev` avvia in locale su http://localhost:3000
- `npm test` esegue i test (vitest)
- `npm run typecheck` controlla i tipi
- `npm run build` build di produzione

Pagine utili: `/crea` (personaggio e sua carta), `/galleria` (eroi e bestiario, prompt per le illustrazioni),
`/arena` (scelta sfida, combattimento testo → scena → testo), `/laboratorio` (scene bloccabili a un istante).
