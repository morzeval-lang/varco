-- VARCO: tabelle per le stanze multigiocatore.
-- Da incollare una volta nel SQL Editor di Supabase (Project → SQL Editor → New query → Run).
-- Le tabelle sono chiuse al pubblico (RLS attiva, nessuna policy): ci accede solo il server di VARCO
-- con la chiave segreta, mai il browser.

create table if not exists public.stanze (
  codice        text primary key,
  versione      integer not null default 0,
  dati          jsonb not null,
  creata_il     timestamptz not null default now(),
  aggiornata_il timestamptz not null default now()
);

create table if not exists public.ritratti (
  stanza    text not null references public.stanze (codice) on delete cascade,
  giocatore text not null,
  immagine  text not null,
  primary key (stanza, giocatore)
);

alter table public.stanze enable row level security;
alter table public.ritratti enable row level security;

-- Facoltativo, per fare pulizia ogni tanto: cancella le stanze ferme da più di 30 giorni.
-- delete from public.stanze where aggiornata_il < now() - interval '30 days';
