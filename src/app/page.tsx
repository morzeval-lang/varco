import Link from "next/link";

export default function Home() {
  return (
    <main className="contenitore">
      <h1 style={{ fontSize: "2.5rem", letterSpacing: "0.2em" }}>VARCO</h1>
      <p className="tenue">
        Gioco di ruolo testuale a turni nel multiverso. Fase 0: i due prototipi 3D.
      </p>
      <div className="griglia-2" style={{ marginTop: 24 }}>
        <Link href="/crea" className="pannello" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>1. Crea il personaggio</h2>
          <p className="tenue">Descrivilo a parole e guardalo in 3D sul piedistallo.</p>
        </Link>
        <Link href="/arena" className="pannello" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>2. Arena</h2>
          <p className="tenue">Scrivi la tua mossa: il codice tira i dadi, la scena clou parte in 3D, poi si torna al testo.</p>
        </Link>
      </div>
    </main>
  );
}
