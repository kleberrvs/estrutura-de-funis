import type { EtapaNode, LeadEdge, Stats } from "./types";

/** Um fato registrado no funil, com as dimensões que os filtros usam. */
export type Evento = {
  t: number; // quando
  tipo: "entrou" | "avancou" | "saiu";
  leadId: string;
  nodeId: string; // etapa onde aconteceu (para "avancou", a etapa de origem)
  edgeId?: string; // seta percorrida (em "entrou" vindo de outra etapa)
  dispositivo: string; // Desktop, Celular, Tablet
  fonte: string; // Google Ads, WhatsApp, Acesso direto...
  campanha: string; // utm_campaign ou "(sem campanha)"
};

export const TODOS = "todos";
export type Comparar = "nenhum" | "5" | "15" | "60"; // minutos da janela

export type Filtros = { dispositivo: string; fonte: string; campanha: string; comparar: Comparar };
export const FILTROS_VAZIOS: Filtros = { dispositivo: TODOS, fonte: TODOS, campanha: TODOS, comparar: "nenhum" };

export const filtroAtivo = (f: Filtros) =>
  f.dispositivo !== TODOS || f.fonte !== TODOS || f.campanha !== TODOS || f.comparar !== "nenhum";

const bate = (e: Evento, f: Filtros) =>
  (f.dispositivo === TODOS || e.dispositivo === f.dispositivo) &&
  (f.fonte === TODOS || e.fonte === f.fonte) &&
  (f.campanha === TODOS || e.campanha === f.campanha);

/** Valores distintos de cada dimensão, para montar as listas dos filtros. */
export function opcoesDe(eventos: Evento[]) {
  const set = (k: "dispositivo" | "fonte" | "campanha") => [...new Set(eventos.map((e) => e[k]))].sort();
  return { dispositivo: set("dispositivo"), fonte: set("fonte"), campanha: set("campanha") };
}

/**
 * Recalcula entradas/avançaram por etapa e passagens por seta a partir do
 * registro, respeitando os filtros e, se houver, a janela de tempo [t0, t1).
 */
export function statsDeEventos(eventos: Evento[], filtros: Filtros, janela?: [number, number]) {
  const porNo = new Map<string, Stats>();
  const porSeta = new Map<string, number>();
  const pega = (id: string) => porNo.get(id) ?? (porNo.set(id, { entradas: 0, avancaram: 0, ativos: 0 }), porNo.get(id)!);
  for (const e of eventos) {
    if (!bate(e, filtros)) continue;
    if (janela && (e.t < janela[0] || e.t >= janela[1])) continue;
    if (e.tipo === "entrou") {
      pega(e.nodeId).entradas++;
      if (e.edgeId) porSeta.set(e.edgeId, (porSeta.get(e.edgeId) ?? 0) + 1);
    } else if (e.tipo === "avancou") {
      pega(e.nodeId).avancaram++;
    }
  }
  return { porNo, porSeta };
}

/** Aplica as stats filtradas aos blocos/setas só para exibição (o estado real não muda). */
export function aplicarFiltro(nodes: EtapaNode[], edges: LeadEdge[], porNo: Map<string, Stats>, porSeta: Map<string, number>, ativosPorNo: Map<string, number>) {
  const ns = nodes.map((n) => {
    const s = porNo.get(n.id);
    return { ...n, data: { ...n.data, stats: { entradas: s?.entradas ?? 0, avancaram: s?.avancaram ?? 0, ativos: ativosPorNo.get(n.id) ?? 0 } } };
  });
  const es = edges.map((e) => ({ ...e, data: { passagens: porSeta.get(e.id) ?? 0 } }));
  return { nodes: ns, edges: es };
}
