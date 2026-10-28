import { memo, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { EtapaNode as EtapaNodeType, MetricasDia } from "../types";
import { IMAGEM_ANUNCIO_PADRAO, TIPOS } from "../etapas";
import { API, metricasDia, thumbUrl } from "../api";
import { LogoPlataforma, PLATAFORMAS, plataformaDe } from "../plataformas";

function pct(parte: number, total: number) {
  if (!total) return "–";
  return `${Math.round((parte / total) * 100)}%`;
}

function caminhoCurto(url: string) {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

/** Primeiras palavras do texto, com reticências (o bloco não cresce). */
export function resumo(texto: string | undefined, palavras = 12, max = 90) {
  const t = (texto ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const p = t.split(" ");
  let r = p.slice(0, palavras).join(" ");
  if (r.length > max) r = r.slice(0, max).trimEnd();
  return r.length < t.length ? `${r}…` : r;
}

/** Linha 1 = assunto do e-mail; o resto é a prévia do corpo. */
const partesEmail = (texto?: string) => {
  const [assunto = "", ...resto] = (texto ?? "").split("\n");
  return { assunto: assunto.trim(), previa: resto.join(" ").replace(/\s+/g, " ").trim() };
};

type EditavelProps = {
  id: string;
  texto?: string;
  editorClass: string;
  linhas?: number;
  placeholder: string;
  children: ReactNode; // como o texto aparece quando não está em edição
};

/**
 * Clique para editar o texto da mensagem ali mesmo. Cada tecla atualiza o
 * bloco na hora (updateNodeData); Esc, Cmd/Ctrl+Enter ou clicar fora encerra.
 */
function TextoEditavel({ id, texto, editorClass, linhas = 4, placeholder, children }: EditavelProps) {
  const { updateNodeData } = useReactFlow();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(texto ?? "");
  useEffect(() => { if (!editando) setValor(texto ?? ""); }, [texto, editando]);

  const teclas = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) e.currentTarget.blur();
  };

  if (editando) {
    return (
      <textarea
        className={`nodrag nowheel editor ${editorClass}`}
        autoFocus
        rows={linhas}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => { setValor(e.target.value); updateNodeData(id, { texto: e.target.value }); }}
        onBlur={() => setEditando(false)}
        onKeyDown={teclas}
        onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
      />
    );
  }
  return (
    <div className="editavel" title={texto ? `${texto}\n\n(clique para editar)` : "Clique para escrever"} onClick={() => setEditando(true)}>
      {children}
    </div>
  );
}

/** Miniatura real da página, com estados de carregando e erro. Sem servidor, mostra só o endereço. */
function Miniatura({ url, versao }: { url: string; versao?: number }) {
  const src = thumbUrl(url, versao);
  const [estado, setEstado] = useState<"carregando" | "ok" | "erro">("carregando");
  useEffect(() => setEstado("carregando"), [src]);
  if (!src) {
    return (
      <div className="thumb thumb-erro">
        <div className="thumb-placeholder">{caminhoCurto(url)}</div>
      </div>
    );
  }
  return (
    <div className={`thumb thumb-${estado}`}>
      <img key={src} src={src} alt="" onLoad={() => setEstado("ok")} onError={() => setEstado("erro")} />
      {estado !== "ok" && (
        <div className="thumb-placeholder">
          {estado === "carregando" ? "Tirando o print da página…" : caminhoCurto(url)}
          {estado === "erro" && <small>Sem miniatura: serviço fora do ar ou página inacessível</small>}
        </div>
      )}
    </div>
  );
}

