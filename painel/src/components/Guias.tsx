import { ViewportPortal } from "@xyflow/react";
import type { Guias as GuiasTipo } from "../guias";

/** Linhas laranja que aparecem quando um bloco alinha com outro. */
export function Guias({ x, y, eixoX, eixoY }: GuiasTipo) {
  if (x === undefined && y === undefined && eixoX === undefined && eixoY === undefined) return null;
  return (
    <ViewportPortal>
      {x !== undefined && <div className="guia guia-v" style={{ left: x }} />}
      {y !== undefined && <div className="guia guia-h" style={{ top: y }} />}
      {eixoX !== undefined && <div className="guia guia-v guia-eixo" style={{ left: eixoX }} />}
      {eixoY !== undefined && <div className="guia guia-h guia-eixo" style={{ top: eixoY }} />}
    </ViewportPortal>
  );
}
