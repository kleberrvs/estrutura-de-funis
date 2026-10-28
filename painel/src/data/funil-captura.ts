import type { EtapaData, EtapaNode, LeadEdge } from "../types";

/**
 * Funil de Captação (18/09/2026, pedido do Kleber): anúncio reaproveitando
 * os banners existentes (Materiais/Artes Higgsfield) → página de captura
 * nova (modelo Topo 06 da Vitrine) → e-mail imediato + WhatsApp de boas-vindas
 * → entra na régua de e-mails já documentada no modelo "Fluxos de E-mail" →
 * página de vendas. Nota à parte sobre a base de 1.600 e-mails (oportunidade
 * futura de reativação; a campanha de lançamento vai só para quem entrar
 * novo pela página).
 */
const zero = { entradas: 0, avancaram: 0, ativos: 0 };
const no = (id: string, x: number, y: number, data: Omit<EtapaData, "stats">): EtapaNode => ({
  id,
  type: "etapa",
  position: { x, y },
  data: { ...data, stats: { ...zero } },
});
const seta = (source: string, target: string): LeadEdge => ({
  id: `${source}>${target}`,
  type: "lead",
  source,
  target,
  data: { passagens: 0 },
});

export const nosCaptura: EtapaNode[] = [
  no("ads-captura", 0, 0, { tipo: "anuncio", titulo: "Anúncios de Captação", canal: "Meta Ads", texto: "Reaproveita os banners existentes:\nCanivete (sistema completo)\nCemitério do cursinho tradicional\nLabirinto (fila de alunos)" }),
  no("pagina-captura", 560, 0, { tipo: "pagina", titulo: "Página de Captura", url: "https://revolucao.com.br/k/pagina-de-captura/", texto: "\"Um time de inteligências artificiais trabalha com você até a aprovação, na Revolução Concursos.\"\nAcesso a todos os concursos. Oferta de lançamento." }),
  no("email-boasvindas", 1120, -180, { tipo: "email", titulo: "E-mail imediato", texto: "Assunto: Seu time de inteligências artificiais já está pronto\nMesma manchete e CTA da página (Quero ver minha trilha)" }),
  no("whats-boasvindas", 1120, 180, { tipo: "whatsapp", titulo: "WhatsApp de boas-vindas", texto: "Oi! Aqui é da Revolução Concursos.\nUm time de inteligências artificiais já está montando sua trilha.\nAcesso a todos os concursos, oferta de lançamento." }),
  no("regua-emails", 1680, 0, { tipo: "email", titulo: "Entra na régua de e-mails", texto: "Segue no fluxo de Ativação já existente\n(ver modelo Fluxos de E-mail)" }),
  no("pagina-vendas", 2240, 0, { tipo: "pagina", titulo: "Página de Vendas", url: "https://revolucao.com.br/k/pagina-de-vendas/", texto: "Assinatura com acesso a todos os concursos\nneste primeiro momento" }),

  no("nota-1600", 0, 560, { tipo: "nota", titulo: "Base de 1.600 e-mails", texto: "BASE DE REATIVAÇÃO (não entra nesta campanha)\n1.600 e-mails já cadastrados, dá para segmentar depois\nLançamento: só quem entrar novo pela página de captura" }),
];

export const setasCaptura: LeadEdge[] = [
  seta("ads-captura", "pagina-captura"),
  seta("pagina-captura", "email-boasvindas"),
  seta("pagina-captura", "whats-boasvindas"),
  seta("email-boasvindas", "regua-emails"),
  seta("whats-boasvindas", "regua-emails"),
  seta("regua-emails", "pagina-vendas"),
];
