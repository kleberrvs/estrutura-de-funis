import type { EtapaNode, LeadEdge } from "../types";

const zero = { entradas: 0, avancaram: 0, ativos: 0 };
const pagina = (id: string, titulo: string, url: string, x: number, y: number): EtapaNode => ({
  id,
  type: "etapa",
  position: { x, y },
  data: { tipo: "pagina", titulo, url, stats: { ...zero } },
});

/** Funil real de partida: Quiz e Blog levam à Página inicial, que leva a Vendas. */
export const nosIniciais: EtapaNode[] = [
  pagina("quiz", "Quiz", "https://revolucao.com.br/k/quiz/", 0, -220),
  pagina("blog", "Blog", "https://revolucao.com.br/k/blog/", 0, 440),
  pagina("pagina-inicial", "Página inicial", "https://revolucao.com.br/k/pagina-inicial/", 600, 110),
  pagina("pagina-de-vendas", "Página de vendas", "https://revolucao.com.br/k/pagina-de-vendas/", 1200, 110),
];

const seta = (source: string, target: string): LeadEdge => ({
  id: `${source}>${target}`,
  type: "lead",
  source,
  target,
  data: { passagens: 0 },
});

export const setasIniciais: LeadEdge[] = [
  seta("quiz", "pagina-inicial"),
  seta("blog", "pagina-inicial"),
  seta("pagina-inicial", "pagina-de-vendas"),
];

/** Nomes fictícios para o modo demo. */
export const nomesDemo = [
  "Ana Paula", "Bruno", "Carla", "Diego", "Eduarda", "Felipe", "Gabriela",
  "Henrique", "Isabela", "João", "Karen", "Lucas", "Mariana", "Nathan",
  "Olívia", "Pedro", "Rafaela", "Samuel", "Tainá", "Vinícius",
];
