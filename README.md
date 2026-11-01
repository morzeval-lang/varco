# VARCO

Gioco di ruolo testuale a turni ambientato in un multiverso, giocabile da web app.
Si gioca scrivendo; un Game Master AI interpreta e racconta, il codice tira i dadi, e i momenti clou
diventano scene 3D di pochi secondi prima di tornare al testo.

- Documento di design: https://claude.ai/artifact/Cak2nZbwT6Wx4hm5eQgWQi
- Stato: **Fase 0, prototipi 3D**

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
| `/crea` | Descrivi il personaggio a parole e lo vedi in 3D sul piedistallo |
| `/arena` | Scrivi la mossa, il server tira i dadi, parte la scena 3D, poi si torna al testo |
| `/laboratorio` | Prova ogni archetipo ed elemento, blocca la scena a un istante |

Con `ANTHROPIC_API_KEY` in `.env.local`, Claude crea l'Essenza del personaggio e interpreta le mosse scritte.
Senza chiave si usano ripieghi a parole chiave.

## Struttura

```
src/
  app/                 pagine Next.js e API (/api/personaggio, /api/mossa)
  components/three/    personaggio procedurale, piedistallo, arena e regia delle scene
  lib/rules/           motore regole deterministico (dadi con seme, combattimento) + test
  lib/gm/              Claude come GM (solo server) e ripieghi demo
  lib/personaggio/     schema dell'Essenza, generatore demo, salvataggio locale
```

## Roadmap

1. **Fase 0 (in corso):** prototipi 3D. Fatto: personaggio dal kit modulare, arena con 12 archetipi × 8 elementi.
   Prossimo: modello 3D generato con Tripo o Meshy al posto del kit.
2. **Fase 1:** login, squadra da 4, turni di 12 ore con notifiche, Supabase.
3. **Fase 2:** Nexus, Post-apocalisse e Spazio, Essenza e Forma, oggetti che mutano.
4. **Fase 3:** viaggio nel tempo con rami e Paradosso, fusione, Divoratore di Realtà.
