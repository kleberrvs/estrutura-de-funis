import { useEffect, useMemo, useRef, useState } from "react";
import { carregarBiblioteca, ehTopo, FUNCOES, funcaoDe, htmlDoTema, temTema, type Biblioteca, type BlocoVitrine, type Funcao, type GrupoVitrine, type Tema } from "./vitrine/biblioteca";

type Props = { onEscolher: (grupo: string, bloco: string, tema: Tema) => void; soTopos?: boolean; funcaoInicial?: Funcao };
type Entrada = { g: GrupoVitrine; b: BlocoVitrine; funcao: Funcao };

/** Miniatura do bloco: o HTML real, encolhido, sem clique. Só é montada quando o card aparece na tela. */
function Mini({ bib, grupo, bloco, tema }: { bib: Biblioteca; grupo: GrupoVitrine; bloco: BlocoVitrine; tema: Tema }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisivel(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const doc = useMemo(
    () => (visivel ? `<!doctype html><meta charset="utf-8"><style>${bib.css}\n${grupo.css}\nbody{margin:0}</style>${htmlDoTema(bloco, tema)}` : ""),
    [visivel, bib, grupo, bloco, tema],
  );
  return <div className="cat-mini" ref={ref} aria-hidden="true">{doc && <iframe srcDoc={doc} tabIndex={-1} title="" />}</div>;
}

/** Seus blocos da Vitrine organizados pela função na página (topo, prova social, oferta...), de qualquer tipo de página. */
export function CatalogoModelos({ onEscolher, soTopos, funcaoInicial }: Props) {
  const [bib, setBib] = useState<Biblioteca | null>(null);
  const [funcao, setFuncao] = useState<Funcao>(funcaoInicial ?? "Topo");
  const [origem, setOrigem] = useState<string>("todas");
  const [tema, setTema] = useState<Tema>("escuro");
  useEffect(() => { carregarBiblioteca().then(setBib); }, []);

  const todas = useMemo<Entrada[]>(
    () => (bib ? bib.grupos.filter((g) => !g.soExemplo).flatMap((g) => g.blocos.map((b) => ({ g, b, funcao: funcaoDe(g.id, b) }))).filter((e) => !soTopos || ehTopo(e.g.id, e.b)) : []),
    [bib, soTopos],
  );
  if (!bib) return <p className="dica">Carregando seus modelos...</p>;

  const funcoes = FUNCOES.filter((f) => todas.some((e) => e.funcao === f && (origem === "todas" || e.g.id === origem)));
  const atual = soTopos ? "Topo" : funcoes.includes(funcao) ? funcao : (funcoes[0] ?? "Topo");
  const lista = todas.filter((e) => (soTopos || e.funcao === atual) && (origem === "todas" || e.g.id === origem));
  const origens = bib.grupos.filter((g) => !g.soExemplo).filter((g) => todas.some((e) => e.g.id === g.id));

  return (
    <div className="cat">
      <div className="cat-topo">
        {!soTopos && (
          <div className="cat-grupos" role="group" aria-label="Função da seção">
            {funcoes.map((f) => (
              <button key={f} className={f === atual ? "ativa" : ""} onClick={() => setFuncao(f)}>
                {f} <small>{todas.filter((e) => e.funcao === f && (origem === "todas" || e.g.id === origem)).length}</small>
              </button>
            ))}
          </div>
        )}
        <div className="ed-aparelho" role="group" aria-label="Tema do bloco">
          <button className={tema === "escuro" ? "ativa" : ""} onClick={() => setTema("escuro")}>Escuro</button>
          <button className={tema === "claro" ? "ativa" : ""} onClick={() => setTema("claro")}>Claro</button>
        </div>
      </div>
      <label className="cat-filtro">
        <span>Mostrar só de</span>
        <select value={origem} onChange={(e) => setOrigem(e.target.value)}>
          <option value="todas">Todas as páginas</option>
          {origens.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
        </select>
      </label>
      <div className="cat-grade">
        {lista.map(({ g, b }) => (
          <button key={`${g.id}:${b.id}`} className="cat-card" onClick={() => onEscolher(g.id, b.id, tema)} title={b.descricao}>
            <span className="cat-nome"><small>{g.nome} · {b.rotulo}</small>{b.nome}{!temTema(b, tema) && <em> (só tem o tema escuro)</em>}</span>
            <Mini bib={bib} grupo={g} bloco={b} tema={tema} />
          </button>
        ))}
        {!lista.length && <p className="dica">Nenhum bloco dessa função nessa página.</p>}
      </div>
    </div>
  );
}
