import Link from "next/link";

export default function Home() {
  return (
    <main className="contenitore">
      <h1 style={{ fontSize: "2.5rem", letterSpacing: "0.2em" }}>VARCO</h1>
      <p className="tenue">
        Gioco di ruolo testuale a turni nel multiverso. Si gioca scrivendo; i momenti clou diventano scene a cartoncini in stile anime.
      </p>
      <div className="griglia-2" style={{ marginTop: 24 }}>
        <Link href="/crea" className="pannello" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>1. Crea il personaggio</h2>
          <p className="tenue">Descrivilo a parole o parti da un eroe pronto, e guarda la sua carta.</p>
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
