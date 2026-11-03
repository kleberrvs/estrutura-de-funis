/** Tipos do construtor de páginas: uma página é uma lista de blocos; cada bloco guarda só dados. */

export type Dados = Record<string, unknown>;

export type TipoBloco =
  | "topo" | "heroi" | "video" | "numeros" | "beneficios" | "depoimentos" | "oferta"
  | "formulario" | "faq" | "garantia" | "cta" | "texto" | "imagem" | "rodape"
  /** Bloco vindo da Vitrine de Páginas (HTML inteiro, editável). */
  | "modelo";

export type Bloco = { id: string; tipo: TipoBloco; dados: Dados };

export type ModeloBase = Exclude<ModeloPagina, "vitrine">;
export type ModeloPagina = "branco" | "basico" | "captura" | "vendas" | "interessados" | "obrigado" | "vitrine";

export type Pagina = {
  id: string;
  nome: string;
  descricao: string;
  modelo: ModeloPagina;
  /** Título da aba do navegador e descrição para buscadores. */
  titulo: string;
  resumo: string;
  /** Final do endereço e nome do projeto nos eventos do Segment. */
  slug: string;
  /** Endereço onde a página foi publicada (liga a página ao bloco do funil). */
  url: string;
  /** Cor dos botões da página toda (cada bloco pode ter a sua). */
  corBotao?: string;
  /** Cor de fundo da página toda (cada bloco pode ter a sua). */
  corFundo?: string;
  /** "telas": a página é uma sequência de telas (quiz): uma por vez, com setas para os lados, em vez de uma página comprida. */
  modo?: "pagina" | "telas";
  arquivada?: boolean;
  criadoEm: number;
  atualizadoEm: number;
  blocos: Bloco[];
};

/** Campo que um bloco aceita. Texto e imagem editam direto na página; o resto vai no painel. */
export type Campo =
  | { k: "texto"; chave: string; rotulo: string }
  | { k: "imagem"; chave: string; rotulo: string }
  | { k: "link"; chave: string; rotulo: string; dica?: string }
  | { k: "escolha"; chave: string; rotulo: string; opcoes: { v: string; r: string }[] }
  | { k: "bool"; chave: string; rotulo: string }
  | { k: "lista"; chave: string; rotulo: string; item: string; campos: Exclude<Campo, { k: "lista" }>[] };

export type Contexto = { ed: boolean };

export type DefBloco = {
  rotulo: string;
  descricao: string;
  campos: Campo[];
  padrao: () => Dados;
  render: (d: Dados, c: Contexto) => string;
};
