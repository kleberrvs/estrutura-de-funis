import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { documentoFinal } from "./documento";
import { MODELOS_PAGINA, paginaDoExemplo } from "./modelos";
import { duplicarPagina, listarPaginas, novaPagina, removerPagina, salvarPagina, salvarTodas } from "./storage";
import { carregarBiblioteca, type Biblioteca } from "./vitrine/biblioteca";
import { EscolhaPagina } from "./EscolhaPagina";
import { SO_PAGINAS } from "../App";
import type { ModeloBase, Pagina } from "./tipos";

const quando = (t: number) => new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const BASICOS = Object.keys(MODELOS_PAGINA) as ModeloBase[];

/** Modelo escolhido: um dos básicos ("captura") ou um exemplo da Vitrine ("vitrine:vendas-exemplo-01"). */
type Escolha = string;
type Dialogo = { tipo: "tipos" } | { tipo: "criar"; modelo: Escolha; modeloNome: string } | { tipo: "renomear"; pagina: Pagina } | { tipo: "apagar"; pagina: Pagina } | null;

function NomeDialog({ modelo, modeloNome, inicial, onSalvar, onFechar }: { modelo?: Escolha; modeloNome?: string; inicial?: Pagina; onSalvar: (d: { nome: string; descricao: string; modelo: Escolha }) => void; onFechar: () => void }) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const m: Escolha = modelo ?? "branco";
  const enviar = (e: FormEvent) => { e.preventDefault(); if (nome.trim()) onSalvar({ nome: nome.trim(), descricao: descricao.trim(), modelo: m }); };
  return (
    <Modal
      titulo={inicial ? "Renomear página" : "Nova página"}
      subtitulo={inicial ? undefined : "Dê um nome. Depois é só editar os blocos, os textos e as imagens."}
      onFechar={onFechar}
      rodape={<><button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button><button type="submit" form="form-pagina" className="btn-primary" disabled={!nome.trim()}>{inicial ? "Salvar" : "Criar página"}</button></>}
    >
      <form id="form-pagina" className="form" onSubmit={enviar}>
        <label><span>Nome</span><input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Captura do e-book de Português" /></label>
        {!inicial && modeloNome && <p className="modal-texto">Modelo escolhido: <b>{modeloNome}</b></p>}
        <label><span>Descrição <em>(opcional)</em></span><input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label>
      </form>
    </Modal>
  );
}

/** Capa vertical da página: o HTML final, encolhido (cabe no quadro .tipo-previa). */
function Mini({ pagina, pronta }: { pagina: Pagina; pronta: boolean }) {
  const html = useMemo(() => documentoFinal(pagina, { videos: false }), [pagina, pronta]); // eslint-disable-line react-hooks/exhaustive-deps
  return <iframe srcDoc={html} loading="lazy" tabIndex={-1} title="" />;
}

/** Tela inicial "Suas páginas": começar por modelo e lista de páginas criadas. */
export function HomePaginas({ abrir }: { abrir: (id: string) => void }) {
  const [paginas, setPaginas] = useState<Pagina[]>(listarPaginas);
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [bib, setBib] = useState<Biblioteca | null>(null);
  useEffect(() => { carregarBiblioteca().then(setBib); }, []);
  const recarregar = () => setPaginas(listarPaginas());
  const fechar = () => setDialogo(null);

  const criar = async (d: { nome: string; descricao: string; modelo: Escolha }) => {
    let p: Pagina;
    if (d.modelo.startsWith("vitrine:")) {
      const b = await carregarBiblioteca();
      const ex = b.exemplos.find((x) => `vitrine:${x.id}` === d.modelo);
      p = ex ? paginaDoExemplo(novaPagina(d.nome, d.descricao, "branco"), ex) : novaPagina(d.nome, d.descricao, "branco");
    } else {
      p = novaPagina(d.nome, d.descricao, d.modelo as ModeloBase);
    }
    salvarTodas([...listarPaginas(), p]);
    abrir(p.id);
  };
  const ativas = paginas.filter((p) => !p.arquivada).sort((a, b) => b.atualizadoEm - a.atualizadoEm);

  return (
    <div className="home">
      <header className="home-topo">
        <div className="home-marca">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="34" height="34" />
          <div>
            <h1>Suas páginas</h1>
            <p>{ativas.length} {ativas.length === 1 ? "página" : "páginas"}</p>
          </div>
        </div>
        <nav className="home-nav" aria-label="Áreas"><a href="#/paginas" className="ativa">Páginas</a>{!SO_PAGINAS && <a href="#/">Funis</a>}</nav>
        <div className="home-acoes"><button className="btn-primary" onClick={() => setDialogo({ tipo: "tipos" })}>+ Nova página</button></div>
      </header>

      <section className="comecar">
        <h2>Começar</h2>
        <div className="tipos-grade">
          <button className="tipo-card em-branco" onClick={() => setDialogo({ tipo: "tipos" })}>
            <strong>Criar página</strong>
            <div className="tipo-previa" aria-hidden="true"><span className="tipo-mais">+</span></div>
            <small>Escolha um modelo ou comece com uma página vazia</small>
          </button>
        </div>
      </section>

      {ativas.length > 0 && (
        <section>
          <h2>Páginas</h2>
          <div className="tipos-grade">
            {ativas.map((p) => (
              <article key={p.id} className="tipo-card pagina-card" onClick={() => abrir(p.id)}>
                <strong>{p.nome}</strong>
                <div className="tipo-previa" aria-hidden="true"><Mini pagina={p} pronta={!!bib} /></div>
                <small>{p.blocos.length} blocos · {quando(p.atualizadoEm)}</small>
                <div className="pagina-acoes" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setDialogo({ tipo: "renomear", pagina: p })}>Renomear</button>
                  <button onClick={() => { duplicarPagina(p.id); recarregar(); }}>Duplicar</button>
                  <button className="perigo" onClick={() => setDialogo({ tipo: "apagar", pagina: p })}>Apagar</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {dialogo?.tipo === "tipos" && (
        <Modal largo titulo="Nova página" subtitulo="Escolha uma página para começar. Depois de aberta, você muda o que quiser: textos, imagens, cores, blocos e o topo." onFechar={fechar} rodape={<button className="btn-secundario" onClick={fechar}>Cancelar</button>}>
          <EscolhaPagina bib={bib} onEscolher={(modelo, modeloNome) => setDialogo({ tipo: "criar", modelo, modeloNome })} />
        </Modal>
      )}
      {dialogo?.tipo === "criar" && <NomeDialog modelo={dialogo.modelo} modeloNome={dialogo.modeloNome} onSalvar={criar} onFechar={fechar} />}
      {dialogo?.tipo === "renomear" && <NomeDialog inicial={dialogo.pagina} onSalvar={({ nome, descricao }) => { salvarPagina({ ...dialogo.pagina, nome, descricao }); fechar(); recarregar(); }} onFechar={fechar} />}
      {dialogo?.tipo === "apagar" && <ConfirmDialog titulo="Apagar página" texto={`Apagar "${dialogo.pagina.nome}"? Os blocos e textos dela somem de vez.`} rotulo="Apagar página" onConfirmar={() => { removerPagina(dialogo.pagina.id); fechar(); recarregar(); }} onFechar={fechar} />}
    </div>
  );
}
