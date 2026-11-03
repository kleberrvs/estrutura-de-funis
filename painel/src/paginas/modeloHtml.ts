import { urlSegura } from "./html";

/** Ajudantes para blocos vindos da Vitrine: o HTML do bloco é guardado inteiro e editado por marcas estáveis
 *  (data-m = texto, data-i = imagem, data-l = link), gravadas uma vez ao adicionar o bloco. */

const INLINE = new Set(["SPAN", "STRONG", "EM", "B", "I", "A", "BR", "SMALL", "U", "MARK", "SUP", "SUB", "SVG", "IMG", "CODE", "S", "ABBR"]);
const IGNORAR = new Set(["SCRIPT", "STYLE", "SVG", "SELECT", "OPTION", "TEXTAREA", "INPUT", "IFRAME", "VIDEO", "CANVAS", "NOSCRIPT", "LABEL"]);

const lerFragmento = (html: string) => {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t.content;
};
const serializar = (f: DocumentFragment) => {
  const d = document.createElement("div");
  d.appendChild(f.cloneNode(true));
  return d.innerHTML;
};

/** Elementos que têm texto próprio e só filhos "de linha": são os que dá para escrever em cima. */
function editaveis(raiz: ParentNode): Element[] {
  const saida: Element[] = [];
  const visitar = (el: Element) => {
    if (IGNORAR.has(el.tagName.toUpperCase())) return;
    const temTexto = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim());
    const soInline = [...el.children].every((c) => INLINE.has(c.tagName.toUpperCase()));
    if (temTexto && soInline) { saida.push(el); return; }
    [...el.children].forEach(visitar);
  };
  [...raiz.children].forEach(visitar);
  return saida;
}

/** Grava as marcas no HTML original da Vitrine. */
export function prepararModelo(html: string): string {
  const f = lerFragmento(html);
  editaveis(f).forEach((e, n) => e.setAttribute("data-m", String(n)));
  f.querySelectorAll("img").forEach((e, n) => e.setAttribute("data-i", String(n)));
  f.querySelectorAll("a[href]").forEach((e, n) => e.setAttribute("data-l", String(n)));
  f.querySelectorAll("video").forEach((e, n) => e.setAttribute("data-v", String(n)));
  return serializar(f);
}

