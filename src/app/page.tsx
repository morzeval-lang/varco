import Link from "next/link";

export default function Home() {
  return (
    <main className="contenitore">
      <h1 style={{ fontSize: "2.5rem", letterSpacing: "0.2em" }}>VARCO</h1>
      <p className="tenue">
        Gioco di ruolo testuale a turni nel multiverso. Si gioca scrivendo; i momenti clou diventano scene a cartoncini in stile anime d'azione anni '90.
      </p>
      <Link href="/stanza" className="pannello" style={{ display: "block", marginTop: 24, textDecoration: "none", color: "inherit", borderColor: "var(--accento)" }}>
        <h2>⚔ Gioca con gli amici</h2>
        <p className="tenue" style={{ margin: 0 }}>Crea una stanza, manda il link alla squadra (fino a 4) e vivete l&apos;avventura insieme: ognuno scrive cosa fa, il GM racconta, negli scontri si va a turno.</p>
      </Link>
      <div className="griglia-2" style={{ marginTop: 16 }}>
        <Link href="/crea" className="pannello" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>1. Chi sei?</h2>
          <p className="tenue">Raccontati: aspetto, storia, come combatti. Il gioco crea il tuo personaggio e da lì sarai tu in ogni scena.</p>
        </Link>
        <Link href="/arena" className="pannello" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>2. Arena</h2>
          <p className="tenue">Scegli eroe e nemico, scrivi la mossa: il codice tira i dadi, parte la scena, poi si torna al testo.</p>
        </Link>
        <Link href="/galleria" className="pannello" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>Galleria</h2>
          <p className="tenue">Eroi e bestiario dei Regni di Calceterna e delle Lande di Cenere.</p>
        </Link>
        <Link href="/laboratorio" className="pannello" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>Laboratorio</h2>
          <p className="tenue">Prova ogni mossa su ogni personaggio e ferma la scena a un istante.</p>
        </Link>
      </div>
    </main>
  );
}