/** Impressões e cliques do dia (Search Console) para etapas de página. */
function LinhaDiaria({ url }: { url: string }) {
  const [m, setM] = useState<MetricasDia | null | undefined>(undefined);
  useEffect(() => {
    let vivo = true;
    metricasDia(url).then((r) => vivo && setM(r));
    return () => { vivo = false; };
  }, [url]);
  if (m === undefined) return null;
  if (m === null) return <p className="diaria diaria-off">Impressões e cliques: conectar Search Console</p>;
  return (
    <p className="diaria">
      <span>{fmt(m.impressoes)}</span> impressões · <span>{fmt(m.cliques)}</span> cliques
      <small>Google, {m.data}</small>
    </p>
  );
}

/** Área do meio do bloco, diferente para cada tipo de etapa. */
function Visual({ id, data }: { id: string; data: EtapaNodeType["data"] }) {
  const { tipo, url, texto, canal, thumbVersao, imagem } = data;
  const linhas = (t?: string) => (t ?? "").split("\n").filter(Boolean);
  switch (tipo) {
    case "pagina":
      return url ? <Miniatura url={url} versao={thumbVersao} /> : null;
    case "checkout":
      return url ? (
        <Miniatura url={url} versao={thumbVersao} />
      ) : (
        <div className="visual visual-checkout">
          <span className="canal">{canal || "Checkout"}</span>
          <ul>{linhas(texto).map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
      );
    case "whatsapp":
      return (
        <div className="visual visual-whats">
          <TextoEditavel id={id} texto={texto} editorClass="editor-bolha" placeholder="Escreva a mensagem…">
            <div className={`bolha${texto ? "" : " vazia"}`}>{resumo(texto) || "Clique para escrever a mensagem"}</div>
          </TextoEditavel>
          <span className="hora">✓✓</span>
        </div>
      );
    case "email": {
      const { assunto, previa } = partesEmail(texto);
      return (
        <div className="visual visual-email">
          <TextoEditavel id={id} texto={texto} editorClass="editor-inbox" linhas={4} placeholder={"Assunto na primeira linha\nPrévia do corpo nas seguintes"}>
            <div className="inbox">
              <span className="inbox-avatar">R</span>
              <div className="inbox-texto">
                <div className="inbox-topo"><b>Revolução Concursos</b><time>agora</time></div>
                <div className={`inbox-assunto${assunto ? "" : " vazia"}`}>{resumo(assunto, 10, 70) || "Clique para escrever o assunto"}</div>
                <div className={`inbox-previa${previa ? "" : " vazia"}`}>{resumo(previa, 10, 70) || "Prévia do corpo do e-mail"}</div>
              </div>
            </div>
          </TextoEditavel>
        </div>
      );
    }
    case "anuncio":
      return (
        <div className="visual visual-anuncio">
          <img src={imagem || IMAGEM_ANUNCIO_PADRAO} alt="" loading="lazy" />
          <span className="canal">{plataformaDe(canal, url) ? PLATAFORMAS[plataformaDe(canal, url)!].rotulo : canal || "Anúncio"}</span>
          {linhas(texto).length > 0 && (
            <div className="legenda">{linhas(texto).slice(0, 2).join(" · ")}</div>
          )}
        </div>
      );
    case "formulario":
      return (
        <div className="visual visual-form">
          {(linhas(texto).length ? linhas(texto) : ["Nome", "Telefone", "E-mail"]).map((l, i) => (
            <div key={i} className="campo"><span>{l}</span></div>
          ))}
        </div>
      );
    case "popup":
      return (
        <div className="visual visual-popup">
          <div className="janela">{texto || "Conteúdo do pop-up"}</div>
        </div>
      );
    case "audiencia":
      return (
        <div className="visual visual-audiencia">
          <ul>{(linhas(texto).length ? linhas(texto) : ["Público de remarketing"]).map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
      );
    case "gatilho":
      return texto ? <div className="visual visual-linha visual-gatilho"><span>{texto}</span></div> : null;
    case "espera":
      return <div className="visual visual-linha visual-espera"><b>{texto || "—"}</b></div>;
    case "saida":
      return texto ? <div className="visual visual-linha visual-saida"><span>{texto}</span></div> : null;
    case "nota":
      return <div className="visual visual-nota">{texto}</div>;
  }
}

function EtapaNodeComponent({ id, data, selected }: NodeProps<EtapaNodeType>) {
  const { tipo, titulo, url, texto, canal, compacto, stats, rascunho } = data;
  const def = TIPOS[tipo];
  const plataforma = tipo === "whatsapp" ? "whatsapp" : tipo === "email" ? "email" : plataformaDe(canal, url);

  // Espera é coadjuvante: pílula estreita e discreta, só o relógio e o tempo.
  if (tipo === "espera") {
    return (
      <div className={`etapa etapa-espera pilula${selected ? " is-selected" : ""}${rascunho ? " etapa-rascunho" : ""}`} style={{ "--cor": def.cor } as React.CSSProperties} title={`Espera: ${texto ?? ""}`}>
        <Handle type="target" position={Position.Left} className="port" />
        {def.icone}
        <b>{texto || "—"}</b>
        <Handle type="source" position={Position.Right} className="port" />
      </div>
    );
  }
  const classes = ["etapa", `etapa-${tipo}`, compacto ? "etapa-compacta" : "", selected ? "is-selected" : "", rascunho ? "etapa-rascunho" : ""].join(" ").trim();

  return (
    <div className={classes} style={{ "--cor": def.cor } as React.CSSProperties}>
      <Handle type="target" position={Position.Left} className="port" />

      <div className="etapa-tipo">
        {plataforma ? <LogoPlataforma plataforma={plataforma} tamanho={tipo === "email" ? 20 : 16} /> : def.icone}
        <span>{compacto ? titulo : tipo === "anuncio" && plataforma ? PLATAFORMAS[plataforma].rotulo : def.rotulo}</span>
        {rascunho && <span className="rascunho-chip">Rascunho</span>}
        {!def.semNumeros && (
          <span className={`ativos-badge${stats.ativos ? "" : " zero"}`}>
            <i className="pulse" />
            {stats.ativos} agora
          </span>
        )}
      </div>

      {!compacto && <Visual id={id} data={data} />}

      <div className="node-body">
        {compacto && tipo === "whatsapp" && (
          <TextoEditavel id={id} texto={texto} editorClass="editor-bolha editor-mini" linhas={3} placeholder="Escreva a mensagem…">
            <div className={`bolha bolha-mini${texto ? "" : " vazia"}`}>{resumo(texto, 8, 60) || "Clique para escrever"}</div>
          </TextoEditavel>
        )}
        {compacto && tipo === "email" && (
          <TextoEditavel id={id} texto={texto} editorClass="editor-inbox editor-mini" linhas={3} placeholder={"Assunto\nPrévia"}>
            <div className={`inbox inbox-mini${texto ? "" : " vazia"}`}>
              <span className="inbox-avatar">R</span>
              <span className="inbox-assunto">{resumo(partesEmail(texto).assunto, 8, 60) || "Clique para escrever"}</span>
            </div>
          </TextoEditavel>
        )}
        {compacto && tipo !== "whatsapp" && tipo !== "email" && texto && <span className="compacto-sub" title={texto}>{texto}</span>}
        {!compacto && <strong className="node-title">{titulo}</strong>}
        {!compacto && url && (
          <a className="node-url" href={url} target="_blank" rel="noreferrer">
            {caminhoCurto(url)}
          </a>
        )}
        {API && !compacto && tipo === "pagina" && url && <LinhaDiaria url={url} />}
        {!def.semNumeros && (
          <div className="stats">
            <div>
              <span>Entraram</span>
              <b>{stats.entradas}</b>
            </div>
            <div>
              <span>Avançaram</span>
              <b>{stats.avancaram}</b>
            </div>
            <div>
              <span>Conversão</span>
              <b>{pct(stats.avancaram, stats.entradas)}</b>
            </div>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="port" />
    </div>
  );
}

export const EtapaNode = memo(EtapaNodeComponent);
