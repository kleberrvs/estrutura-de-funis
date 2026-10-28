import { useCallback, useRef } from "react";
import type { EtapaNode, LeadEdge } from "./types";

type Foto = { nodes: EtapaNode[]; edges: LeadEdge[] };
type SetNodes = (fn: (ns: EtapaNode[]) => EtapaNode[]) => void;
type SetEdges = (fn: (es: LeadEdge[]) => LeadEdge[]) => void;
const LIMITE = 100;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * Pilha de desfazer/refazer por funil. Cada "ação" (arrasto inteiro, criar,
 * apagar, editar, conectar, colar) tira uma foto ANTES de mudar. Os números
 * (stats) não entram no desfazer: ao restaurar, os blocos que ainda existem
 * mantêm os números atuais.
 */
export function useHistorico(nodesRef: React.MutableRefObject<Foto>, setNodes: SetNodes, setEdges: SetEdges) {
  const passado = useRef<Foto[]>([]);
  const futuro = useRef<Foto[]>([]);
  const ultimoGrupo = useRef<{ chave: string; em: number } | null>(null);

  /** Tira uma foto do estado atual antes de uma ação. `grupo` junta ações repetidas (ex.: digitação) em uma só. */
  const registrar = useCallback((grupo?: string) => {
    const agora = Date.now();
    if (grupo && ultimoGrupo.current?.chave === grupo && agora - ultimoGrupo.current.em < 1500) {
      ultimoGrupo.current.em = agora;
      return;
    }
    ultimoGrupo.current = grupo ? { chave: grupo, em: agora } : null;
    passado.current = [...passado.current.slice(-LIMITE + 1), clone(nodesRef.current)];
    futuro.current = [];
  }, [nodesRef]);

  /** Joga fora a última foto (ex.: rascunho cancelado, nada mudou). */
  const descartarUltima = useCallback(() => { passado.current.pop(); ultimoGrupo.current = null; }, []);

  const aplicar = useCallback((foto: Foto) => {
    const atuais = new Map(nodesRef.current.nodes.map((n) => [n.id, n]));
    setNodes(() => foto.nodes.map((n) => {
      const a = atuais.get(n.id);
      return a ? { ...n, data: { ...n.data, stats: a.data.stats }, measured: a.measured } : n;
    }));
    setEdges(() => foto.edges);
  }, [nodesRef, setNodes, setEdges]);

  const desfazer = useCallback(() => {
    const foto = passado.current.pop();
    if (!foto) return false;
    futuro.current.push(clone(nodesRef.current));
    ultimoGrupo.current = null;
    aplicar(foto);
    return true;
  }, [aplicar, nodesRef]);

  const refazer = useCallback(() => {
    const foto = futuro.current.pop();
    if (!foto) return false;
    passado.current.push(clone(nodesRef.current));
    aplicar(foto);
    return true;
  }, [aplicar, nodesRef]);

  return { registrar, descartarUltima, desfazer, refazer };
}

/** Atalho com a tecla de comando da plataforma (Cmd no Mac, Ctrl no resto). */
export const EH_MAC = /Mac|iPhone|iPad/i.test(navigator.platform || (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || "");
export const comMod = (e: KeyboardEvent) => (EH_MAC ? e.metaKey : e.ctrlKey);

/** Foco num campo de texto: os atalhos do canvas não podem atrapalhar o nativo. */
export function emCampoDeTexto(el: Element | null) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
}
