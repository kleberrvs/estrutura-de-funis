import type { EtapaData, EtapaNode, LeadEdge } from "../types";

/**
 * Funil do Embaixador (convite/indicação), transcrito do desenho do Kleber
 * de 14/09/2026: convite 1:1 → LP de cadastro com vídeo → pop-up de cadastro
 * → RevCoins → acesso à Rév; anúncios → forms nativo → RevCoins e grupo de
 * WhatsApp; jornada de engajamento; nota do fluxo de envio do convite.
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

export const nosEmbaixador: EtapaNode[] = [
  no("convite-1a1", 0, 0, { tipo: "whatsapp", titulo: "Convite 1:1 (outbound)", texto: "Copy de convite com link da LP\nConvite por direct e WhatsApp" }),
  no("pagina-cadastro", 560, 0, { tipo: "pagina", titulo: "Página de Cadastro", url: "https://revolucao.com.br/k/simulacoes/video-convite/", texto: "LP convite com vídeo do RevCoins" }),
  no("popup-cadastro", 1120, 0, { tipo: "popup", titulo: "Pop-up cadastro", texto: "Cadastro do indicador com avaliação de perfil" }),
  no("revcoins", 1680, 0, { tipo: "pagina", titulo: "RevCoins", url: "https://revolucao.com.br/k/simulacoes/indique-e-ganhe/", texto: "Link de convites\nSaldo\nRevShop\nLink para Rév" }),
  no("revolucao", 2240, 0, { tipo: "pagina", titulo: "Revolução", url: "https://revolucao.com.br/conta/criar", texto: "Acesso à Rév" }),

  no("ads-forms", 0, 720, { tipo: "anuncio", titulo: "Anúncios Direto", canal: "Meta Ads", texto: "Campanhas para Forms\nOtimizada para Lead\nOtimizada para compra" }),
  no("forms-meta", 560, 720, { tipo: "formulario", titulo: "Forms Nativo Meta", texto: "Nome\nTelefone\nE-mail" }),
  no("grupo-whats", 1120, 900, { tipo: "whatsapp", titulo: "Grupo de WhatsApp", texto: "Grupo dos embaixadores: novidades, convites e suporte" }),
  no("jornada-engajamento", 1680, 900, { tipo: "email", titulo: "Jornada Engajamento", texto: "Sequência de engajamento dos embaixadores" }),

  no("nota-envio", 0, 1320, { tipo: "nota", titulo: "Fluxo de envio do convite", texto: "FLUXO DE ENVIO DO CONVITE\n1. Embaixador Rév copia o link e envia no WhatsApp do convidado\n2. Link CTW embedado" }),
];

export const setasEmbaixador: LeadEdge[] = [
  seta("convite-1a1", "pagina-cadastro"),
  seta("pagina-cadastro", "popup-cadastro"),
  seta("popup-cadastro", "revcoins"),
  seta("revcoins", "revolucao"),
  seta("ads-forms", "forms-meta"),
  seta("forms-meta", "revcoins"),
  seta("forms-meta", "grupo-whats"),
  seta("popup-cadastro", "grupo-whats"),
];
