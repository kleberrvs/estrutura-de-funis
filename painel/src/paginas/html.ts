import type { Contexto } from "./tipos";

/** Ajudantes para desenhar HTML dos blocos (o mesmo desenho serve para o editor e para a página final). */

const MAPA: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => MAPA[c]);

/** Só deixa passar endereços seguros; o resto vira "#". */
export const urlSegura = (u: unknown) => {
  const v = String(u ?? "").trim();
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(v) ? v : "#";
};

/** Cor escura? (para escolher texto claro ou escuro por cima dela) */
export const ehEscuro = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
};

const PERMITIDAS = new Set(["B", "STRONG", "I", "EM", "U", "S", "SPAN", "BR"]);
const ESTILO_OK = /^(color|font-weight|font-style|text-decoration(-line)?)\s*:\s*[#\w\s(),.%-]+$/i;

/** Texto com formatação simples (cor, negrito, itálico, sublinhado, quebra de linha). Tudo o mais é removido. */
export function limparRico(html: string): string {
  const t = document.createElement("template");
  t.innerHTML = html;
  const andar = (no: Node) => {
    [...no.childNodes].forEach((c) => {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1) { c.remove(); return; }
      const el = c as HTMLElement;
      andar(el);
      if (!PERMITIDAS.has(el.tagName)) {
        const frag = document.createDocumentFragment();
        if ((el.tagName === "DIV" || el.tagName === "P") && el.previousSibling) frag.append(document.createElement("br"));
        frag.append(...el.childNodes);
        el.replaceWith(frag);
        return;
      }
      const estilo = (el.getAttribute("style") ?? "").split(";").map((s) => s.trim()).filter((s) => ESTILO_OK.test(s));
      [...el.attributes].forEach((a) => el.removeAttribute(a.name));
      if (estilo.length && el.tagName === "SPAN") el.setAttribute("style", estilo.join(";"));
    });
  };
  andar(t.content);
  return t.innerHTML;
}

/** Valor de texto guardado (formatação simples) pronto para o HTML; quebras de linha viram <br>. */
export const rico = (v: unknown) => limparRico(String(v ?? "")).replace(/\n/g, "<br>");

/** O mesmo valor sem formatação, para mostrar num campo de texto do painel. */
export function soTexto(v: unknown): string {
  const t = document.createElement("template");
  t.innerHTML = String(v ?? "").replace(/<br\s*\/?>/gi, "\n");
  return t.content.textContent ?? "";
}

/** Texto editável direto na página (no editor, aceita cor e negrito em trechos) ou texto simples (na página final). */
export function tx(c: Contexto, caminho: string, valor: unknown, tag = "span", classe = "") {
  const cls = classe ? ` class="${classe}"` : "";
  if (c.ed) return `<${tag}${cls} data-edit="${caminho}" contenteditable="true" spellcheck="false">${rico(valor)}</${tag}>`;
  return `<${tag}${cls}>${rico(valor)}</${tag}>`;
}

/** Imagem: no editor, clicar abre a troca; vazia mostra um espaço para escolher. */
export function im(c: Contexto, caminho: string, valor: unknown, classe = "", alt = "") {
  const v = String(valor ?? "");
  if (!v) return c.ed ? `<div class="pg-vazio ${classe}" data-img="${caminho}">Clique para escolher a imagem</div>` : "";
  const attr = c.ed ? ` data-img="${caminho}"` : "";
  return `<img class="${classe}" src="${esc(v)}" alt="${esc(alt)}"${attr}>`;
}

/** Botão: o texto edita na página; o endereço fica no painel. */
export function botao(c: Contexto, caminho: string, texto: unknown, link: unknown, classe = "") {
  if (c.ed) return `<a class="pg-btn ${classe}" href="#" data-edit="${caminho}" contenteditable="plaintext-only" spellcheck="false">${rico(texto)}</a>`;
  return `<a class="pg-btn ${classe}" href="${esc(urlSegura(link))}" data-cta="${esc(soTexto(texto))}">${rico(texto)}</a>`;
}

export const lista = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
export const str = (v: unknown) => soTexto(v);
