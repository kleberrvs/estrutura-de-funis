import { useCallback, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import type { FeedItem, LeadEdge, EtapaNode, Stats, Transit } from "./types";
import { DURACAO_TRANSITO_MS } from "./transits";
import type { Evento } from "./filtros";

const LIMITE_EVENTOS = 5000;

/** Lead presente em alguma etapa neste momento. */
export type LeadAtivo = {
  id: string;
  nome: string;
  anonimo: boolean;
  nodeId: string;
  desde: number; // quando chegou na etapa atual
  origem: string; // Google Ads, Facebook Ads, E-mail, acesso direto...
  dispositivo: string; // Desktop, Celular, Tablet
  campanha: string; // utm_campaign ou "(sem campanha)"
  etapas: number; // quantas etapas já percorreu
  entrouEm: number; // quando entrou no funil
};

export const uid = () => Math.random().toString(36).slice(2, 9);

/**
 * Motor do funil: recebe os fatos (lead entrou, avançou, saiu) e atualiza
 * contadores, animações e feed. O modo demo e, na etapa 2, o WebSocket do
 * backend chamam exatamente estas funções.
 */
type SetNodes = (fn: (ns: EtapaNode[]) => EtapaNode[]) => void;
type SetEdges = (fn: (es: LeadEdge[]) => LeadEdge[]) => void;

/**
 * Recebe os setters do ESTADO do painel (useNodesState/useEdgesState), não os
 * do store do React Flow: com filtro ativo o store enxerga cópias com números
 * filtrados, e uma atualização via store voltaria como "replace" com a cópia.
 */
export function useFunilEngine(eventosIniciais: Evento[], setNodes: SetNodes, setEdges: SetEdges) {
  const { getNodes, getEdges } = useReactFlow<EtapaNode, LeadEdge>();
  const [leads, setLeads] = useState<LeadAtivo[]>([]);
  const [eventos, setEventos] = useState<Evento[]>(eventosIniciais);
  const registrar = useCallback((e: Omit<Evento, "t">) => {
    setEventos((evs) => [...evs.slice(-LIMITE_EVENTOS + 1), { ...e, t: Date.now() }]);
  }, []);
  const dims = (l: { origem: string; dispositivo: string; campanha: string }) => ({ fonte: l.origem, dispositivo: l.dispositivo, campanha: l.campanha });
  const [transits, setTransits] = useState<Transit[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const leadsRef = useRef(leads);
  leadsRef.current = leads;

  const tituloDe = useCallback(
    (nodeId: string) => getNodes().find((n) => n.id === nodeId)?.data.titulo ?? nodeId,
    [getNodes],
  );

  const bumpNode = useCallback(
    (nodeId: string, fn: (s: Stats) => Stats) =>
      setNodes((ns) =>
        ns.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, stats: fn(n.data.stats) } } : n)),
      ),
    [setNodes],
  );

  const bumpEdge = useCallback(
    (edgeId: string) =>
      setEdges((es) =>
        es.map((e) =>
          e.id === edgeId ? { ...e, data: { passagens: (e.data?.passagens ?? 0) + 1 } } : e,
        ),
      ),
    [setEdges],
  );

  const log = useCallback((tipo: FeedItem["tipo"], texto: string) => {
    setFeed((f) => [{ id: uid(), quando: Date.now(), tipo, texto }, ...f].slice(0, 40));
  }, []);

  /** Lead chegou numa etapa vindo de fora do funil. */
  const entrar = useCallback(
    (nodeId: string, lead: { id: string; nome: string; anonimo: boolean; origem?: string; dispositivo?: string; campanha?: string }) => {
      const agora = Date.now();
      const completo = { ...lead, origem: lead.origem ?? "Acesso direto", dispositivo: lead.dispositivo ?? "Desktop", campanha: lead.campanha ?? "(sem campanha)" };
      setLeads((ls) => [
        ...ls.filter((l) => l.id !== lead.id),
        { ...completo, nodeId, desde: agora, etapas: 1, entrouEm: agora },
      ]);
      bumpNode(nodeId, (s) => ({ ...s, entradas: s.entradas + 1, ativos: s.ativos + 1 }));
      registrar({ tipo: "entrou", leadId: lead.id, nodeId, ...dims(completo) });
      log("entrou", `${lead.nome} entrou em ${tituloDe(nodeId)}`);
    },
    [bumpNode, log, tituloDe, registrar],
  );

  /** Lead percorreu uma seta; se veio identificado, troca o nome no caminho. */
  const avancar = useCallback(
    (leadId: string, edgeId: string, identidade?: { nome: string }) => {
      const lead = leadsRef.current.find((l) => l.id === leadId);
      const edge = getEdges().find((e) => e.id === edgeId);
      if (!lead || !edge) return;

      const nome = identidade?.nome ?? lead.nome;
      const anonimo = identidade ? false : lead.anonimo;
      if (identidade && lead.anonimo) log("identificou", `${lead.nome} se identificou: ${nome}`);

      setLeads((ls) => ls.filter((l) => l.id !== leadId));
      bumpNode(edge.source, (s) => ({ ...s, avancaram: s.avancaram + 1, ativos: Math.max(0, s.ativos - 1) }));
      registrar({ tipo: "avancou", leadId, nodeId: edge.source, edgeId, ...dims(lead) });

      const transitId = uid();
      setTransits((ts) => [...ts, { id: transitId, edgeId, nome, anonimo }]);

      window.setTimeout(() => {
        setTransits((ts) => ts.filter((t) => t.id !== transitId));
        bumpEdge(edgeId);
        setLeads((ls) => [...ls, { ...lead, nome, anonimo, nodeId: edge.target, desde: Date.now(), etapas: lead.etapas + 1 }]);
        bumpNode(edge.target, (s) => ({ ...s, entradas: s.entradas + 1, ativos: s.ativos + 1 }));
        registrar({ tipo: "entrou", leadId, nodeId: edge.target, edgeId, ...dims(lead) });
        log("avancou", `${nome} avançou para ${tituloDe(edge.target)}`);
      }, DURACAO_TRANSITO_MS);
    },
    [bumpEdge, bumpNode, getEdges, log, tituloDe, registrar],
  );

  /** Lead deixou de dar sinal (fechou a aba ou passou dos 5 min). */
  const sair = useCallback(
    (leadId: string) => {
      const lead = leadsRef.current.find((l) => l.id === leadId);
      if (!lead) return;
      setLeads((ls) => ls.filter((l) => l.id !== leadId));
      bumpNode(lead.nodeId, (s) => ({ ...s, ativos: Math.max(0, s.ativos - 1) }));
      registrar({ tipo: "saiu", leadId, nodeId: lead.nodeId, ...dims(lead) });
      log("saiu", `${lead.nome} saiu de ${tituloDe(lead.nodeId)}`);
    },
    [bumpNode, log, tituloDe, registrar],
  );

  /** Página apagada do funil: some com os leads que estavam nela. */
  const esquecerEtapa = useCallback((nodeId: string) => {
    setLeads((ls) => ls.filter((l) => l.nodeId !== nodeId));
  }, []);

  /** Zera contadores, leads e feed (mantém o desenho do funil). */
  const zerar = useCallback(() => {
    setLeads([]);
    setTransits([]);
    setFeed([]);
    setEventos([]);
    setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, stats: { entradas: 0, avancaram: 0, ativos: 0 } } })));
    setEdges((es) => es.map((e) => ({ ...e, data: { passagens: 0 } })));
  }, [setEdges, setNodes]);

  return { leads, leadsRef, transits, feed, eventos, entrar, avancar, sair, esquecerEtapa, zerar };
}
