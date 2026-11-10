import { GiocoInStanza } from "@/components/stanza/GiocoInStanza";

export default async function PaginaStanza({ params }: { params: Promise<{ codice: string }> }) {
  const { codice } = await params;
  return <GiocoInStanza codice={codice.toUpperCase()} />;
}
