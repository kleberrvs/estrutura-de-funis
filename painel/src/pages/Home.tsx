import { useCallback, useState, type ReactNode } from "react";
import { MODELOS, arquivarFunil, duplicarFunil, listarFunis, novoFunil, removerFunil, salvarFunil, salvarTodos, type Funil, type Modelo } from "../storage";
import { etapasEmOrdem, fmtBRL, fmtPct, metricasDoFunil } from "../metricas";
import { TIPOS } from "../etapas";
import { FunilDialog } from "../components/FunilDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CapaFunil } from "../components/CapaFunil";

type Dialogo = { tipo: "criar"; modelo: Modelo } | { tipo: "renomear"; funil: Funil } | { tipo: "apagar"; funil: Funil } | null;

const quando = (t: number) =>
  new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const svgIcone = (d: string) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICONES_MODELO: Record<Modelo, ReactNode> = {
  vazio: svgIcone("M12 5v14 M5 12h14"),
  vsl: svgIcone("M4 5h16v11H4z M10 8l5 2.5-5 2.5z M8 20h8"),
  padrao: svgIcone("M3 5h18v14H3z M3 9h18"),
};

/** Tela inicial "Seus funis": começar (em branco ou por modelo) e a lista de funis com miniaturas. */
export function Home({ abrir }: { abrir: (id: string) => void }) {
  const [funis, setFunis] = useState<Funil[]>(listarFunis);
  const recarregar = useCallback(() => setFunis(listarFunis()), []);
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const fechar = () => setDialogo(null);

  const criar = (dados: { nome: string; descricao: string; modelo: Modelo }) => {
    const f = novoFunil(dados.nome, dados.descricao, undefined, dados.modelo);
    salvarTodos([...listarFunis(), f]);
    abrir(f.id);
  };
  const renomear = (f: Funil, dados: { nome: string; descricao: string }) => {
    salvarFunil({ ...f, ...dados });
    fechar();
    recarregar();
  };
  const duplicar = (f: Funil) => { duplicarFunil(f.id); recarregar(); };
  const arquivar = (f: Funil, v: boolean) => { arquivarFunil(f.id, v); recarregar(); };
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const ordemDe = (f: Funil) => (f.ordem ?? 100) * 1e13 + f.criadoEm;
  const ativos = funis.filter((f) => !f.arquivado).sort((a, b) => ordemDe(a) - ordemDe(b));
  const arquivados = funis.filter((f) => f.arquivado);
  const apagar = (f: Funil) => { removerFunil(f.id); fechar(); recarregar(); };

  const totais = ativos.reduce(
    (t, f) => { const m = metricasDoFunil(f.nodes, f.edges); return { entraram: t.entraram + m.entraram, ativos: t.ativos + m.ativos }; },
    { entraram: 0, ativos: 0 },
  );

  return (
    <div className="home">
      <header className="home-topo">
        <div className="home-marca">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="34" height="34" />
          <div>
            <h1>Seus funis</h1>
            <p>{ativos.length} {ativos.length === 1 ? "funil" : "funis"} · {totais.entraram} leads · <span className="verde">{totais.ativos} ativos agora</span></p>
          </div>
        </div>
        <div className="home-acoes">
          <button className="btn-primary" onClick={() => setDialogo({ tipo: "criar", modelo: "vazio" })}>+ Novo funil</button>
        </div>
      </header>

      <section className="comecar">
        <h2>Começar</h2>
        <div className="comecar-grade">
          {(Object.keys(MODELOS) as Modelo[]).map((k) => (
            <button key={k} className={`card-modelo${k === "vazio" ? " em-branco" : ""}`} onClick={() => setDialogo({ tipo: "criar", modelo: k })}>
              <i>{ICONES_MODELO[k]}</i>
              <strong>{k === "vazio" ? "Novo funil em branco" : `Modelo: ${MODELOS[k].rotulo}`}</strong>
              <span>{MODELOS[k].descricao}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Funis</h2>
        <div className="grade">
          {ativos.map((f) => {
            const m = metricasDoFunil(f.nodes, f.edges);
            const ordem = etapasEmOrdem(f.nodes, f.edges);
            return (
              <article key={f.id} className="card-funil" onClick={() => abrir(f.id)}>
                <div className="card-cabeca">
                  <h3>{f.nome}</h3>
                  <span className="card-etapas-n">{f.nodes.filter((n) => n.data.tipo !== "nota").length} etapas</span>
                </div>
                <div className="card-capa">
                  <CapaFunil capa={f.capa} nodes={f.nodes} edges={f.edges} />
                  {m.ativos > 0 && <span className="ativos-badge"><i className="pulse" />{m.ativos} agora</span>}
                </div>
                <div className="card-kpis">
                  <div><span>Leads</span><b>{m.entraram}</b></div>
                  <div><span>Receita</span><b>{fmtBRL(m.receita)}</b></div>
                  <div><span>Conversão</span><b className={m.conversao ? "verde" : ""}>{fmtPct(m.conversao)}</b></div>
                </div>
                <p className="card-desc">{f.descricao || "Sem descrição"}</p>
                <ol className="card-fluxo">
                  {ordem.slice(0, 5).map(({ node: n, passos }) => {
                    const def = TIPOS[n.data.tipo];
                    return (
                      <li key={n.id} style={{ "--cor": def.cor } as React.CSSProperties}>
                        <i>{def.icone}</i>
                        <span>{n.data.titulo}</span>
                        <small>{passos ? `${passos} passos` : def.rotulo}</small>
                      </li>
                    );
                  })}
                  {ordem.length > 5 && <li className="mais">+{ordem.length - 5} etapas</li>}
                </ol>
                <footer className="card-rodape" onClick={(e) => e.stopPropagation()}>
                  <time>Atualizado {quando(f.atualizadoEm)}</time>
                  <div className="card-acoes">
                    <button onClick={() => setDialogo({ tipo: "renomear", funil: f })}>Renomear</button>
                    <button onClick={() => duplicar(f)}>Duplicar</button>
                    <button onClick={() => arquivar(f, true)} title="Some da lista, mas o desenho e os números ficam guardados">Arquivar</button>
                    <button className="perigo" onClick={() => setDialogo({ tipo: "apagar", funil: f })}>Apagar</button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      {arquivados.length > 0 && (
        <section className="arquivados">
          <button className="link-arquivados" onClick={() => setMostrarArquivados((v) => !v)}>
            {mostrarArquivados ? "Ocultar" : "Ver"} arquivados ({arquivados.length})
          </button>
          {mostrarArquivados && (
            <ul>
              {arquivados.map((f) => (
                <li key={f.id}>
                  <span>{f.nome}</span>
                  <small>{f.nodes.filter((n) => n.data.tipo !== "nota").length} etapas · atualizado {quando(f.atualizadoEm)}</small>
                  <button onClick={() => abrir(f.id)}>Abrir</button>
                  <button onClick={() => arquivar(f, false)}>Restaurar</button>
                  <button className="perigo" onClick={() => setDialogo({ tipo: "apagar", funil: f })}>Apagar</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {dialogo?.tipo === "criar" && <FunilDialog modo="criar" modeloInicial={dialogo.modelo} onSalvar={criar} onFechar={fechar} />}
      {dialogo?.tipo === "renomear" && (
        <FunilDialog modo="renomear" inicial={dialogo.funil} onSalvar={({ nome, descricao }) => renomear(dialogo.funil, { nome, descricao })} onFechar={fechar} />
      )}
      {dialogo?.tipo === "apagar" && (
        <ConfirmDialog
          titulo="Apagar funil"
          texto={`Apagar "${dialogo.funil.nome}"? O desenho e os números dele somem de vez.`}
          rotulo="Apagar funil"
          onConfirmar={() => apagar(dialogo.funil)}
          onFechar={fechar}
        />
      )}
    </div>
  );
}
