import type { Bloco } from "../tipos";

/** Biblioteca de blocos da Vitrine de Páginas (gerada por scripts/importar-vitrine.py). */
export type BlocoVitrine = { id: string; rotulo: string; nome: string; descricao: string; escuro: string; claro?: string };
export type GrupoVitrine = { id: string; nome: string; css: string; blocos: BlocoVitrine[]; /** Páginas inteiras que estão no ar: só servem de exemplo, não entram na lista de blocos. */ soExemplo?: boolean };
export type ExemploVitrine = { id: string; grupo: string; nome: string; fundo: string; blocos: { id: string; tema: "claro" | "escuro"; /** Quando o bloco vem de outro tipo de página. */ grupo?: string }[] };
export type Biblioteca = { css: string; grupos: GrupoVitrine[]; exemplos: ExemploVitrine[] };
export type Tema = "claro" | "escuro";

let cache: Biblioteca | null = null;
let promessa: Promise<Biblioteca> | null = null;

/** Carrega a biblioteca só quando alguém precisa dela (é grande). */
export function carregarBiblioteca(): Promise<Biblioteca> {
  promessa ??= import("./biblioteca.json").then((m) => (cache = completarExemplos(m.default as Biblioteca)));
  return promessa;
}
export const bibliotecaCarregada = () => cache;

export function achar(grupo: string, id: string) {
  const g = cache?.grupos.find((x) => x.id === grupo);
  return { grupo: g, bloco: g?.blocos.find((b) => b.id === id) };
}

export const temTema = (b: BlocoVitrine, tema: Tema) => (tema === "claro" ? !!b.claro : true);
export const htmlDoTema = (b: BlocoVitrine, tema: Tema) => (tema === "claro" && b.claro ? b.claro : b.escuro);

/** CSS da Vitrine que a página precisa: o geral mais o dos grupos cujos blocos ela usa. */
export function cssDaPagina(blocos: Bloco[]): string {
  if (!cache) return "";
  const usados = new Set(blocos.filter((b) => b.tipo === "modelo").map((b) => String(b.dados.grupo)));
  if (!usados.size) return "";
  return cache.css + "\n" + cache.grupos.filter((g) => usados.has(g.id)).map((g) => g.css).join("\n");
}

/** Quais blocos funcionam como "topo" da página (o que aparece primeiro): é o que dá para trocar por outro. */
export const ehTopo = (grupo: string, b: BlocoVitrine) =>
  b.rotulo.startsWith("Topo") || b.rotulo.startsWith("Opção") || b.rotulo === "Bloco 01" || (grupo === "vendas-policial" && b.rotulo === "Seção 01");

/** Cria exemplos de página a partir dos grupos que não têm página de exemplo pronta (lista, evento, publicitária e quiz). */
function completarExemplos(b: Biblioteca): Biblioteca {
  const tem = new Set(b.exemplos.map((e) => e.id));
  const add = (id: string, grupo: string, nome: string, ids: (string | { id: string; grupo?: string; tema?: Tema })[], tema: Tema = "escuro") => {
    if (!tem.has(id)) b.exemplos.push({ id, grupo, nome, fundo: "#0C0514", blocos: ids.map((x) => (typeof x === "string" ? { id: x, tema } : { tema, ...x })) });
  };
  // pedido do Kleber (02/11): o exemplo da lista de espera é o topo da raposinha em pé da captura (o do ar hoje), na versão branca
  add("lista-espera-arte", "noar-captura", "Lista de espera", ["noar-captura-01"], "claro");
  const prova = b.grupos.find((g) => g.id === "evento")?.blocos.find((x) => x.id === "ev-prova-comentarios");
  for (const g of b.grupos) {
    if (g.id === "quiz") { add("quiz-telas", g.id, "Quiz · tela inicial e pergunta", g.blocos.map((x) => x.id)); continue; }
    if (!["lista", "evento", "publicitaria"].includes(g.id)) continue;
    g.blocos.filter((x) => x.rotulo === "Bloco 01" || x.rotulo.startsWith("Opção")).forEach((bl) => {
      add(`${g.id}-${bl.id}`, g.id, `${g.nome} · ${bl.nome}`, // pedido do Kleber (02/11): na página de evento entra, no alto, o topo "Mascote apresentadora" da captura; a segunda dobra (prova social) sai
      g.id === "evento" && bl.id !== prova?.id ? [{ id: "topo-09", grupo: "captura" }, { id: bl.id, tema: "claro" }] : [bl.id]);
    });
  }
  return b;
}

/** Funções das seções, na ordem em que aparecem na janela de adicionar bloco. */
export const FUNCOES = [
  "Topo", "Menu", "Dor e posicionamento", "Método e recursos", "Prova social", "Oferta e preços", "Chamada para ação",
  "Formulários", "Perguntas frequentes", "Garantia", "Obrigado e onboarding", "Quiz", "Vendas policial", "Rodapé", "Outros",
] as const;
export type Funcao = (typeof FUNCOES)[number];

const sem = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Em que função a seção trabalha na página (independe do tipo de página de onde ela veio). Classificado pelo nome que está na Vitrine. */
export function funcaoDe(grupo: string, b: BlocoVitrine): Funcao {
  const n = sem(b.nome);
  if (grupo === "quiz") return "Quiz";
  if (grupo === "obrigado") return "Obrigado e onboarding";
  if (grupo === "vendas-policial") return b.id === "policial-01" ? "Topo" : b.id === "policial-16" ? "Chamada para ação" : "Vendas policial";
  if (b.rotulo.startsWith("Menu")) return "Menu";
  if (n.includes("rodape")) return "Rodapé";
  if (grupo === "formularios" || n.includes("pop-up")) return "Formulários";
  if (n.includes("faq") || n.includes("duvidas")) return "Perguntas frequentes";
  if (n.includes("garantia")) return "Garantia";
  if (n.includes("prova social") || n.includes("depoimentos") || n.includes("time revolucao") || n.includes("quem entra na lista")) return "Prova social";
  if (n.includes("confirmacao") || n === "obrigado") return "Obrigado e onboarding";
  if (ehTopo(grupo, b)) return "Topo";
  if (n.includes("oferta") || n.includes("plano") || n.includes("preco") || n.includes("stack") || n.includes("bonus") || n.includes("recompensas") || n.includes("diario oficial")) return "Oferta e preços";
  if (n.startsWith("cta")) return "Chamada para ação";
  if (n.includes("dor") || n.includes("problema") || n.includes("para quem e") || n.includes("por que a revolucao")) return "Dor e posicionamento";
  if (n.includes("metodo") || n.includes("funcionalidades") || n.includes("recursos") || n.includes("simulado") || n.includes("memorize") || n.includes("mentor") || n.includes("jornada") || n.includes("estudar sozinho") || n.includes("concurso que estuda")) return "Método e recursos";
  return "Outros";
}
