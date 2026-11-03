import { uid } from "../engine";
import { MODELOS_PAGINA } from "./modelos";
import type { Bloco, ModeloBase, Pagina } from "./tipos";

const CHAVE = "funil-ao-vivo:paginas:v1";

/** Texto sem acento e com hífens, para o final do endereço. */
export const fazSlug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "pagina";

export function listarPaginas(): Pagina[] {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? (JSON.parse(salvo) as Pagina[]) : [];
  } catch {
    return [];
  }
}

/** Devolve false se o navegador recusou gravar (por exemplo, imagens demais). */
export function salvarTodas(paginas: Pagina[]): boolean {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(paginas));
    return true;
  } catch {
    return false;
  }
}

export const lerPagina = (id: string) => listarPaginas().find((p) => p.id === id);

export function novaPagina(nome: string, descricao: string, modelo: ModeloBase): Pagina {
  const agora = Date.now();
  return { id: uid(), nome, descricao, modelo, titulo: nome, resumo: "", slug: fazSlug(nome), url: "", criadoEm: agora, atualizadoEm: agora, blocos: MODELOS_PAGINA[modelo].blocos() };
}

export function salvarPagina(p: Pagina): boolean {
  const todas = listarPaginas();
  const i = todas.findIndex((x) => x.id === p.id);
  const nova = { ...p, atualizadoEm: Date.now() };
  if (i >= 0) todas[i] = nova;
  else todas.push(nova);
  return salvarTodas(todas);
}

export const removerPagina = (id: string) => salvarTodas(listarPaginas().filter((p) => p.id !== id));
export const arquivarPagina = (id: string, v: boolean) => salvarTodas(listarPaginas().map((p) => (p.id === id ? { ...p, arquivada: v } : p)));

export function duplicarPagina(id: string): Pagina | undefined {
  const o = lerPagina(id);
  if (!o) return;
  const blocos: Bloco[] = structuredClone(o.blocos).map((b) => ({ ...b, id: uid() }));
  const copia: Pagina = { ...structuredClone(o), id: uid(), nome: `${o.nome} (cópia)`, slug: `${o.slug}-copia`, url: "", criadoEm: Date.now(), atualizadoEm: Date.now(), blocos };
  salvarTodas([...listarPaginas(), copia]);
  return copia;
}
