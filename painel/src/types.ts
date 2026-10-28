import type { Node, Edge } from "@xyflow/react";

/** Contadores de uma etapa do funil. */
export type Stats = {
  entradas: number; // quantos chegaram nesta etapa (total)
  avancaram: number; // quantos seguiram para alguma próxima etapa
  ativos: number; // quantos estão aqui agora (últimos 5 min)
};

/** Tipos de etapa que o Kleber pode desenhar. */
export type TipoEtapa =
  | "anuncio"
  | "pagina"
  | "formulario"
  | "popup"
  | "checkout"
  | "whatsapp"
  | "email"
  | "audiencia"
  | "gatilho"
  | "espera"
  | "saida"
  | "nota";

/** Impressões e cliques do último dia disponível (Search Console). */
export type MetricasDia = { data: string; impressoes: number; cliques: number };

export type EtapaData = {
  tipo: TipoEtapa;
  titulo: string;
  url?: string; // página, link do WhatsApp, destino do anúncio
  texto?: string; // mensagem do WhatsApp, assunto do e-mail, título do anúncio
  canal?: string; // plataforma do anúncio ou do checkout
  compacto?: boolean; // bloco pequeno, para sequências (D1, D2...)
  imagem?: string; // criativo do anúncio (URL ou imagem embutida)
  rascunho?: boolean; // criado no canvas mas ainda não configurado
  thumbVersao?: number; // muda quando o usuário pede um print novo
  stats: Stats;
};

export type EtapaNode = Node<EtapaData, "etapa">;

export type LeadEdgeData = {
  passagens: number; // quantos leads percorreram esta seta
};

export type LeadEdge = Edge<LeadEdgeData, "lead">;

/** Um lead em trânsito por uma seta (usado pela animação). */
export type Transit = {
  id: string;
  edgeId: string;
  nome: string;
  anonimo: boolean;
};

/** Evento mostrado no feed lateral. */
export type FeedItem = {
  id: string;
  quando: number;
  texto: string;
  tipo: "entrou" | "avancou" | "saiu" | "identificou";
};
