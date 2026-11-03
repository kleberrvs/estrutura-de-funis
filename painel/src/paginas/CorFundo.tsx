const FUNDOS = [
  { v: "#ffffff", r: "Branco" },
  { v: "#221e27", r: "Preto da plataforma" },
  { v: "#f1eff4", r: "Cinza da plataforma" },
  { v: "#fff1e7", r: "Pêssego claro" },
  { v: "#fcf7ff", r: "Lilás claro" },
  { v: "#16071d", r: "Roxo escuro" },
  { v: "#1b0e22", r: "Roxo do tema escuro" },
  { v: "#8903bf", r: "Roxo do mentor" },
  { v: "#ff6b01", r: "Laranja da Revolução" },
];

type Props = { valor?: string; padrao: string; rotulo?: string; rotuloLimpar: string; onMudar: (cor: string) => void };

/** Escolha da cor de fundo: cores da marca, qualquer cor, ou voltar ao fundo original. */
export function CorFundo({ valor, padrao, rotulo = "Cor do fundo", rotuloLimpar, onMudar }: Props) {
  const atual = valor || padrao;
  return (
    <div className="pn-campo">
      <span>{rotulo}</span>
      <div className="cores">
        {FUNDOS.map((c) => (
          <button key={c.v} type="button" title={c.r} aria-label={c.r} className={`cor${valor && atual.toLowerCase() === c.v ? " ativa" : ""}`} style={{ background: c.v }} onClick={() => onMudar(c.v)} />
        ))}
        <label className="cor-livre" title="Escolher outra cor">
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(atual) ? atual : "#ffffff"} onChange={(e) => onMudar(e.target.value)} />
        </label>
      </div>
      {valor && <button type="button" className="pn-limpar" onClick={() => onMudar("")}>{rotuloLimpar}</button>}
    </div>
  );
}
