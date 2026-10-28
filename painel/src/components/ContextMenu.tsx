import { useEffect, useRef } from "react";
import { API } from "../api";

export type MenuAlvo =
  | { tipo: "node"; id: string; url?: string; ehPagina: boolean; x: number; y: number }
  | { tipo: "edge"; id: string; x: number; y: number };

type Props = {
  alvo: MenuAlvo;
  onApagar: () => void;
  onEditar: () => void;
  onRenovarThumb: () => void;
  onFechar: () => void;
};

/** Menu do botão direito sobre um bloco ou uma seta do canvas. */
export function ContextMenu({ alvo, onApagar, onEditar, onRenovarThumb, onFechar }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onFechar();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("mousedown", fora);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", fora);
      window.removeEventListener("keydown", esc);
    };
  }, [onFechar]);

  return (
    <div ref={ref} className="context-menu" onContextMenu={(e) => e.preventDefault()} style={{ left: alvo.x, top: alvo.y }}>
      {alvo.tipo === "node" && (
        <>
          <button onClick={onEditar}>Editar etapa</button>
          {alvo.url && (
            <button onClick={() => { window.open(alvo.url, "_blank", "noopener"); onFechar(); }}>
              Abrir link em nova aba
            </button>
          )}
          {alvo.ehPagina && API && <button onClick={onRenovarThumb}>Atualizar miniatura</button>}
        </>
      )}
      <button className="perigo" onClick={onApagar}>
        {alvo.tipo === "node" ? "Apagar etapa" : "Apagar ligação"}
      </button>
    </div>
  );
}
