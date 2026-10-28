import type { EtapaNode, LeadEdge } from "../types";
import { TIPOS } from "../etapas";

/** Tamanho aproximado de cada bloco no canvas, para a miniatura. */
function tamanho(n: EtapaNode) {
  const t = n.data.tipo;
  if (n.data.compacto) return { w: 200, h: 90 };
  if (t === "nota") return { w: 240, h: 120 };
  if (t === "gatilho" || t === "espera" || t === "saida") return { w: 220, h: 120 };
  if (t === "pagina" || (t === "checkout" && n.data.url)) return { w: 300, h: 580 };
  return { w: 300, h: 320 };
}

/** Desenho em miniatura do canvas de um funil (blocos coloridos por tipo + setas). */
export function MiniCanvas({ nodes, edges }: { nodes: EtapaNode[]; edges: LeadEdge[] }) {
  if (!nodes.length) return <div className="mini-canvas vazio">Canvas vazio</div>;
  const caixas = nodes.map((n) => ({ n, ...n.position, ...tamanho(n) }));
  const minX = Math.min(...caixas.map((c) => c.x)) - 40;
  const minY = Math.min(...caixas.map((c) => c.y)) - 40;
  const maxX = Math.max(...caixas.map((c) => c.x + c.w)) + 40;
  const maxY = Math.max(...caixas.map((c) => c.y + c.h)) + 40;
  const centro = (id: string) => {
    const c = caixas.find((k) => k.n.id === id);
    return c ? { x: c.x + c.w / 2, y: c.y + c.h / 2 } : null;
  };
  return (
    <svg className="mini-canvas" viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {edges.map((e) => {
        const a = centro(e.source), b = centro(e.target);
        return a && b ? <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3a4a6a" strokeWidth={Math.max(6, (maxX - minX) / 250)} /> : null;
      })}
      {caixas.map((c) => (
        <rect key={c.n.id} x={c.x} y={c.y} width={c.w} height={c.h} rx={24} fill={TIPOS[c.n.data.tipo].cor} fillOpacity={0.85} />
      ))}
    </svg>
  );
}
