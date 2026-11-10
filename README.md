# VARCO

Gioco di ruolo testuale a turni ambientato in un multiverso, giocabile da web app.
Si gioca scrivendo; un Game Master AI interpreta e racconta, il codice tira i dadi, e i momenti clou
diventano scene 2D "a cartoncini" in Stile Varco (sfondo fisso, personaggi che scorrono) prima di tornare al testo.

- Documento di design: https://claude.ai/artifact/Cak2nZbwT6Wx4hm5eQgWQi
- Stato: **Fase 0, basi di gioco e scene**
- Stile grafico: [docs/stile-grafico.md](docs/stile-grafico.md)

## Provarlo in locale

Serve Node.js 20 o più recente.

```bash
npm install
cp .env.example .env.local   # facoltativo: senza chiavi gira in modalità demo
npm run dev
```

Poi apri http://localhost:3000.

| Pagina | Cosa fa |
| --- | --- |
| `/stanza` | **Gioca con gli amici**: crei una stanza, mandi il link, fino a 4 giocatori nello stesso racconto |
| `/crea` | "Chi sei?": ti racconti, il gioco crea il tuo personaggio (con illustrazione se c'è `OPENAI_API_KEY`) e lo usa in ogni scena |
| `/galleria` | Eroi e bestiario per universo, con il prompt per generare l'illustrazione |
| `/arena` | Scegli eroe e nemico, scrivi la mossa, il server tira i dadi, parte la scena, poi si torna al testo |
| `/laboratorio` | Prova ogni personaggio, arena, mossa ed esito, e blocca la scena a un istante |

Con `ANTHROPIC_API_KEY` in `.env.local`, Claude crea l'Essenza del personaggio, interpreta le mosse scritte e
racconta nelle stanze. Senza chiave si usano ripieghi a parole chiave.

Per provare una stanza in più giocatori in locale basta aprire lo stesso link in due browser diversi
(o una finestra normale e una in incognito).

## Giocare online

Il sito va su Vercel con le stanze salvate su Supabase: i passi sono in [docs/pubblicare.md](docs/pubblicare.md).

## Struttura

```
src/
  app/                 pagine Next.js e API (/api/personaggio, /api/mossa)
  components/scena/    scene 2D a cartoncini: figure segnaposto, sfondi, regia e carte
  data/                universi, eroi pronti e bestiario (contenuti modificabili)
  lib/grafica/         prompt con lo stile fisso per le illustrazioni definitive
  lib/rules/           motore regole deterministico (dadi con seme, combattimento) + test
  lib/gm/              Claude come GM (solo server) e ripieghi demo
  lib/personaggio/     schema dell'Essenza, generatore demo, salvataggio locale
  lib/stanza/          stanze multigiocatore: regole del giro e dei turni, archivio (memoria o Supabase)
supabase/schema.sql    tabelle da creare su Supabase
```

## Roadmap

1. **Fase 0 (in corso):** basi. Fatto: motore regole, 2 universi, 8 eroi, 8 nemici, scene a cartoncini con
   12 archetipi × 8 elementi. Prossimo: illustrazioni definitive al posto dei segnaposto.
2. **Fase 1:** login, squadra da 4, turni di 12 ore con notifiche, Supabase.
3. **Fase 2:** Nexus, Post-apocalisse e Spazio, Essenza e Forma, oggetti che mutano.
4. **Fase 3:** viaggio nel tempo con rami e Paradosso, fusione, Divoratore di Realtà.
