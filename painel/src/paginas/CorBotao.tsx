const CORES = [
  { v: "#ff6b01", r: "Laranja da Revolução" },
  { v: "#8903bf", r: "Roxo do mentor" },
  { v: "#16071d", r: "Roxo escuro" },
  { v: "#6baff5", r: "Azul da marca" },
  { v: "#cc2500", r: "Vermelho" },
];

type Props = { valor?: string; padrao: string; rotulo?: string; rotuloLimpar?: string; onMudar: (cor: string) => void };

/** Escolha da cor do botão: cores prontas, qualquer cor, ou voltar para a cor da página. */
export function CorBotao({ valor, padrao, rotulo = "Cor do botão", rotuloLimpar, onMudar }: Props) {
  const atual = valor || padrao;
  return (
    <div className="pn-campo">
      <span>{rotulo}</span>
      <div className="cores">
        {CORES.map((c) => (
          <button key={c.v} type="button" title={c.r} aria-label={c.r} className={`cor${valor && atual.toLowerCase() === c.v ? " ativa" : ""}`} style={{ background: c.v }} onClick={() => onMudar(c.v)} />
        ))}
        <label className="cor-livre" title="Escolher outra cor">
          <input type="color" value={atual} onChange={(e) => onMudar(e.target.value)} />
        </label>
      </div>
      {rotuloLimpar && valor && <button type="button" className="pn-limpar" onClick={() => onMudar("")}>{rotuloLimpar}</button>}
    </div>
  );
}