const MARCAS = /\sdata-(?:m|i|l|v)="\d+"|\scontenteditable="[^"]*"|\sspellcheck="[^"]*"/g;
export const limparMarcas = (html: string) => html.replace(MARCAS, "");

const NOME_CAMPO: Record<string, string> = { email: "email", tel: "whatsapp", text: "nome" };

/** Desenha o bloco: no editor com os textos editáveis; na página final sem marcas e com o formulário ligado. */
export function renderModelo(d: Record<string, unknown>, ed: boolean): string {
  const f = lerFragmento(String(d.html ?? ""));
  if (ed) {
    f.querySelectorAll("[data-m]").forEach((e) => { e.setAttribute("contenteditable", "true"); e.setAttribute("spellcheck", "false"); });
  } else {
    f.querySelectorAll("form").forEach((form) => {
      form.removeAttribute("onsubmit");
      form.setAttribute("data-pg-form", "");
      form.setAttribute("data-destino", urlSegura(d.destino));
      form.querySelectorAll("input").forEach((i) => { if (!i.getAttribute("name")) i.setAttribute("name", NOME_CAMPO[i.getAttribute("type") ?? "text"] ?? "campo"); });
    });
  }
  let html = serializar(f);
  if (!ed) html = limparMarcas(html);
  // botões com a cor escrita direto neles (azul, verde, roxo...): seguem a cor escolhida; sem escolha, ficam como no modelo
  html = html.replace(/<(?:button|a)\b[^>]*style="[^"]*"[^>]*>/gi, (tag) =>
    /padding/.test(tag)
      ? tag
          .replace(/background:(#[0-9a-fA-F]{6})/g, (m, c: string) => (/^#FD6A18$/i.test(c) ? m : `background:var(--cor-btn,${c})`))
          .replace(/rgba\(21,\s*140,\s*230,\s*0?\.4\)/g, "color-mix(in srgb,var(--cor-btn,#158CE6) 40%,transparent)")
      : tag,
  );
  // botões da Vitrine usam o laranja antigo: passam a seguir a cor de botão escolhida
  return html.replace(/#FD6A18/gi, "var(--cor)").replace(/#C94700/gi, "color-mix(in srgb,var(--cor) 72%,#000)");
}

export function gravarTexto(html: string, n: string, interno: string): string {
  const f = lerFragmento(html);
  const el = f.querySelector(`[data-m="${n}"]`);
  if (el) el.innerHTML = limparMarcas(interno);
  return serializar(f);
}

export function lerImagem(html: string, n: string): string {
  return lerFragmento(html).querySelector(`[data-i="${n}"]`)?.getAttribute("src") ?? "";
}
export function gravarImagem(html: string, n: string, src: string): string {
  const f = lerFragmento(html);
  const el = f.querySelector(`[data-i="${n}"]`);
  if (el) { if (src) el.setAttribute("src", src); else el.removeAttribute("src"); el.removeAttribute("srcset"); }
  return serializar(f);
}

export type LinkModelo = { n: string; texto: string; href: string };
export function listarLinks(html: string): LinkModelo[] {
  return [...lerFragmento(html).querySelectorAll("a[data-l]")].map((a) => ({ n: a.getAttribute("data-l")!, texto: (a.textContent ?? "").trim().slice(0, 40) || "(sem texto)", href: a.getAttribute("href") ?? "" }));
}
export function gravarLink(html: string, n: string, href: string): string {
  const f = lerFragmento(html);
  f.querySelector(`a[data-l="${n}"]`)?.setAttribute("href", href);
  return serializar(f);
}
export const temFormulario = (html: string) => /<form[\s>]/i.test(html);

/** Vídeo de um bloco: endereço do arquivo e imagem de capa. */
export function lerVideo(html: string, n: string): { src: string; poster: string } {
  const v = lerFragmento(html).querySelector(`[data-v="${n}"]`);
  const src = v?.getAttribute("src") || v?.querySelector("source")?.getAttribute("src") || v?.querySelector("source")?.getAttribute("data-src") || "";
  return { src, poster: v?.getAttribute("poster") ?? "" };
}
export function gravarVideo(html: string, n: string, src: string, poster: string): string {
  const f = lerFragmento(html);
  const v = f.querySelector(`[data-v="${n}"]`);
  if (v) {
    v.querySelectorAll("source").forEach((s) => s.remove());
    if (src) v.setAttribute("src", src); else v.removeAttribute("src");
    if (poster) v.setAttribute("poster", poster);
    v.setAttribute("preload", "metadata");
    v.removeAttribute("onloadeddata");
    (v as HTMLElement).style.opacity = "";
  }
  return serializar(f);
}

/** Itens repetidos dentro de um bloco (cartões, linhas de lista...): achar, apagar e duplicar por caminho de posições. */
const seguir = (f: DocumentFragment, caminho: number[]): Element | null => {
  let atual: Element | DocumentFragment = f;
  for (const i of caminho) { const prox: Element | undefined = (atual as ParentNode).children[i]; if (!prox) return null; atual = prox; }
  return atual === f ? null : (atual as Element);
};
export function apagarItem(html: string, caminho: number[]): string {
  const f = lerFragmento(html);
  seguir(f, caminho)?.remove();
  return prepararModelo(serializar(f));
}
export function duplicarItem(html: string, caminho: number[]): string {
  const f = lerFragmento(html);
  const el = seguir(f, caminho);
  if (el) el.after(el.cloneNode(true));
  return prepararModelo(serializar(f));
}
export function moverItem(html: string, caminho: number[], delta: -1 | 1): string {
  const f = lerFragmento(html);
  const el = seguir(f, caminho);
  if (el) {
    if (delta < 0 && el.previousElementSibling) el.previousElementSibling.before(el);
    if (delta > 0 && el.nextElementSibling) el.nextElementSibling.after(el);
  }
  return prepararModelo(serializar(f));
}

/** Imagens de um bloco (inclusive as de fundo, que ficam por baixo do texto e não dá para clicar). */
export function listarImagens(html: string): { n: string; src: string; nome: string }[] {
  return [...lerFragmento(html).querySelectorAll("img[data-i]")].map((i) => ({
    n: i.getAttribute("data-i")!,
    src: i.getAttribute("src") ?? "",
    nome: (i.getAttribute("alt") || "").trim().slice(0, 28) || (i.classList.contains("hero-photo") ? "Foto de fundo" : "Imagem"),
  }));
}
