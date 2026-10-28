import { useEffect, type ReactNode } from "react";

type Props = {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  rodape: ReactNode;
  onFechar: () => void;
};

/** Janela modal no estilo do painel (fundo escuro, borda, botão laranja). */
export function Modal({ titulo, subtitulo, children, rodape, onFechar }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="modal-cabeca">
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button className="modal-fechar" onClick={onFechar} aria-label="Fechar">×</button>
        </header>
        <div className="modal-corpo">{children}</div>
        <footer className="modal-rodape">{rodape}</footer>
      </div>
    </div>
  );
}
