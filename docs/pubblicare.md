# Pubblicare VARCO online (Vercel + Supabase)

Obiettivo: un indirizzo tipo `https://varco-xxx.vercel.app` da aprire nel browser, dove crei una stanza e
mandi il link agli amici. Servono due account gratuiti, entrambi si aprono con "Continua con GitHub".
Tempo: circa 15 minuti.

## 1. Supabase (il database delle stanze)

1. Vai su https://supabase.com e accedi con GitHub.
2. **New project**: nome `varco`, scegli una password per il database (salvala, ma a VARCO non serve),
   regione **Central EU (Frankfurt)**. Aspetta che finisca di prepararsi.
3. Apri **SQL Editor → New query**, incolla tutto il contenuto di [`supabase/schema.sql`](../supabase/schema.sql)
   e premi **Run**. Deve dire "Success".
4. Apri **Project Settings → Data API** e copia il **Project URL** (`https://xxxx.supabase.co`).
5. Apri **Project Settings → API Keys** e copia la **Secret key** (inizia con `sb_secret_`).
   È una chiave segreta: va solo su Vercel, mai in chat pubbliche o nel codice.

## 2. Vercel (il sito)

1. Vai su https://vercel.com e accedi con GitHub.
2. **Add New → Project**, scegli il repository `morzeval-lang/varco` e premi **Import**
   (se non lo vedi, dai a Vercel il permesso di leggere il repo).
3. Prima di **Deploy**, apri **Environment Variables** e aggiungi:

   | Nome | Valore |
   | --- | --- |
   | `SUPABASE_URL` | il Project URL del punto 1.4 |
   | `SUPABASE_SECRET_KEY` | la Secret key del punto 1.5 |
   | `VARCO_DICE_SECRET` | una frase lunga a caso, solo tua (serve ai dadi) |
   | `ANTHROPIC_API_KEY` | facoltativa: la chiave di Claude per il GM vero (https://platform.claude.com) |
   | `OPENAI_API_KEY` | facoltativa: per i ritratti generati in "Chi sei?" |

4. **Deploy**. Dopo un paio di minuti Vercel ti dà l'indirizzo del sito.

Da quel momento ogni modifica unita su `main` va online da sola. Le pull request hanno un'anteprima con un
indirizzo tutto loro, utile per provare una novità prima di unirla.

## 3. Primo test

1. Apri il sito, **Gioca con gli amici → Crea la stanza**.
2. Premi **Copia il link d'invito** e mandalo alla squadra (fino a 4).
3. Ognuno entra col suo personaggio ("Chi sei?") o con un eroe d'esempio.
4. Ognuno scrive cosa fa; quando avete scritto tutti il GM racconta. Quando arriva un nemico si va a turno.

Senza `ANTHROPIC_API_KEY` il GM gira in modalità demo: racconta a parole chiave ed è utile solo per provare i turni.
Con la chiave racconta davvero; una serata di prova costa pochi euro (si può fissare un tetto di spesa
nella console di Claude).

## Se qualcosa non va

- **"Manca il database: online le stanze possono sparire"** in cima alla stanza: `SUPABASE_URL` o
  `SUPABASE_SECRET_KEY` non sono impostate su Vercel. Aggiungile e rifai il deploy (Deployments → Redeploy).
- **"Qualcosa si è inceppato nel Varco"**: su Vercel, apri il progetto → **Logs** e cerca la riga rossa.
  Di solito è una chiave copiata male o lo schema SQL non eseguito.
