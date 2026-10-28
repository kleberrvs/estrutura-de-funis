import type { EtapaData, EtapaNode, LeadEdge } from "../types";

/**
 * Funil VSL da plataforma, transcrito do desenho do Kleber (14/09/2026):
 * anúncios → LP com VSL → pop-up → checkout Hotmart → boas-vindas, forms
 * nativo do Meta, jornadas de HSM e e-mail (D1 a D7), remarketing.
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

const dias = (prefixo: string, tipo: "whatsapp" | "email", x0: number, y: number, texto: (d: number) => string) =>
  [1, 2, 3, 4, 5, 6, 7].map((d) => no(`${prefixo}-d${d}`, x0 + (d - 1) * 340, y, { tipo, titulo: `D${d}`, texto: texto(d), compacto: true }));

const cadeia = (prefixo: string, origem: string) =>
  [1, 2, 3, 4, 5, 6, 7].map((d) => seta(d === 1 ? origem : `${prefixo}-d${d - 1}`, `${prefixo}-d${d}`));

/** Exemplos de mensagem para as jornadas D1 a D7 (para editar; não são a versão final). */
const MENSAGENS_WHATSAPP = [
  "Oi, {{nome}}! Aqui é o Rév, da Revolução Concursos. Vi que você conheceu o nosso método e parou antes de finalizar. Ficou alguma dúvida? Pode me responder por aqui mesmo.",
  "{{nome}}, uma pergunta rápida: qual concurso você está mirando? Me conta que eu te mostro como a plataforma organiza o seu estudo para ele.",
  "Estudar muito não é o mesmo que estudar o que cai. A Revolução te diz o que estudar hoje, na ordem certa. Quer ver por dentro? {{link}}",
  "{{nome}}, separei um material gratuito para você começar ainda hoje: {{link_material}}",
  "Muita gente começa animada e larga em duas semanas. A plataforma foi feita para isso não acontecer com você. Posso te mostrar como? {{link}}",
  "{{nome}}, o seu plano de passar no concurso continua de pé? Se quiser retomar, o caminho está aqui: {{link}}",
  "Última mensagem desta semana, {{nome}}. Se não for a hora, tudo bem. Se for, é só tocar aqui: {{link}}. Bons estudos!",
];
const EMAILS = [
  "Assunto: Você parou no meio do caminho\nOi, {{nome}}. Vi que você conheceu a Revolução e não finalizou. Se ficou alguma dúvida, é só responder este e-mail que alguém do time te responde. [Botão: Voltar para a página]",
  "Assunto: Qual concurso é o seu?\nCada concurso pede um plano diferente. Responda este e-mail com o seu e a gente te mostra como a plataforma monta o estudo para ele.",
  "Assunto: O que estudar hoje\nO maior desperdício de quem estuda para concurso é passar horas no que não cai. A Revolução organiza o que estudar a cada dia, na ordem certa. [Botão: Ver a plataforma]",
  "Assunto: Um material gratuito para você\nSeparamos um material para você começar hoje, sem pagar nada. [Botão: Baixar o material]",
  "Assunto: Por que tanta gente desiste\nComeçar é fácil. O difícil é continuar na terceira semana. A plataforma foi pensada para você não largar no meio. [Botão: Entender como funciona]",
  "Assunto: Ainda está de pé?\n{{nome}}, o seu plano de passar continua valendo? Se quiser retomar, o caminho está aqui. [Botão: Retomar]",
  "Assunto: Último e-mail desta sequência\nEste é o último e-mail da semana. Se não for a hora, tudo bem, a gente continua por aqui. Se for, é só clicar. [Botão: Começar agora]",
];

export const nosVsl: EtapaNode[] = [
  no("ads-lp", 0, 0, { tipo: "anuncio", titulo: "Anúncios Direto · LP", canal: "Meta Ads", texto: "Campanhas para LP\nOtimizada para Lead\nOtimizada para compra" }),
  no("lp-vendas", 560, 0, { tipo: "pagina", titulo: "Página de Vendas", url: "https://revolucao.com.br/k/pagina-de-vendas/", texto: "LP venda com VSL\n1. VSL embedada com preço\n2. Copy da página sem preço\n3. Botão com CTA para ver oferta" }),
  no("popup", 1120, 0, { tipo: "popup", titulo: "Pop-up pré-checkout", texto: "Coleta nome, telefone e e-mail antes de abrir o checkout" }),
  no("checkout", 1680, 0, { tipo: "checkout", titulo: "Checkout Hotmart", canal: "Hotmart", texto: "Checkout com vídeo no header\n1. Vídeo de pitch e reforço da oferta\n2. Auto-complete com dados do pop-up" }),
  no("boas-vindas", 2240, 0, { tipo: "pagina", titulo: "Página de boas-vindas", url: "https://revolucao.com.br/k/pagina-inicial/", texto: "Página de obrigado" }),

  no("ads-forms", 0, 720, { tipo: "anuncio", titulo: "Anúncios Direto · Forms", canal: "Meta Ads", texto: "Campanhas para Forms\nOtimizada para Lead\nOtimizada para compra" }),
  no("forms-meta", 560, 720, { tipo: "formulario", titulo: "Forms Nativo Meta", texto: "Nome\nTelefone\nE-mail" }),

  no("jornada-hsm", 1120, 1160, { tipo: "whatsapp", titulo: "Jornada de HSM", texto: "Sequência de 7 mensagens (D1 a D7) para quem entrou pelo pop-up ou pelo forms" }),
  ...dias("hsm", "whatsapp", 1680, 1190, (d) => MENSAGENS_WHATSAPP[d - 1]),
  no("jornada-email", 1120, 1560, { tipo: "email", titulo: "Jornada E-mail", texto: "Sequência de 7 e-mails (D1 a D7)" }),
  ...dias("mail", "email", 1680, 1590, (d) => EMAILS[d - 1]),
  no("nota-ataque", 2300, 1040, { tipo: "nota", titulo: "ATAQUE SOVIÉTICO", texto: "ATAQUE SOVIÉTICO\nJornadas de HSM e e-mail em paralelo por 7 dias" }),
  no("audiencias", 1120, 1920, { tipo: "audiencia", titulo: "Audiências RMKT", texto: "Videoview\nPageview\nLead cadastrado" }),

  no("ads-rmkt", 0, 2300, { tipo: "anuncio", titulo: "Anúncios Direto · Rév", canal: "Meta Ads", texto: "Campanhas para rév\nPúblicos de:\n• Videoview\n• Pageview\n• Lead cadastrado" }),
  no("rmkt-concursos", 560, 2300, { tipo: "pagina", titulo: "RMKT: pagina-de-concurso", url: "https://revolucao.com.br/k/pagina-de-concursos/" }),
];

export const setasVsl: LeadEdge[] = [
  seta("ads-lp", "lp-vendas"),
  seta("lp-vendas", "popup"),
  seta("popup", "checkout"),
  seta("popup", "jornada-hsm"),
  seta("checkout", "boas-vindas"),
  seta("ads-forms", "forms-meta"),
  seta("forms-meta", "checkout"),
  seta("forms-meta", "jornada-hsm"),
  ...cadeia("hsm", "jornada-hsm"),
  ...cadeia("mail", "jornada-email"),
  seta("ads-rmkt", "rmkt-concursos"),
];
