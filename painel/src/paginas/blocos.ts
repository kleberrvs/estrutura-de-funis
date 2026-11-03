import logoColorido from "./marca/logo-colorido.svg?inline";
import logoBranco from "./marca/logo-branco.svg?inline";
import logoEscuro from "./marca/logo-escuro.svg?inline";
import raposa from "./marca/raposa-rev.svg?inline";
import type { DefBloco, TipoBloco } from "./tipos";
import { botao, esc, im, lista, rico, str, tx, urlSegura } from "./html";
import { renderModelo } from "./modeloHtml";

export const LOGO = logoColorido;
/** Imagens da marca (Design System da Revolução) oferecidas na troca de imagem. */
export const IMAGENS_MARCA = [
  { rotulo: "Logo colorida (fundo escuro)", valor: logoColorido },
  { rotulo: "Logo branca", valor: logoBranco },
  { rotulo: "Logo escura (fundo claro)", valor: logoEscuro },
  { rotulo: "Raposa Rév", valor: raposa },
];

/** Ícones de linha no estilo do app (24x24, traço 2). */
const ICONES: Record<string, string> = {
  check: "M20 6 9 17l-5-5",
  relogio: "M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  livro: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z M4 19V5",
  alvo: "M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0 M12 12m-5 0a5 5 0 1 0 10 0 5 5 0 1 0-10 0 M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0",
  faisca: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  escudo: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  calendario: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  raio: "M13 2 4 14h7l-1 8 9-12h-7z",
  repetir: "M17 2l4 4-4 4 M3 11V9a3 3 0 0 1 3-3h15 M7 22l-4-4 4-4 M21 13v2a3 3 0 0 1-3 3H3",
};
const OPCOES_ICONE = [
  { v: "check", r: "Marca de certo" }, { v: "relogio", r: "Relógio" }, { v: "livro", r: "Livro" }, { v: "alvo", r: "Alvo" },
  { v: "faisca", r: "Inteligência artificial" }, { v: "chat", r: "Mentor" }, { v: "escudo", r: "Garantia" },
  { v: "calendario", r: "Calendário" }, { v: "raio", r: "Raio" }, { v: "repetir", r: "Revisão" },
];
const icone = (nome: unknown) =>
  `<span class="pg-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONES[String(nome)] ?? ICONES.check}"/></svg></span>`;

/** Endereço de incorporação de vídeo (YouTube e Vimeo viram embed; o resto passa como está). */
function embed(u: string) {
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = u.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return urlSegura(u);
}

const ALINHA = [{ v: "esquerda", r: "Esquerda" }, { v: "centro", r: "Centralizado" }];

