import { BLOCOS } from "./blocos";
import { lerCaminho } from "./caminho";
import type { Bloco, Campo } from "./tipos";
import { CorBotao } from "./CorBotao";
import { CorFundo } from "./CorFundo";
import { achar } from "./vitrine/biblioteca";
import { listarImagens, listarLinks, temFormulario } from "./modeloHtml";
import { ehEscuro, esc, soTexto } from "./html";

type Props = {
  bloco: Bloco;
  corPagina: string;
  /** Quando o bloco é um topo, abre a escolha de outros topos (claro, escuro). */
  onTrocarTopo?: () => void;
  onMudar: (caminho: string, valor: unknown, atrasar?: boolean) => void;
  onLista: (caminho: string, acao: "subir" | "descer" | "tirar" | "novo", indice?: number) => void;
  onImagem: (caminho: string) => void;
};

type Simples = Exclude<Campo, { k: "lista" }>;

const resumo = (item: unknown, campos: Simples[]) => {
  const t = campos.find((c) => c.k === "texto");
  const v = t ? soTexto((item as Record<string, unknown>)[t.chave]) : "";
  return v.length > 34 ? `${v.slice(0, 34)}…` : v || "(vazio)";
};

/** Painel da direita: ajustes do bloco que não dá para fazer clicando na página. */
export function PainelBloco({ bloco, corPagina, onTrocarTopo, onMudar, onLista, onImagem }: Props) {
  const def = BLOCOS[bloco.tipo];

  const campo = (c: Simples, caminho: string) => {
    const valor = lerCaminho(bloco.dados, caminho);
    switch (c.k) {
      case "bool":
        return (
          <label key={caminho} className="pn-check">
            <input type="checkbox" checked={!!valor} onChange={(e) => onMudar(caminho, e.target.checked)} />
            <span>{c.rotulo}</span>
          </label>
        );
      case "escolha":
        return (
          <label key={caminho} className="pn-campo">
            <span>{c.rotulo}</span>
            <select value={String(valor ?? "")} onChange={(e) => onMudar(caminho, e.target.value)}>
              {c.opcoes.map((o) => <option key={o.v} value={o.v}>{o.r}</option>)}
            </select>
          </label>
        );
      case "imagem":
        return (
          <div key={caminho} className="pn-campo">
            <span>{c.rotulo}</span>
            <button type="button" className="pn-imagem" onClick={() => onImagem(caminho)}>
              {valor ? <img src={String(valor)} alt="" /> : <em>Escolher imagem</em>}
            </button>
          </div>
        );
      case "link":
        return (
          <label key={caminho} className="pn-campo">
            <span>{c.rotulo}</span>
            <input value={String(valor ?? "")} placeholder={c.dica ?? "https://... ou #formulario"} onChange={(e) => onMudar(caminho, e.target.value, true)} />
          </label>
        );
      case "texto":
        return (
          <label key={caminho} className="pn-campo">
            <span>{c.rotulo}</span>
            <textarea rows={soTexto(valor).length > 60 ? 3 : 1} value={soTexto(valor)} onChange={(e) => onMudar(caminho, esc(e.target.value), true)} />
          </label>
        );
    }
  };

  return (
    <div className="pn">
      <h3>{bloco.tipo === "modelo" ? "Bloco da Vitrine" : def.rotulo}</h3>
      <p className="pn-dica">{bloco.tipo === "modelo" ? String(bloco.dados.nome ?? def.rotulo) : def.descricao}. Clique direto no texto da página para escrever e na imagem para trocar.</p>
      {onTrocarTopo && (
        <button type="button" className="btn-primary pn-topo-troca" onClick={onTrocarTopo}>Trocar o topo (claro, escuro e outros)</button>
      )}
      <CorFundo valor={String(bloco.dados.corFundo ?? "")} padrao="#ffffff" rotulo="Cor do fundo desta seção" rotuloLimpar="Voltar ao fundo original da seção" onMudar={(cor) => onMudar("corFundo", cor)} />
      <CorFundo valor={String(bloco.dados.corTexto ?? "")} padrao="#221e27" rotulo="Cor do texto desta seção" rotuloLimpar="Voltar à cor original do texto" onMudar={(cor) => onMudar("corTexto", cor)} />
      <p className="pn-dica">Para mudar só um trecho, selecione o texto na página e escolha a cor na barra que aparece.</p>
      {bloco.tipo === "modelo" && (() => {
        const html = String(bloco.dados.html ?? "");
        const links = listarLinks(html);
        const imagens = listarImagens(html);
        const origem = achar(String(bloco.dados.grupo), String(bloco.dados.ref)).bloco;
        return (
          <>
            {origem?.claro && /^#[0-9a-f]{6}$/i.test(String(bloco.dados.corFundo ?? "")) && !bloco.dados.corTexto && ehEscuro(String(bloco.dados.corFundo)) !== (bloco.dados.tema === "escuro") && (
              <div className="pn-aviso">
                O fundo escolhido é {ehEscuro(String(bloco.dados.corFundo)) ? "escuro" : "claro"}, mas o bloco está no tema {String(bloco.dados.tema)}. Alguns textos podem ficar difíceis de ler.
                <button type="button" className="btn-secundario" onClick={() => { if (window.confirm("Trocar o tema volta este bloco ao texto original do modelo. Continuar?")) onMudar("html-tema", ehEscuro(String(bloco.dados.corFundo)) ? "escuro" : "claro"); }}>
                  Trocar para o tema {ehEscuro(String(bloco.dados.corFundo)) ? "Escuro" : "Claro"}
                </button>
              </div>
            )}
            {origem?.claro && (
              <label className="pn-campo">
                <span>Tema do bloco</span>
                <select value={String(bloco.dados.tema)} onChange={(e) => { if (window.confirm("Trocar o tema volta este bloco ao texto original do modelo. Continuar?")) onMudar("html-tema", e.target.value); }}>
                  <option value="escuro">Escuro</option>
                  <option value="claro">Claro</option>
                </select>
              </label>
            )}
            {temFormulario(html) && (
              <label className="pn-campo"><span>Para onde vai depois de enviar o formulário</span><input value={String(bloco.dados.destino ?? "")} placeholder="Endereço da página de obrigado" onChange={(e) => onMudar("destino", e.target.value, true)} /></label>
            )}
            {imagens.filter((im) => im.fundo).map((im) => (
              <button key={`fundo-${im.n}`} type="button" className="btn-primary pn-topo-troca" onClick={() => onImagem(`html-img:${im.n}`)}>Trocar a imagem de fundo do topo</button>
            ))}
            {imagens.length > 0 && (
              <section className="pn-lista pn-imagens">
                <h4>Imagens do bloco</h4>
                <p className="pn-dica">Clique numa imagem para trocar. Aqui aparecem também as imagens de fundo, que ficam por baixo do texto.</p>
                <div className="pn-imgs-grade">
                  {imagens.map((im) => (
                    <button key={im.n} type="button" className="pn-img-item" onClick={() => onImagem(`html-img:${im.n}`)} title={`Trocar: ${im.nome}`}>
                      <img src={im.src} alt="" />
                      <small>{im.nome}</small>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {links.length > 0 && (
              <section className="pn-lista pn-links">
                <h4>Links e botões</h4>
                {links.map((l) => (
                  <label key={l.n} className="pn-link"><span>{l.texto}</span><input value={l.href} placeholder="https://... ou #formulario" onChange={(e) => onMudar(`html-link:${l.n}`, e.target.value, true)} /></label>
                ))}
              </section>
            )}
          </>
        );
      })()}
      {(bloco.tipo === "modelo" || def.campos.some((c) => c.chave === "botao" || c.chave === "mostrarBotao")) && (
        <CorBotao valor={String(bloco.dados.corBotao ?? "")} padrao={corPagina} rotuloLimpar="Usar a cor da página" onMudar={(cor) => onMudar("corBotao", cor)} />
      )}
      {def.campos.map((c) => {
        if (c.k !== "lista") return campo(c, c.chave);
        const itens = (bloco.dados[c.chave] as unknown[]) ?? [];
        return (
          <section key={c.chave} className="pn-lista">
            <h4>{c.rotulo}</h4>
            {itens.map((item, i) => (
              <details key={i} className="pn-item">
                <summary>
                  <b>{i + 1}</b> {resumo(item, c.campos)}
                  <span className="pn-item-acoes" onClick={(e) => e.preventDefault()}>
                    <button title="Subir" disabled={i === 0} onClick={() => onLista(c.chave, "subir", i)}>↑</button>
                    <button title="Descer" disabled={i === itens.length - 1} onClick={() => onLista(c.chave, "descer", i)}>↓</button>
                    <button title="Tirar" className="perigo" onClick={() => onLista(c.chave, "tirar", i)}>×</button>
                  </span>
                </summary>
                {c.campos.map((sub) => campo(sub, `${c.chave}.${i}.${sub.chave}`))}
              </details>
            ))}
            <button type="button" className="btn-secundario pn-novo" onClick={() => onLista(c.chave, "novo")}>+ Adicionar {c.item}</button>
          </section>
        );
      })}
    </div>
  );
}
