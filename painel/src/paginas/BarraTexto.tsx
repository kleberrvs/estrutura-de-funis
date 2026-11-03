const CORES = [
  { v: "#ffffff", r: "Branco" }, { v: "#221e27", r: "Preto da plataforma" }, { v: "#ff6b01", r: "Laranja" }, { v: "#ffbb8b", r: "Pêssego" },
  { v: "#f7db6d", r: "Amarelo da marca" }, { v: "#6baff5", r: "Azul da marca" }, { v: "#8903bf", r: "Roxo do mentor" }, { v: "#cc2500", r: "Vermelho" },
];

type Props = {
  x: number;
  y: number;
  onCor: (hex: string) => void;
  onNegrito: () => void;
  onLimpar: () => void;
  /** Avisa que o seletor de cor livre vai abrir (a seleção do texto precisa ser guardada). */
  onAbrirLivre: () => void;
  onFecharLivre: () => void;
};

/** Barra que aparece sobre o texto selecionado: cor do trecho, negrito e limpar formatação. */
export function BarraTexto({ x, y, onCor, onNegrito, onLimpar, onAbrirLivre, onFecharLivre }: Props) {
  const seguro = (e: React.MouseEvent) => e.preventDefault(); // não tirar a seleção do texto ao clicar na barra
  return (
    <div className={`barra-texto${y < 90 ? " abaixo" : ""}`} style={{ left: x, top: y }} onMouseDown={seguro} role="toolbar" aria-label="Formatar texto selecionado">
      {CORES.map((c) => (
        <button key={c.v} type="button" className="cor" title={`Cor do texto: ${c.r}`} aria-label={c.r} style={{ background: c.v }} onClick={() => onCor(c.v)} />
      ))}
      <label className="cor-livre" title="Outra cor">
        <input type="color" defaultValue="#ff6b01" onPointerDown={onAbrirLivre} onBlur={onFecharLivre} onChange={(e) => onCor(e.target.value)} />
      </label>
      <span className="sep" />
      <button type="button" className="bt" title="Negrito" onClick={onNegrito}>N</button>
      <button type="button" className="bt" title="Tirar cor e negrito do trecho" onClick={onLimpar}>Limpar</button>
    </div>
  );
}
