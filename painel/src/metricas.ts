import type { LeadEdge, EtapaNode } from "./types";

/** Números de um funil: quem entrou, quem está ativo, quem chegou ao fim. */
export const TICKET_PADRAO = 1497; // R$ do plano (simulação da página de convite)

export function metricasDoFunil(nodes: EtapaNode[], edges: LeadEdge[], ticket = TICKET_PADRAO) {
  const conta = nodes.filter((n) => !["nota", "audiencia", "espera", "saida"].includes(n.data.tipo));
  const inicio = conta.filter((n) => !edges.some((e) => e.target === n.id));
  const fim = conta.filter((n) => !edges.some((e) => e.source === n.id));
  const entraram = inicio.reduce((s, n) => s + n.data.stats.entradas, 0);
  const chegaram = fim.reduce((s, n) => s + n.data.stats.entradas, 0);
  const ativos = nodes.reduce((s, n) => s + n.data.stats.ativos, 0);
  const conversao = entraram ? Math.round((chegaram / entraram) * 100) : null;
  const compras = nodes.filter((n) => n.data.tipo === "checkout").reduce((s, n) => s + n.data.stats.entradas, 0);
  const receita = compras * ticket;
  return { entraram, chegaram, ativos, conversao, compras, receita, etapas: nodes.length };
}

/**
 * Etapas na ordem em que o lead percorre (das entradas para o fim), sem
 * notas nem blocos compactos; cada etapa diz quantos passos compactos
 * (D1, D2…) vêm logo depois dela.
 */
export function etapasEmOrdem(nodes: EtapaNode[], edges: LeadEdge[]) {
  const porId = new Map(nodes.map((n) => [n.id, n]));
  const saidas = (id: string) => edges.filter((e) => e.source === id).map((e) => e.target);

  // Quantas etapas cada entrada alcança: o ramo mais longo vem primeiro.
  const alcance = (id: string, vistos = new Set<string>()): number => {
    if (vistos.has(id)) return 0;
    vistos.add(id);
    return 1 + saidas(id).reduce((s, t) => s + alcance(t, vistos), 0);
  };
  const entradas = nodes
    .filter((n) => !edges.some((e) => e.target === n.id))
    .sort((a, b) => alcance(b.id) - alcance(a.id));

  // Segue cada caminho até o fim antes de voltar para o próximo ramo.
  const visitados = new Set<string>();
  const ordem: EtapaNode[] = [];
  const seguir = (id: string) => {
    if (visitados.has(id)) return;
    visitados.add(id);
    const n = porId.get(id);
    if (n) ordem.push(n);
    saidas(id).forEach(seguir);
  };
  entradas.forEach((n) => seguir(n.id));
  nodes.forEach((n) => seguir(n.id));

  return ordem
    .filter((n) => n.data.tipo !== "nota" && n.data.tipo !== "espera" && !n.data.compacto)
    .map((n) => {
      let passos = 0;
      let atual = n.id;
      for (;;) {
        const alvo = porId.get(saidas(atual)[0] ?? "");
        if (!alvo?.data.compacto) break;
        passos++;
        atual = alvo.id;
      }
      return { node: n, passos };
    });
}

export const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtPct = (v: number | null) => (v === null ? "–" : `${v}%`);