/** Catálogo de blocos. Cada um: campos, dados iniciais e o desenho em HTML. */
export const BLOCOS: Record<TipoBloco, DefBloco> = {
  topo: {
    rotulo: "Topo",
    descricao: "Logo e um botão no alto da página",
    campos: [
      { k: "imagem", chave: "logo", rotulo: "Logo" },
      { k: "bool", chave: "mostrarBotao", rotulo: "Mostrar botão no topo" },
      { k: "texto", chave: "botao", rotulo: "Texto do botão" },
      { k: "link", chave: "link", rotulo: "Endereço do botão" },
    ],
    padrao: () => ({ logo: LOGO, mostrarBotao: true, botao: "Quero entrar", link: "#formulario" }),
    render: (d, c) => `<header class="pg-sec pg-topo"><div class="pg-cx pg-topo-in">${im(c, "logo", d.logo, "pg-logo", "Logo")}${d.mostrarBotao ? botao(c, "botao", d.botao, d.link, "pg-btn-p") : ""}</div></header>`,
  },

  heroi: {
    rotulo: "Destaque",
    descricao: "Título grande, subtítulo, botão e imagem",
    campos: [
      { k: "escolha", chave: "alinha", rotulo: "Alinhamento", opcoes: ALINHA },
      { k: "texto", chave: "etiqueta", rotulo: "Etiqueta" },
      { k: "texto", chave: "titulo", rotulo: "Título" },
      { k: "texto", chave: "subtitulo", rotulo: "Subtítulo" },
      { k: "bool", chave: "mostrarBotao", rotulo: "Mostrar botão" },
      { k: "texto", chave: "botao", rotulo: "Texto do botão" },
      { k: "link", chave: "link", rotulo: "Endereço do botão" },
      { k: "imagem", chave: "imagem", rotulo: "Imagem" },
    ],
    padrao: () => ({ alinha: "esquerda", etiqueta: "Etiqueta", titulo: "Título principal da página", subtitulo: "Subtítulo que explica a promessa em duas linhas.", mostrarBotao: true, botao: "Quero começar", link: "#formulario", imagem: "" }),
    render: (d, c) => {
      const centro = d.alinha === "centro";
      const imagem = d.imagem || c.ed ? im(c, "imagem", d.imagem, "pg-hero-img") : "";
      return `<section class="pg-sec pg-heroi${centro ? " pg-centro" : ""}"><div class="pg-cx pg-hero-in"><div class="pg-hero-txt">${d.etiqueta ? tx(c, "etiqueta", d.etiqueta, "span", "pg-etiqueta") : ""}${tx(c, "titulo", d.titulo, "h1", "pg-h1")}${tx(c, "subtitulo", d.subtitulo, "p", "pg-lede")}${d.mostrarBotao ? botao(c, "botao", d.botao, d.link, "pg-btn-p pg-btn-g") : ""}</div>${imagem}</div></section>`;
    },
  },

  video: {
    rotulo: "Vídeo",
    descricao: "Vídeo incorporado (YouTube, Vimeo, Panda)",
    campos: [
      { k: "texto", chave: "titulo", rotulo: "Título" },
      { k: "link", chave: "url", rotulo: "Endereço do vídeo", dica: "Cole o link do YouTube ou Vimeo" },
      { k: "texto", chave: "legenda", rotulo: "Legenda" },
    ],
    padrao: () => ({ titulo: "Veja como funciona", url: "", legenda: "" }),
    render: (d, c) => {
      const u = str(d.url).trim();
      const caixa = u ? `<iframe src="${esc(embed(u))}" allowfullscreen loading="lazy" title="Vídeo"></iframe>` : `<div class="pg-vazio">Cole o endereço do vídeo no painel ao lado</div>`;
      return `<section class="pg-sec pg-video"><div class="pg-cx pg-estreito">${tx(c, "titulo", d.titulo, "h2", "pg-h2")}<div class="pg-player">${caixa}</div>${d.legenda || c.ed ? tx(c, "legenda", d.legenda, "p", "pg-legenda") : ""}</div></section>`;
    },
  },

  numeros: {
    rotulo: "Números",
    descricao: "Faixa com números de prova (alunos, aprovações)",
    campos: [{ k: "lista", chave: "itens", rotulo: "Números", item: "número", campos: [{ k: "texto", chave: "numero", rotulo: "Número" }, { k: "texto", chave: "rotulo", rotulo: "Descrição" }] }],
    padrao: () => ({ itens: [{ numero: "0", rotulo: "descrição do número" }, { numero: "0", rotulo: "descrição do número" }, { numero: "0", rotulo: "descrição do número" }] }),
    render: (d, c) => `<section class="pg-sec pg-numeros"><div class="pg-cx pg-grade">${lista(d.itens).map((it, i) => `<div class="pg-num">${tx(c, `itens.${i}.numero`, it.numero, "strong")}${tx(c, `itens.${i}.rotulo`, it.rotulo, "span")}</div>`).join("")}</div></section>`,
  },

  beneficios: {
    rotulo: "Benefícios",
    descricao: "Lista de vantagens em cartões",
    campos: [
      { k: "texto", chave: "titulo", rotulo: "Título" },
      { k: "lista", chave: "itens", rotulo: "Benefícios", item: "benefício", campos: [{ k: "escolha", chave: "icone", rotulo: "Ícone", opcoes: OPCOES_ICONE }, { k: "texto", chave: "titulo", rotulo: "Título" }, { k: "texto", chave: "texto", rotulo: "Texto" }] },
    ],
    padrao: () => ({ titulo: "Por que isso funciona", itens: [{ icone: "relogio", titulo: "Primeiro benefício", texto: "Explique em uma frase o que a pessoa ganha." }, { icone: "faisca", titulo: "Segundo benefício", texto: "Explique em uma frase o que a pessoa ganha." }, { icone: "chat", titulo: "Terceiro benefício", texto: "Explique em uma frase o que a pessoa ganha." }] }),
    render: (d, c) => `<section class="pg-sec pg-beneficios"><div class="pg-cx">${tx(c, "titulo", d.titulo, "h2", "pg-h2")}<div class="pg-grade">${lista(d.itens).map((it, i) => `<article class="pg-card pg-destaque">${icone(it.icone)}${tx(c, `itens.${i}.titulo`, it.titulo, "h3", "pg-h3")}${tx(c, `itens.${i}.texto`, it.texto, "p")}</article>`).join("")}</div></div></section>`,
  },

  depoimentos: {
    rotulo: "Depoimentos",
    descricao: "Relatos de alunos com foto e nome",
    campos: [
      { k: "texto", chave: "titulo", rotulo: "Título" },
      { k: "lista", chave: "itens", rotulo: "Depoimentos", item: "depoimento", campos: [{ k: "imagem", chave: "foto", rotulo: "Foto" }, { k: "texto", chave: "texto", rotulo: "Depoimento" }, { k: "texto", chave: "nome", rotulo: "Nome" }, { k: "texto", chave: "papel", rotulo: "Resultado ou cargo" }] },
    ],
    padrao: () => ({ titulo: "Quem já estuda com a gente", itens: [{ foto: "", texto: "Depoimento real, com resultado e prazo.", nome: "Nome do aluno", papel: "Aprovado em" }, { foto: "", texto: "Depoimento real, com resultado e prazo.", nome: "Nome do aluno", papel: "Aprovado em" }] }),
    render: (d, c) => `<section class="pg-sec pg-depoimentos"><div class="pg-cx">${tx(c, "titulo", d.titulo, "h2", "pg-h2")}<div class="pg-grade">${lista(d.itens).map((it, i) => `<figure class="pg-card pg-dep">${tx(c, `itens.${i}.texto`, it.texto, "blockquote")}<figcaption>${im(c, `itens.${i}.foto`, it.foto, "pg-foto", str(it.nome))}<div>${tx(c, `itens.${i}.nome`, it.nome, "strong")}${tx(c, `itens.${i}.papel`, it.papel, "span")}</div></figcaption></figure>`).join("")}</div></div></section>`,
  },

  oferta: {
    rotulo: "Oferta",
    descricao: "Produto, preço, o que está incluso e botão de compra",
    campos: [
      { k: "texto", chave: "titulo", rotulo: "Título" },
      { k: "texto", chave: "produto", rotulo: "Nome do produto" },
      { k: "texto", chave: "precoDe", rotulo: "Preço de" },
      { k: "texto", chave: "preco", rotulo: "Preço por" },
      { k: "texto", chave: "condicao", rotulo: "Condição" },
      { k: "lista", chave: "itens", rotulo: "O que está incluso", item: "item", campos: [{ k: "texto", chave: "texto", rotulo: "Item" }] },
      { k: "texto", chave: "botao", rotulo: "Texto do botão" },
      { k: "link", chave: "link", rotulo: "Endereço do checkout" },
    ],
    padrao: () => ({ titulo: "Garanta a sua vaga", produto: "Nome do produto", precoDe: "R$ 0,00", preco: "R$ 0,00", condicao: "à vista ou parcelado", itens: [{ texto: "Item incluso" }, { texto: "Item incluso" }, { texto: "Item incluso" }], botao: "Quero entrar agora", link: "#" }),
    render: (d, c) => `<section class="pg-sec pg-oferta" id="oferta"><div class="pg-cx pg-estreito">${tx(c, "titulo", d.titulo, "h2", "pg-h2")}<div class="pg-caixa">${tx(c, "produto", d.produto, "h3", "pg-h3")}<ul class="pg-checks">${lista(d.itens).map((it, i) => `<li>${tx(c, `itens.${i}.texto`, it.texto)}</li>`).join("")}</ul><div class="pg-preco">${d.precoDe ? tx(c, "precoDe", d.precoDe, "s") : ""}${tx(c, "preco", d.preco, "strong")}${tx(c, "condicao", d.condicao, "span")}</div>${botao(c, "botao", d.botao, d.link, "pg-btn-p pg-btn-g pg-cheio")}</div></div></section>`,
  },

  formulario: {
    rotulo: "Formulário",
    descricao: "Captura de nome, e-mail e WhatsApp",
    campos: [
      { k: "texto", chave: "titulo", rotulo: "Título" },
      { k: "texto", chave: "subtitulo", rotulo: "Subtítulo" },
      { k: "bool", chave: "pedirNome", rotulo: "Pedir nome" },
      { k: "bool", chave: "pedirEmail", rotulo: "Pedir e-mail" },
      { k: "bool", chave: "pedirWhats", rotulo: "Pedir WhatsApp" },
      { k: "texto", chave: "botao", rotulo: "Texto do botão" },
      { k: "link", chave: "destino", rotulo: "Para onde vai depois de enviar", dica: "Endereço da página de obrigado" },
      { k: "texto", chave: "nota", rotulo: "Aviso embaixo" },
    ],
    padrao: () => ({ titulo: "Receba o acesso", subtitulo: "Preencha abaixo para continuar.", pedirNome: true, pedirEmail: true, pedirWhats: true, botao: "Enviar", destino: "", nota: "Seus dados ficam protegidos. Nada de spam." }),
    render: (d, c) => {
      const campo = (nome: string, rot: string, tipo: string, auto: string) => `<label><span>${rot}</span><input name="${nome}" type="${tipo}" autocomplete="${auto}" placeholder="${rot}" required></label>`;
      const campos = [d.pedirNome ? campo("nome", "Seu nome", "text", "name") : "", d.pedirEmail ? campo("email", "Seu melhor e-mail", "email", "email") : "", d.pedirWhats ? campo("whatsapp", "Seu WhatsApp com DDD", "tel", "tel") : ""].join("");
      return `<section class="pg-sec pg-form" id="formulario"><div class="pg-cx pg-estreito"><div class="pg-caixa">${tx(c, "titulo", d.titulo, "h2", "pg-h2")}${tx(c, "subtitulo", d.subtitulo, "p", "pg-lede")}<form data-pg-form data-destino="${esc(urlSegura(d.destino))}" ${c.ed ? " novalidate" : ""}>${campos}${botao(c, "botao", d.botao, "#", "pg-btn-p pg-btn-g pg-cheio pg-enviar")}</form>${d.nota || c.ed ? tx(c, "nota", d.nota, "small", "pg-nota") : ""}</div></div></section>`;
    },
  },

  faq: {
    rotulo: "Perguntas frequentes",
    descricao: "Perguntas e respostas que abrem e fecham",
    campos: [
      { k: "texto", chave: "titulo", rotulo: "Título" },
      { k: "lista", chave: "itens", rotulo: "Perguntas", item: "pergunta", campos: [{ k: "texto", chave: "pergunta", rotulo: "Pergunta" }, { k: "texto", chave: "resposta", rotulo: "Resposta" }] },
    ],
    padrao: () => ({ titulo: "Perguntas frequentes", itens: [{ pergunta: "Pergunta comum 1", resposta: "Resposta clara em duas ou três linhas." }, { pergunta: "Pergunta comum 2", resposta: "Resposta clara em duas ou três linhas." }] }),
    render: (d, c) => `<section class="pg-sec pg-faq"><div class="pg-cx pg-estreito">${tx(c, "titulo", d.titulo, "h2", "pg-h2")}${lista(d.itens).map((it, i) => `<details class="pg-det"${c.ed ? " open" : ""}><summary>${tx(c, `itens.${i}.pergunta`, it.pergunta)}</summary>${tx(c, `itens.${i}.resposta`, it.resposta, "p")}</details>`).join("")}</div></section>`,
  },

  garantia: {
    rotulo: "Garantia",
    descricao: "Selo e texto da garantia",
    campos: [{ k: "imagem", chave: "selo", rotulo: "Selo" }, { k: "texto", chave: "titulo", rotulo: "Título" }, { k: "texto", chave: "texto", rotulo: "Texto" }],
    padrao: () => ({ selo: "", titulo: "Garantia", texto: "Explique a garantia com o prazo e como pedir." }),
    render: (d, c) => `<section class="pg-sec pg-garantia"><div class="pg-cx pg-estreito pg-linha">${d.selo || c.ed ? im(c, "selo", d.selo, "pg-selo") : icone("escudo")}<div>${tx(c, "titulo", d.titulo, "h2", "pg-h2")}${tx(c, "texto", d.texto, "p")}</div></div></section>`,
  },

  cta: {
    rotulo: "Chamada final",
    descricao: "Faixa de cor com título e botão",
    campos: [{ k: "texto", chave: "titulo", rotulo: "Título" }, { k: "texto", chave: "subtitulo", rotulo: "Subtítulo" }, { k: "texto", chave: "botao", rotulo: "Texto do botão" }, { k: "link", chave: "link", rotulo: "Endereço do botão" }],
    padrao: () => ({ titulo: "Pronto para começar", subtitulo: "", botao: "Quero entrar", link: "#" }),
    render: (d, c) => `<section class="pg-sec pg-cta"><div class="pg-cx pg-estreito pg-centro">${tx(c, "titulo", d.titulo, "h2", "pg-h2")}${d.subtitulo || c.ed ? tx(c, "subtitulo", d.subtitulo, "p", "pg-lede") : ""}${botao(c, "botao", d.botao, d.link, "pg-btn-p pg-btn-g")}</div></section>`,
  },

  texto: {
    rotulo: "Texto",
    descricao: "Título e texto corrido",
    campos: [{ k: "texto", chave: "titulo", rotulo: "Título" }, { k: "texto", chave: "texto", rotulo: "Texto" }],
    padrao: () => ({ titulo: "Título da seção", texto: "Escreva aqui o texto da seção." }),
    render: (d, c) => `<section class="pg-sec pg-texto"><div class="pg-cx pg-estreito">${tx(c, "titulo", d.titulo, "h2", "pg-h2")}${tx(c, "texto", d.texto, "p", "pg-corrido")}</div></section>`,
  },

  imagem: {
    rotulo: "Imagem",
    descricao: "Uma imagem em largura total",
    campos: [{ k: "imagem", chave: "imagem", rotulo: "Imagem" }, { k: "texto", chave: "legenda", rotulo: "Legenda" }],
    padrao: () => ({ imagem: "", legenda: "" }),
    render: (d, c) => `<section class="pg-sec pg-imagem"><div class="pg-cx">${im(c, "imagem", d.imagem, "pg-img-grande")}${d.legenda || c.ed ? tx(c, "legenda", d.legenda, "p", "pg-legenda") : ""}</div></section>`,
  },

  rodape: {
    rotulo: "Rodapé",
    descricao: "Direitos, CNPJ e links legais",
    campos: [
      { k: "texto", chave: "texto", rotulo: "Texto" },
      { k: "lista", chave: "links", rotulo: "Links", item: "link", campos: [{ k: "texto", chave: "rotulo", rotulo: "Nome" }, { k: "link", chave: "url", rotulo: "Endereço" }] },
    ],
    padrao: () => ({ texto: "Revolução Concursos. Todos os direitos reservados.", links: [{ rotulo: "Termos de uso", url: "#" }, { rotulo: "Política de privacidade", url: "#" }] }),
    render: (d, c) => `<footer class="pg-sec pg-rodape"><div class="pg-cx pg-estreito pg-centro">${tx(c, "texto", d.texto, "p")}<nav>${lista(d.links).map((l, i) => (c.ed ? tx(c, `links.${i}.rotulo`, l.rotulo, "a") : `<a href="${esc(urlSegura(l.url))}">${rico(l.rotulo)}</a>`)).join("")}</nav></div></footer>`,
  },

  modelo: {
    rotulo: "Modelo da Vitrine",
    descricao: "Bloco pronto dos seus modelos",
    campos: [],
    padrao: () => ({ html: "" }),
    render: (d, c) => renderModelo(d, c.ed),
  },
};

export const ORDEM_CATALOGO: TipoBloco[] = ["topo", "heroi", "video", "numeros", "beneficios", "depoimentos", "oferta", "formulario", "faq", "garantia", "cta", "texto", "imagem", "rodape"];
