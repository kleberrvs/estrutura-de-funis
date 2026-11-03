import { useEffect, useRef, useState } from "react";

export type ModoPrevia = "computador" | "celular";

/** Alternador Computador | Celular (mesmo visual do editor). */
export function AlternaAparelho({ modo, onMudar }: { modo: ModoPrevia; onMudar: (m: ModoPrevia) => void }) {
  return (
    <div className="ed-aparelho" role="group" aria-label="Tamanho da tela">
      <button className={modo === "computador" ? "ativa" : ""} onClick={() => onMudar("computador")}>Computador</button>
      <button className={modo === "celular" ? "ativa" : ""} onClick={() => onMudar("celular")}>Celular</button>
    </div>
  );
}

/** Mostra a página de verdade (HTML final) no tamanho de computador ou de celular, encolhida para caber na área. */
export function PreviaPagina({ html, modo }: { html: string; modo: ModoPrevia }) {
  const area = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ler = () => setMedida({ w: el.clientWidth, h: el.clientHeight });
    ler();
    const ro = new ResizeObserver(ler);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const celular = modo === "celular";
  const larg = celular ? 390 : 1280;
  const alt0 = celular ? 800 : 0;
  const escala = medida.w ? Math.min(1, celular ? Math.min(medida.w / larg, (medida.h - 16) / alt0) : medida.w / larg) : 1;
  const alt = celular ? alt0 : medida.h / escala;

  return (
    <div className="prev-area" ref={area}>
      <div className={`prev-moldura${celular ? " cel" : ""}`} style={{ width: larg * escala, height: alt * escala }}>
        <iframe srcDoc={html} title="Visualização" style={{ width: larg, height: alt, transform: `scale(${escala})` }} />
      </div>
    </div>
  );
}
