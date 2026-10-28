import type { MetricasDia } from "./types";

/** Endereço do backend (miniaturas e Search Console). Sem ele, o painel funciona só no navegador. */
export const API: string | null = import.meta.env.VITE_FUNIL_API ?? null;

/** Miniatura real da página; `versao` muda o endereço para forçar recarga. */
const GERACAO = 3; // subir este número força todos os navegadores a buscar prints novos
export const thumbUrl = (url: string, versao = 0) =>
  API && `${API}/thumb?url=${encodeURIComponent(url)}&g=${GERACAO}${versao ? `&v=${versao}` : ""}`;

/** Impressões e cliques do último dia disponível; null se não conectado. */
export async function metricasDia(url: string): Promise<MetricasDia | null> {
  if (!API) return null;
  try {
    const r = await fetch(`${API}/metricas-dia?url=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    return (await r.json()) as MetricasDia;
  } catch {
    return null;
  }
}

/** Pede ao servidor um print novo (ignora o cache) e espera ficar pronto. */
export async function renovarThumb(url: string) {
  if (!API) return;
  const r = await fetch(`${API}/thumb?url=${encodeURIComponent(url)}&refresh=1`);
  if (!r.ok) throw new Error("falha ao renovar miniatura");
}
