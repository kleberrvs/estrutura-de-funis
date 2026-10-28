import { memo, useContext, useMemo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  useNodesData,
  type EdgeProps,
} from "@xyflow/react";
import type { LeadEdge as LeadEdgeType, EtapaNode } from "../types";
import { TransitsContext } from "../transits";

type Caixa = { x: number; y: number; w: number; h: number };
const dentro = (p: { x: number; y: number }, c: Caixa | null, folga = 28) =>
  !!c && p.x > c.x - folga && p.x < c.x + c.w + folga && p.y > c.y - folga && p.y < c.y + c.h + folga;

/**
 * Ponto ao longo da seta para o rótulo: começa no meio e vai testando outras
 * posições até achar uma fora dos blocos de origem e destino (com folga),
 * para o rótulo nunca ficar escondido atrás de um bloco.
 */
function pontoLivre(path: string, origem: Caixa | null, destino: Caixa | null, meio: { x: number; y: number }) {
  if (typeof document === "undefined") return meio;
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", path);
  const total = el.getTotalLength();
  if (!total) return meio;
  for (const t of [0.5, 0.45, 0.55, 0.4, 0.6, 0.35, 0.65, 0.3, 0.7, 0.25, 0.75, 0.2, 0.8]) {
    const p = el.getPointAtLength(total * t);
    if (!dentro(p, origem) && !dentro(p, destino)) return { x: p.x, y: p.y };
  }
  return meio;
}

/** Seta entre duas etapas: mostra passagens e conversão, e anima os leads. */
function LeadEdgeComponent({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<LeadEdgeType>) {
  const [path, meioX, meioY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const origem = useNodesData<EtapaNode>(source);
  const noOrigem = useInternalNode(source);
  const noDestino = useInternalNode(target);
  const transits = useContext(TransitsContext).filter((t) => t.edgeId === id);

  const caixa = (n: typeof noOrigem): Caixa | null =>
    n ? { x: n.internals.positionAbsolute.x, y: n.internals.positionAbsolute.y, w: n.measured.width ?? 300, h: n.measured.height ?? 200 } : null;
  const rotulo = useMemo(
    () => pontoLivre(path, caixa(noOrigem), caixa(noDestino), { x: meioX, y: meioY }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path, noOrigem?.internals.positionAbsolute.x, noOrigem?.internals.positionAbsolute.y, noOrigem?.measured.width, noOrigem?.measured.height, noDestino?.internals.positionAbsolute.x, noDestino?.internals.positionAbsolute.y, noDestino?.measured.width, noDestino?.measured.height],
  );

  const passagens = data?.passagens ?? 0;
  const entradas = origem?.data.stats.entradas ?? 0;
  const conversao = entradas ? Math.round((passagens / entradas) * 100) : null;

  return (
    <>
      <BaseEdge id={id} path={path} className={`lead-edge${selected ? " is-selected" : ""}`} />
      <EdgeLabelRenderer>
        <div
          className="edge-label"
          style={{ transform: `translate(-50%, -100%) translate(${rotulo.x}px, ${rotulo.y - 14}px)` }}
        >
          <b className={conversao ? "verde" : ""}>{conversao === null ? "–" : `${conversao}%`}</b>
          <span>{passagens} leads</span>
        </div>
        {transits.map((t) => (
          <div key={t.id} className={`lead-dot${t.anonimo ? " is-anon" : ""}`} style={{ offsetPath: `path("${path}")` }} title={t.nome}>
            <span>{t.nome}</span>
          </div>
        ))}
      </EdgeLabelRenderer>
    </>
  );
}

export const LeadEdge = memo(LeadEdgeComponent);
