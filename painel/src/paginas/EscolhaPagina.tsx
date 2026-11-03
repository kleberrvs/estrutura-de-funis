import { useEffect, useMemo, useRef, useState } from "react";
import { htmlDoItem, paginasDisponiveis, type Item } from "./tiposDePagina";
import type { Biblioteca } from "./vitrine/biblioteca";

type Props = { bib: Biblioteca | null; onEscolher: (modelo: string, nome: string) => void };

/** Card de uma página: nome em cima e a capa vertical. A capa só é montada quando o card aparece na tela. */
function Carta({ item, bib, onEscolher }: { item: Item; bib: Biblioteca | null; onEscolher: Props["onEscolher"] }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisivel(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const branco = item.modelo === "branco";
  const html = useMemo(() => (visivel && !branco ? htmlDoItem(item, bib) : ""), [visivel, branco, item, bib]);

  return (
    <button ref={ref} className={`tipo-card${branco ? " em-branco" : ""}`} onClick={() => onEscolher(item.modelo, item.nome)}>
      <strong>{item.modelo.startsWith("vitrine:") ? `Ex.: ${item.nome}` : item.nome}</strong>
      <div className="tipo-previa" aria-hidden="true">
        {branco ? <span className="tipo-mais">+</span> : html && <iframe srcDoc={html} tabIndex={-1} title="" />}
      </div>
      {!item.modelo.startsWith("vitrine:") && <small>{item.nota}</small>}
    </button>
  );
}

/** As páginas lado a lado, como capas verticais. Clicar escolhe; a página abre no editor, onde dá para mudar tudo. */
export function EscolhaPagina({ bib, onEscolher }: Props) {
  const itens = useMemo(() => paginasDisponiveis(bib), [bib]);
  return (
    <div className="escolha-fluxo">
      {itens.map((i) => <Carta key={i.modelo} item={i} bib={bib} onEscolher={onEscolher} />)}
      {!bib && <p className="dica">Carregando as páginas da Vitrine...</p>}
    </div>
  );
}
