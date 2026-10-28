import { useRef, type DragEvent } from "react";
import { ORDEM_TIPOS, TIPOS } from "../etapas";
import type { TipoEtapa } from "../types";

export const MIME_TIPO = "application/x-funil-tipo";

/** Menu de etapas: clique adiciona, arrastar solta no lugar certo do canvas. */
export function Paleta({ onEscolher }: { onEscolher: (tipo: TipoEtapa) => void }) {
  const fantasma = useRef<HTMLDivElement>(null);
  const arrastar = (e: DragEvent, tipo: TipoEtapa) => {
    e.dataTransfer.setData(MIME_TIPO, tipo);
    e.dataTransfer.effectAllowed = "copy";
    const g = fantasma.current;
    if (g) {
      g.style.setProperty("--cor", TIPOS[tipo].cor);
      g.querySelector("span")!.textContent = TIPOS[tipo].rotulo;
      e.dataTransfer.setDragImage(g, 24, 24);
    }
  };
  return (
    <nav className="paleta" aria-label="Adicionar etapa">
      <p>Adicionar etapa</p>
      <div className="grade-tipos">
      {ORDEM_TIPOS.map((tipo) => {
        const def = TIPOS[tipo];
        return (
          <button
            key={tipo}
            draggable
            onDragStart={(e) => arrastar(e, tipo)}
            onClick={() => onEscolher(tipo)}
            style={{ "--cor": def.cor } as React.CSSProperties}
            title={def.descricao}
          >
            <i>{def.icone}</i>
            <span>{def.rotulo}</span>
          </button>
        );
      })}
      </div>
      <small>Clique ou arraste para o canvas</small>
      <div className="fantasma" ref={fantasma} aria-hidden="true">
        <i /><span />
        <div className="fantasma-linhas"><b /><b /><b /></div>
      </div>
    </nav>
  );
}
