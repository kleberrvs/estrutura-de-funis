import type { LeadEdge, EtapaNode } from "./types";
import type { Evento } from "./filtros";
import { nosIniciais, setasIniciais } from "./data/funil";
import { nosVsl, setasVsl } from "./data/funil-vsl";
import { nosEmbaixador, setasEmbaixador } from "./data/funil-embaixador";
import { nosEmails, setasEmails } from "./data/funil-emails";
import { uid } from "./engine";

/** Modelos disponíveis ao criar um funil. */
export const MODELOS = {
  vazio: { rotulo: "Funil em branco", descricao: "Comece do zero e monte pela paleta", capa: "", nodes: [] as EtapaNode[], edges: [] as LeadEdge[] },
  vsl: { rotulo: "Funil de vendas (VSL)", descricao: "Anúncios → LP com VSL → pop-up → checkout → jornadas", capa: "vsl", nodes: nosVsl, edges: setasVsl },
  embaixador: { rotulo: "Funil do Embaixador", descricao: "Convite 1:1 → cadastro → RevCoins → Rév", capa: "pessoas", nodes: nosEmbaixador, edges: setasEmbaixador },
  emails: { rotulo: "Fluxos de E-mail", descricao: "Os 5 fluxos do Customer.io: automáticos, conta, ativação, L1, quiz", capa: "email", nodes: nosEmails, edges: setasEmails },
  padrao: { rotulo: "Funil padrão", descricao: "Quiz + Blog → Página inicial → Vendas", capa: "rev", nodes: nosIniciais, edges: setasIniciais },
} as const;
export type Modelo = keyof typeof MODELOS;

/** Um funil completo: desenho + números, independente dos outros. */
export type Funil = {
  id: string;
  nome: string;
  descricao: string;
  capa?: string; // "rev" | "vsl" | "pessoas" | "email" | URL de imagem | vazio = miniatura do diagrama
  arquivado?: boolean; // some da tela "Seus funis" sem perder o desenho/números
  ordem?: number; // menor aparece primeiro (sem valor = depois dos ordenados)
  eventos?: Evento[]; // registro por lead (base dos filtros); até 5000
  criadoEm: number;
  atualizadoEm: number;
  nodes: EtapaNode[];
  edges: LeadEdge[];
};

const CHAVE = "funil-ao-vivo:v2";

const zerarStats = (nodes: EtapaNode[]) =>
  nodes.map((n) => ({ ...n, data: { ...n.data, stats: { entradas: 0, avancaram: 0, ativos: 0 } } }));

/** Ajusta funis salvos por versões anteriores do painel. */
function normalizar(f: Funil): Funil {
  const nodes = f.nodes.map((n) => {
    const data = { ...n.data } as EtapaNode["data"] & { thumb?: string };
    delete data.thumb;
    return { ...n, type: "etapa" as const, data: { ...data, tipo: data.tipo ?? "pagina" } };
  });
  let edges = f.edges;
  // Funil principal ganha o Blog ligado à Página inicial (pedido de 12/09/2026).
  const temBlog = nodes.some((n) => n.data.url?.includes("/k/blog"));
  const inicial = nodes.find((n) => n.data.url?.includes("/k/pagina-inicial"));
  if (f.nome === "Funil principal" && !temBlog && inicial) {
    const blog = structuredClone(nosIniciais.find((n) => n.id === "blog")!);
    blog.position = { x: inicial.position.x - 540, y: inicial.position.y + 660 };
    nodes.push(blog);
    edges = [...edges, { id: `blog>${inicial.id}`, type: "lead", source: "blog", target: inicial.id, data: { passagens: 0 } }];
  }
  // Capa pelo nome, para funis criados antes de existir o campo (15/09/2026).
  let capa = f.capa;
  if (capa === undefined) {
    const n = f.nome.toLowerCase();
    capa = n.includes("vsl") ? "vsl" : n.includes("embaixador") ? "pessoas" : n.includes("e-mail") || n.includes("email") ? "email" : n.includes("principal") ? "rev" : "";
  }
  return { ...f, nodes, edges, capa };
}

/** Lê todos os funis; num navegador novo, entrega os funis prontos uma vez só. */
export function listarFunis(): Funil[] {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) return (JSON.parse(salvo) as Funil[]).map(normalizar);
    const funis = [
      { ...novoFunil("Funil do Embaixador", "Convite 1:1 → Página de cadastro → Pop-up → RevCoins → Rév + anúncios/forms → grupo de WhatsApp", undefined, "embaixador"), ordem: 0 },
      novoFunil("Funil VSL · Plataforma", "Anúncios → LP com VSL → Pop-up → Checkout Hotmart → Boas-vindas + jornadas HSM/e-mail", undefined, "vsl"),
      novoFunil("Fluxos de E-mail", "Os 5 fluxos de e-mail da Revolução (documentação; disparos no Customer.io)", undefined, "emails"),
    ];
    salvarTodos(funis);
    return funis;
  } catch {
    return [novoFunil("Funil principal", "Quiz + Blog → Página inicial → Página de vendas")];
  }
}

export function novoFunil(nome: string, descricao = "", base?: Pick<Funil, "nodes" | "edges">, modelo: Modelo = "padrao"): Funil {
  const agora = Date.now();
  const origem = base ?? MODELOS[modelo];
  return {
    id: uid(),
    nome,
    descricao,
    capa: base ? undefined : MODELOS[modelo].capa,
    criadoEm: agora,
    atualizadoEm: agora,
    nodes: structuredClone(origem.nodes) as EtapaNode[],
    edges: structuredClone(origem.edges) as LeadEdge[],
  };
}

export function salvarTodos(funis: Funil[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(funis));
  } catch {
    /* sem storage: fica só em memória */
  }
}

export function lerFunil(id: string): Funil | undefined {
  return listarFunis().find((f) => f.id === id);
}

export function salvarFunil(atualizado: Funil) {
  const funis = listarFunis();
  const i = funis.findIndex((f) => f.id === atualizado.id);
  const comData = { ...atualizado, atualizadoEm: Date.now() };
  if (i >= 0) funis[i] = comData;
  else funis.push(comData);
  salvarTodos(funis);
}

export function arquivarFunil(id: string, arquivado: boolean) {
  salvarTodos(listarFunis().map((f) => (f.id === id ? { ...f, arquivado } : f)));
}

export function removerFunil(id: string) {
  salvarTodos(listarFunis().filter((f) => f.id !== id));
}

/** Cópia do desenho com números zerados. */
export function duplicarFunil(id: string): Funil | undefined {
  const origem = lerFunil(id);
  if (!origem) return;
  const copia = novoFunil(`${origem.nome} (cópia)`, origem.descricao, {
    nodes: zerarStats(structuredClone(origem.nodes)),
    edges: structuredClone(origem.edges).map((e) => ({ ...e, data: { passagens: 0 } })),
  });
  salvarTodos([...listarFunis(), copia]);
  return copia;
}
