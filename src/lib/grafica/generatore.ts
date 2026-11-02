import "server-only";

/**
 * Generatore d'immagini per i ritratti dei giocatori, dietro un'interfaccia piccola così si può cambiare fornitore.
 * Senza chiave il gioco non si ferma: il personaggio resta con la figura SVG disegnata dal codice.
 *
 * Fornitore attuale: OpenAI Images, che restituisce direttamente un PNG con lo sfondo trasparente,
 * proprio quello che serve a un cartoncino.
 */

const MODELLO = process.env.VARCO_IMMAGINI_MODELLO || "gpt-image-1";

export function generatoreDisponibile(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Restituisce l'immagine come data URL PNG (1024×1024, sfondo trasparente). */
export async function generaRitratto(prompt: string): Promise<string> {
  const risposta = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: MODELLO,
      prompt,
      size: "1024x1024",
      background: "transparent",
      output_format: "png",
      quality: "medium",
      n: 1,
    }),
  });
  if (!risposta.ok) {
    throw new Error(`Generatore d'immagini: ${risposta.status} ${(await risposta.text()).slice(0, 300)}`);
  }
  const dati = (await risposta.json()) as { data?: { b64_json?: string }[] };
  const b64 = dati.data?.[0]?.b64_json;
  if (!b64) throw new Error("Generatore d'immagini: risposta senza immagine");
  return `data:image/png;base64,${b64}`;
}
