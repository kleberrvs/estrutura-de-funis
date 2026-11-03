import { useCallback, useEffect, useRef, useState } from "react";
import { uid } from "../engine";
import { Modal } from "../components/Modal";
import { BLOCOS, ORDEM_CATALOGO } from "./blocos";
import { gravarCaminho, lerCaminho } from "./caminho";
import { COR_PADRAO, documentoEditor, documentoFinal } from "./documento";
import { CorBotao } from "./CorBotao";
import { CorFundo } from "./CorFundo";
import { ImagemDialog } from "./ImagemDialog";
import { PainelBloco } from "./PainelBloco";
import { novoBloco, novoBlocoModelo } from "./modelos";
import { CatalogoModelos } from "./CatalogoModelos";
import { achar, carregarBiblioteca, ehTopo, type Tema } from "./vitrine/biblioteca";
import { apagarItem, duplicarItem, gravarTexto, gravarVideo, lerVideo, moverItem } from "./modeloHtml";
import { VideoDialog } from "./VideoDialog";
import { limparRico } from "./html";
import { BarraTexto } from "./BarraTexto";
import { AlternaAparelho, PreviaPagina, type ModoPrevia } from "./PreviaPagina";
import { fazSlug, salvarPagina } from "./storage";
import type { Bloco, Pagina, TipoBloco } from "./tipos";

type Alvo = { blocoId: string; caminho: string } | null;

/** Editor: blocos à esquerda, a página editável no meio, ajustes do bloco à direita. */
export function EditorPagina({ inicial, voltar }: { inicial: Pagina; voltar: () => void }) {
  const [pagina, setPagina] = useState(inicial);
  const [selId, setSelId] = useState<string | null>(null);
  const [versaoA, setVersaoA] = useState(0); // quadro principal (computador, ou celular quando o computador está escondido)
  const [versaoB, setVersaoB] = useState(0); // celular ao lado
  const timerOutro = useRef<number>(0);
  const doisRef = useRef(true);
  // Computador e celular abertos lado a lado; cada botão esconde ou mostra o seu (pelo menos um fica aberto).
  const [verComp, setVerComp] = useState(true);
  const [verCel, setVerCel] = useState(true);
  const [medida, setMedida] = useState({ w: 0, h: 0 });
  const meio = useRef<HTMLElement>(null);
  const espelho = useRef<HTMLIFrameElement>(null);
  const [catalogo, setCatalogo] = useState(false);
  const [imagem, setImagem] = useState<Alvo>(null);
  const [estado, setEstado] = useState<"salvo" | "salvando" | "cheio">("salvo");
  const [copiado, setCopiado] = useState(false);
  const [barra, setBarra] = useState<{ x: number; y: number } | null>(null);
  const [previa, setPrevia] = useState(false);
  const [video, setVideo] = useState<{ blocoId: string; n: string } | null>(null);
  const [itemBar, setItemBar] = useState<{ blocoId: string; caminho: number[]; x: number; y: number } | null>(null);
  const [modoPrevia, setModoPrevia] = useState<ModoPrevia>("computador");
  const [arrasto, setArrasto] = useState<{ id: string; sobre: string | null } | null>(null);
  const [troca, setTroca] = useState<string | null>(null); // id do bloco cujo topo está sendo trocado
  const [avisoAdd, setAvisoAdd] = useState("");
  const [aba, setAba] = useState<"basicos" | "vitrine">("vitrine");

  const telas = pagina.modo === "telas";
  // Desfazer e refazer (Command+Z / Command+Shift+Z): guarda as versões anteriores da página.
  const hist = useRef<{ passado: Pagina[]; futuro: Pagina[] }>({ passado: [], futuro: [] });
  const anterior = useRef<Pagina>(inicial);
  const aplicando = useRef(false);
  const ultimoRegistro = useRef(0);
  const [, setHistVer] = useState(0);
  const desfazerRef = useRef<() => void>(() => {});
  const refazerRef = useRef<() => void>(() => {});
  const frame = useRef<HTMLIFrameElement>(null);
  const paginaRef = useRef(pagina);
  const selRef = useRef(selId);
  const timer = useRef<number>(0);
  const guardada = useRef<Range | null>(null); // seleção guardada enquanto o seletor de cor livre está aberto
  paginaRef.current = pagina;
  selRef.current = selId;

  /** Pede para redesenhar a página do meio (com um atraso opcional, para quem digita no painel). */
  const redesenhar = useCallback((atraso = 0) => {
    window.clearTimeout(timer.current);
    const tudo = () => { setVersaoA((v) => v + 1); setVersaoB((v) => v + 1); };
    if (atraso) timer.current = window.setTimeout(tudo, atraso);
    else tudo();
  }, []);

  /** Altera a página; `redesenhar=false` para o que já foi digitado direto na página. */
  const mudar = useCallback((fn: (p: Pagina) => void, quando: false | number = 0) => {
    setPagina((atual) => {
      const novo = structuredClone(atual);
      fn(novo);
      return novo;
    });
    if (quando !== false) redesenhar(quando);
  }, [redesenhar]);

  const mudarBloco = useCallback((id: string, fn: (b: Bloco) => void, quando: false | number = 0) =>
    mudar((p) => { const b = p.blocos.find((x) => x.id === id); if (b) fn(b); }, quando), [mudar]);

  // Blocos da Vitrine precisam do CSS deles: carrega a biblioteca e redesenha.
  useEffect(() => {
    if (inicial.blocos.some((b) => b.tipo === "modelo")) carregarBiblioteca().then(() => redesenhar());
  }, [inicial, redesenhar]);

  // Quiz (telas): sempre tem uma tela escolhida e, ao trocar de tela, o quadro mostra a nova.
  useEffect(() => {
    if (!telas) return;
    if (!selId && pagina.blocos[0]) setSelId(pagina.blocos[0].id);
    else redesenhar();
  }, [selId, telas, redesenhar]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mede a área do meio para encolher o computador quando o celular está ao lado.
  useEffect(() => {
    const el = meio.current;
    if (!el) return;
    const ler = () => setMedida({ w: el.clientWidth, h: el.clientHeight });
    ler();
    const ro = new ResizeObserver(ler);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const doisAbertos = verComp && verCel;
  doisRef.current = doisAbertos;

  /** O que foi digitado num dos quadros aparece no outro logo depois (o quadro onde se digita nunca é redesenhado, para o cursor não pular). */
  const agendarOutro = useCallback((origem: "a" | "b") => {
    if (!doisRef.current) return;
    window.clearTimeout(timerOutro.current);
    timerOutro.current = window.setTimeout(() => (origem === "a" ? setVersaoB((v) => v + 1) : setVersaoA((v) => v + 1)), 350);
  }, []);

  // Registra cada mudança no histórico (digitação seguida vira um passo só).
  useEffect(() => {
    if (aplicando.current) { aplicando.current = false; anterior.current = pagina; return; }
    if (pagina === anterior.current) return;
    const agora = Date.now();
    if (agora - ultimoRegistro.current > 700) {
      hist.current.passado.push(anterior.current);
      if (hist.current.passado.length > 100) hist.current.passado.shift();
      ultimoRegistro.current = agora;
    }
    hist.current.futuro = [];
    anterior.current = pagina;
    setHistVer((v) => v + 1);
  }, [pagina]);

  const voltarPara = (alvo: Pagina) => {
    aplicando.current = true;
    ultimoRegistro.current = 0;
    setPagina(alvo);
    setSelId((id) => (id && alvo.blocos.some((b) => b.id === id) ? id : null));
    setBarra(null);
    redesenhar();
    setHistVer((v) => v + 1);
  };
  const desfazer = () => {
    const h = hist.current;
    const prev = h.passado.pop();
    if (!prev) return;
    h.futuro.push(paginaRef.current);
    voltarPara(prev);
  };
  const refazer = () => {
    const h = hist.current;
    const prox = h.futuro.pop();
    if (!prox) return;
    h.passado.push(paginaRef.current);
    voltarPara(prox);
  };
  desfazerRef.current = desfazer;
  refazerRef.current = refazer;

  // Atalhos na janela (fora dos campos de texto do painel, que têm o desfazer deles).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.tagName === "SELECT")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "z") { e.preventDefault(); if (e.shiftKey) refazerRef.current(); else desfazerRef.current(); }
      else if (k === "y") { e.preventDefault(); refazerRef.current(); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  // Salva sozinho, um instante depois da última mudança.
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    setEstado("salvando");
    const t = window.setTimeout(() => setEstado(salvarPagina(pagina) ? "salvo" : "cheio"), 500);
    return () => window.clearTimeout(t);
  }, [pagina]);

  // Desenha a página no quadro do meio e liga os cliques/digitação.
  const montar = useCallback((f: HTMLIFrameElement, origem: "a" | "b") => {
    const doc = f.contentDocument;
    const win = f.contentWindow;
    if (!doc || !win) return;
    setItemBar(null);
    const y = win.scrollY;
    doc.open();
    doc.write(documentoEditor(paginaRef.current, selRef.current));
    doc.close();
    win.scrollTo(0, y);

    const blocoDe = (el: EventTarget | null) => (el as HTMLElement | null)?.closest?.("[data-bloco]") as HTMLElement | null;
    doc.addEventListener("input", (e) => {
      const bl = blocoDe(e.target);
      const m = (e.target as HTMLElement).closest("[data-m]") as HTMLElement | null;
      if (m && bl) {
        const n = m.getAttribute("data-m")!;
        const interno = m.innerHTML;
        mudarBloco(bl.dataset.bloco!, (b) => { b.dados.html = gravarTexto(String(b.dados.html ?? ""), n, interno); }, false);
        agendarOutro(origem);
        return;
      }
      const el = (e.target as HTMLElement).closest("[data-edit]") as HTMLElement | null;
      if (!el || !bl) return;
      const caminho = el.getAttribute("data-edit")!;
      const texto = limparRico(el.innerHTML);
      mudarBloco(bl.dataset.bloco!, (b) => gravarCaminho(b.dados, caminho, texto), false);
      agendarOutro(origem);
    });
    // Nos blocos da Vitrine: Enter vira quebra de linha e colar entra como texto simples (assim a estrutura do bloco não muda).
    doc.addEventListener("keydown", (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && (k === "z" || k === "y")) { e.preventDefault(); if (k === "y" || e.shiftKey) refazerRef.current(); else desfazerRef.current(); return; }
      if (e.key === "Enter" && (e.target as HTMLElement).closest?.("[data-m],[data-edit]")) { e.preventDefault(); doc.execCommand("insertLineBreak"); }
    });
    doc.addEventListener("paste", (e) => {
      if (!(e.target as HTMLElement).closest?.("[data-m],[data-edit]")) return;
      e.preventDefault();
      doc.execCommand("insertText", false, e.clipboardData?.getData("text/plain") ?? "");
    });
    doc.addEventListener("click", (e) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("a, button")) e.preventDefault();
      const bl = blocoDe(alvo);
      if (!bl) return;
      const id = bl.dataset.bloco!;
      doc.querySelectorAll("[data-bloco].sel").forEach((n) => n.classList.remove("sel"));
      bl.classList.add("sel");
      setSelId(id);
      const img = alvo.closest("[data-img]") as HTMLElement | null;
      if (img) setImagem({ blocoId: id, caminho: img.getAttribute("data-img")! });
      const mi = alvo.closest("[data-i]") as HTMLElement | null;
      if (mi) setImagem({ blocoId: id, caminho: `html-img:${mi.getAttribute("data-i")}` });
      const mv = alvo.closest("[data-v]") as HTMLElement | null;
      if (mv) setVideo({ blocoId: id, n: mv.getAttribute("data-v")! });

      // Item repetido do bloco (cartão, linha de lista...): dá para apagar, duplicar e mover.
      doc.querySelectorAll(".pg-item-sel").forEach((n) => n.classList.remove("pg-item-sel"));
      setItemBar(null);
      if (paginaRef.current.blocos.find((b) => b.id === id)?.tipo !== "modelo") return;
      let item: HTMLElement | null = null;
      for (let el: HTMLElement | null = alvo; el && el !== bl; el = el.parentElement) {
        const pai: HTMLElement | null = el.parentElement;
        if (!pai) break;
        const iguais = [...pai.children].filter((c) => c.tagName === el!.tagName && c.className === el!.className);
        if (iguais.length >= 2 && el.tagName !== "BR" && el.tagName !== "OPTION") { item = el; break; }
      }
      if (!item) return;
      const caminho: number[] = [];
      for (let el: HTMLElement | null = item; el && el !== bl; el = el.parentElement) caminho.unshift([...el.parentElement!.children].indexOf(el));
      item.classList.add("pg-item-sel");
      const r = item.getBoundingClientRect();
      const q = f.getBoundingClientRect();
      const esc = f.offsetWidth ? q.width / f.offsetWidth : 1;
      setItemBar({ blocoId: id, caminho, x: q.left + (r.left + r.width) * esc, y: q.top + r.top * esc });
    });
    doc.addEventListener("submit", (e) => e.preventDefault());

    // Barra de formatação sobre o texto selecionado (cor, negrito).
    const mostrarBarra = () => {
      if (guardada.current) return; // seletor de cor livre aberto: mantém a barra
      const sel = doc.getSelection();
      const no = sel?.anchorNode;
      const base = no ? (no.nodeType === 1 ? (no as Element) : no.parentElement) : null;
      const ed = base?.closest('[data-m],[data-edit]:not([contenteditable="plaintext-only"])');
      if (!sel || sel.isCollapsed || !ed) { setBarra(null); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const q = f.getBoundingClientRect();
      const e = f.offsetWidth ? q.width / f.offsetWidth : 1; // o quadro pode estar encolhido
      setBarra({ x: q.left + (r.left + r.width / 2) * e, y: q.top + r.top * e });
    };
    doc.addEventListener("selectionchange", mostrarBarra);
    win.addEventListener("scroll", mostrarBarra);
  }, [mudarBloco, agendarOutro]);

  // Os dois quadros são editáveis: cada um é desenhado quando a sua versão muda.
  useEffect(() => { if (frame.current) montar(frame.current, "a"); }, [versaoA, montar]);
  useEffect(() => { if (doisAbertos && espelho.current) montar(espelho.current, "b"); }, [versaoB, doisAbertos, montar]);

  // Marca o bloco escolhido quando a escolha vem do painel da esquerda (nos dois quadros).
  useEffect(() => {
    [frame.current, espelho.current].forEach((f) => {
      const doc = f?.contentDocument;
      if (!doc) return;
      doc.querySelectorAll("[data-bloco].sel").forEach((n) => n.classList.remove("sel"));
      if (selId) (doc.querySelector(`[data-bloco="${selId}"]`) as HTMLElement | null)?.classList.add("sel");
    });
  }, [selId]);

  /** Apagar, duplicar ou mover o item repetido selecionado dentro de um bloco da Vitrine. */
  const acaoItem = (fn: (html: string, caminho: number[]) => string) => {
    if (!itemBar) return;
    const { blocoId, caminho } = itemBar;
    mudarBloco(blocoId, (b) => { b.dados.html = fn(String(b.dados.html ?? ""), caminho); });
    setItemBar(null);
  };

  /** Aplica uma formatação ao trecho selecionado em qualquer um dos quadros. */
  const formatar = (fn: (d: Document) => void) => {
    const d = ([frame.current, espelho.current].map((f) => f?.contentDocument).find((doc) => doc && doc.getSelection() && !doc.getSelection()!.isCollapsed) ?? frame.current?.contentDocument) as Document | undefined;
    if (!d) return;
    if (guardada.current) { const sel = d.getSelection(); sel?.removeAllRanges(); sel?.addRange(guardada.current); }
    d.execCommand("styleWithCSS", false, "true");
    fn(d);
  };

  /** Arrastar um bloco da lista para outra posição. */
  const soltar = (destino: string) => {
    if (!arrasto || arrasto.id === destino) { setArrasto(null); return; }
    const origem = arrasto.id;
    mudar((p) => {
      const i = p.blocos.findIndex((b) => b.id === origem);
      const j = p.blocos.findIndex((b) => b.id === destino);
      if (i < 0 || j < 0) return;
      const [b] = p.blocos.splice(i, 1);
      p.blocos.splice(j, 0, b);
    });
    setArrasto(null);
  };

  /** Troca o topo por outro da Vitrine, no mesmo lugar. Se o antigo era o "Destaque" básico, o cabeçalho básico antes dele sai junto. */
  const trocarTopo = (grupo: string, ref: string, tema: Tema) => {
    const alvo = troca;
    const novo = novoBlocoModelo(grupo, ref, tema);
    if (!alvo || !novo) return;
    mudar((p) => {
      const i = p.blocos.findIndex((b) => b.id === alvo);
      if (i < 0) return;
      const velho = p.blocos[i];
      p.blocos[i] = { ...novo, id: alvo };
      if (velho.tipo === "heroi" && i > 0 && p.blocos[i - 1].tipo === "topo") p.blocos.splice(i - 1, 1);
    });
    setTroca(null);
  };

  /** Quiz: vai para a tela anterior (-1) ou a próxima (+1). */
  const irTela = (delta: -1 | 1) => {
    const i = pagina.blocos.findIndex((b) => b.id === selId);
    const alvo = pagina.blocos[i + delta];
    if (alvo) setSelId(alvo.id);
  };
  const indiceTela = pagina.blocos.findIndex((b) => b.id === selId);

  const escolher = (id: string) => {
    if (telas) { setSelId(id); return; }
    setSelId(id);
    const alvo = frame.current?.contentDocument?.querySelector(`[data-bloco="${id}"]`);
    alvo?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const mover = (id: string, delta: -1 | 1) => mudar((p) => {
    const i = p.blocos.findIndex((b) => b.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= p.blocos.length) return;
    [p.blocos[i], p.blocos[j]] = [p.blocos[j], p.blocos[i]];
  });
  const tirar = (id: string) => { mudar((p) => { p.blocos = p.blocos.filter((b) => b.id !== id); }); if (selId === id) setSelId(null); };
  const duplicar = (id: string) => mudar((p) => {
    const i = p.blocos.findIndex((b) => b.id === id);
    if (i >= 0) p.blocos.splice(i + 1, 0, { ...structuredClone(p.blocos[i]), id: uid() });
  });
  const adicionar = (tipo: TipoBloco) => {
    const bloco = novoBloco(tipo);
    mudar((p) => {
      const i = selId ? p.blocos.findIndex((b) => b.id === selId) : -1;
      p.blocos.splice(i >= 0 ? i + 1 : p.blocos.length, 0, bloco);
    });
    setSelId(bloco.id);
    setAvisoAdd(BLOCOS[tipo].rotulo);
  };

  const adicionarModelo = (grupo: string, ref: string, tema: Tema) => {
    const bloco = novoBlocoModelo(grupo, ref, tema);
    if (!bloco) return;
    mudar((p) => {
      const i = selId ? p.blocos.findIndex((b) => b.id === selId) : -1;
      p.blocos.splice(i >= 0 ? i + 1 : p.blocos.length, 0, bloco);
    });
    setSelId(bloco.id);
    setAvisoAdd(String(bloco.dados.nome ?? "bloco"));
  };

  useEffect(() => { if (!catalogo) setAvisoAdd(""); }, [catalogo]);

  const sel = pagina.blocos.find((b) => b.id === selId);
  const corPagina = pagina.corBotao || COR_PADRAO;

  const abrirAba = () => {
    const url = URL.createObjectURL(new Blob([documentoFinal(pagina)], { type: "text/html" }));
    window.open(url, "_blank");
  };
  const baixar = () => {
    const url = URL.createObjectURL(new Blob([documentoFinal(pagina)], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pagina.slug || "pagina"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const copiar = async () => {
    try { await navigator.clipboard.writeText(documentoFinal(pagina)); setCopiado(true); window.setTimeout(() => setCopiado(false), 1800); } catch { /* sem permissão */ }
  };

  return (
    <div className="ed">
      <header className="ed-topo">
        <button className="btn-secundario" onClick={voltar}>← Páginas</button>
        <input className="ed-nome" value={pagina.nome} onChange={(e) => mudar((p) => { p.nome = e.target.value; }, false)} aria-label="Nome da página" />
        <span className={`ed-estado ${estado}`}>{estado === "salvo" ? "Salvo" : estado === "salvando" ? "Salvando..." : "Não coube no navegador"}</span>
        <div className="ed-aparelho" role="group" aria-label="Desfazer e refazer">
          <button onClick={desfazer} disabled={!hist.current.passado.length} title="Desfazer (Command+Z)">↶ Desfazer</button>
          <button onClick={refazer} disabled={!hist.current.futuro.length} title="Refazer (Command+Shift+Z)">↷ Refazer</button>
        </div>
        <div className="ed-aparelho" role="group" aria-label="Tamanho da tela">
          <button className={verComp ? "ativa" : ""} onClick={() => { if (verCel || !verComp) setVerComp(!verComp); }} title="Mostrar ou esconder o computador">Computador</button>
          <button className={verCel ? "ativa" : ""} onClick={() => { if (verComp || !verCel) setVerCel(!verCel); }} title="Mostrar ou esconder o celular">Celular</button>
        </div>
        <button className="btn-secundario" onClick={() => { setBarra(null); setPrevia(true); }}>Visualizar</button>
        <button className="btn-secundario" onClick={copiar}>{copiado ? "Copiado" : "Copiar HTML"}</button>
        <button className="btn-primary" onClick={baixar}>Baixar página</button>
      </header>
      {estado === "cheio" && <div className="ed-aviso">O navegador não deixou guardar tudo: imagens enviadas pesam muito. Use o endereço da imagem em vez de enviar o arquivo.</div>}

      {telas && (
        <div className="ed-telas" aria-label="Telas do quiz">
          {pagina.blocos.map((b, i) => {
            const nome = b.tipo === "modelo" ? String(b.dados.nome ?? "Tela").split(" — ")[0] : BLOCOS[b.tipo].rotulo;
            return (
              <div
                key={b.id}
                className={`ed-quad${b.id === selId ? " sel" : ""}${arrasto?.sobre === b.id && arrasto.id !== b.id ? " alvo" : ""}${arrasto?.id === b.id ? " arrastando" : ""}`}
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setArrasto({ id: b.id, sobre: null }); }}
                onDragOver={(e) => { e.preventDefault(); if (arrasto && arrasto.sobre !== b.id) setArrasto({ ...arrasto, sobre: b.id }); }}
                onDrop={(e) => { e.preventDefault(); soltar(b.id); }}
                onDragEnd={() => setArrasto(null)}
                onClick={() => setSelId(b.id)}
                title={`Tela ${i + 1}: ${nome}. Arraste para mudar de lugar.`}
              >
                <b>{i + 1}</b>
                <small>{nome}</small>
                {b.id === selId && (
                  <span className="ed-quad-acoes" onClick={(e) => e.stopPropagation()}>
                    <button title="Duplicar tela" onClick={() => duplicar(b.id)}>⧉</button>
                    <button title="Tirar tela" className="perigo" onClick={() => tirar(b.id)}>×</button>
                  </span>
                )}
              </div>
            );
          })}
          <button className="ed-quad novo" onClick={() => { setBarra(null); setCatalogo(true); }} title="Adicionar tela"><b>+</b><small>Nova tela</small></button>
        </div>
      )}

      <div className={`ed-corpo${telas ? " telas" : ""}`}>
        {!telas && <aside className="ed-esq">
          <div className="ed-esq-cab"><h2>Blocos</h2><button className="btn-primary" onClick={() => { setBarra(null); setCatalogo(true); }}>+ Adicionar bloco</button></div>
          <ol className="ed-blocos">
            {pagina.blocos.map((b, i) => {
              const nome = b.tipo === "modelo" ? String(b.dados.nome ?? "Modelo").split(" — ")[0] : BLOCOS[b.tipo].rotulo;
              return (
                <li
                  key={b.id}
                  className={`${b.id === selId ? "sel" : ""}${arrasto?.sobre === b.id && arrasto.id !== b.id ? " alvo" : ""}${arrasto?.id === b.id ? " arrastando" : ""}`}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setArrasto({ id: b.id, sobre: null }); }}
                  onDragOver={(e) => { e.preventDefault(); if (arrasto && arrasto.sobre !== b.id) setArrasto({ ...arrasto, sobre: b.id }); }}
                  onDrop={(e) => { e.preventDefault(); soltar(b.id); }}
                  onDragEnd={() => setArrasto(null)}
                  onClick={() => escolher(b.id)}
                  title={b.tipo === "modelo" ? String(b.dados.nome ?? "") : nome}
                >
                  <span className="ed-alca" aria-hidden="true">⋮⋮</span>
                  <span className="ed-rot"><b>Bloco {i + 1}</b><small>{nome}</small></span>
                  <span className="ed-acoes" onClick={(e) => e.stopPropagation()}>
                    <button title="Adicionar bloco abaixo deste" onClick={() => { setSelId(b.id); setBarra(null); setCatalogo(true); }}>+</button>
                    <button title="Subir" disabled={i === 0} onClick={() => mover(b.id, -1)}>↑</button>
                    <button title="Descer" disabled={i === pagina.blocos.length - 1} onClick={() => mover(b.id, 1)}>↓</button>
                    <button title="Duplicar" onClick={() => duplicar(b.id)}>⧉</button>
                    <button title="Tirar da página" className="perigo" onClick={() => tirar(b.id)}>×</button>
                  </span>
                </li>
              );
            })}
          </ol>
          {!pagina.blocos.length && <p className="ed-vazio">Nenhum bloco ainda.</p>}
        </aside>}

        <main className="ed-meio" ref={meio}>
          {pagina.blocos.length === 0 && (
            <div className="ed-vazio-grande">
              <strong>Página em branco</strong>
              <p>Clique em + para adicionar o primeiro bloco. Cada bloco já vem com o layout pronto dos seus modelos (topo, provas, ofertas, formulário...) e você edita o texto, as imagens e as cores direto na página.</p>
              <button className="btn-primary" onClick={() => setCatalogo(true)}>+ Adicionar o primeiro bloco</button>
            </div>
          )}
          {(() => {
            const W = medida.w, H = medida.h;
            const areaH = Math.max(200, H - 24);
            // celular: 390 de largura, encolhido para caber na altura
            const escCel = Math.min(1, areaH / 820);
            const celW = 390 * escCel;
            // computador: com o celular ao lado, encolhe para caber o que sobra
            const folga = Math.max(300, W - 32 - (celW + 12) - 16 - (telas ? 108 : 0));
            const escComp = doisAbertos ? Math.min(1, Math.max(0.3, folga / 1200)) : 1;
            const compW = doisAbertos ? 1200 : Math.min(Math.max(300, W - 32 - (telas ? 108 : 0)), 1180);
            // o quadro editável é o do computador; se ele estiver escondido, o do celular passa a ser o editável
            const editavelCel = !verComp && verCel;
            const larg = editavelCel ? 390 : compW;
            const esc = editavelCel ? 1 : escComp;
            const alt = editavelCel ? areaH : areaH / esc;
            const vazio = pagina.blocos.length === 0;
            return (
              <div className={`ed-duplo${telas ? " telas" : ""}`}>
                <div className={telas ? "ed-linha-tela" : "ed-linha-solo"}>
                  {telas && <button className="ed-seta esq" disabled={indiceTela <= 0} onClick={() => irTela(-1)} aria-label="Tela anterior">‹</button>}
                  <div className={`ed-tela${editavelCel ? " cel" : ""}`} style={vazio ? { display: "none" } : { width: larg * esc, height: alt * esc, maxWidth: "none", minHeight: 0, flex: "none" }}>
                    <iframe ref={frame} title="Página" style={{ width: larg, height: alt, transform: `scale(${esc})`, transformOrigin: "0 0" }} />
                  </div>
                  {telas && <button className="ed-seta dir" disabled={indiceTela < 0 || indiceTela >= pagina.blocos.length - 1} onClick={() => irTela(1)} aria-label="Próxima tela">›</button>}
                </div>
                {doisAbertos && !vazio && (
                  <div className="ed-tela cel ed-espelho" style={{ width: celW, height: 820 * escCel, maxWidth: "none", minHeight: 0, flex: "none" }} title="Celular: você também pode escrever aqui, e o computador acompanha">
                    <iframe ref={espelho} title="Celular" style={{ width: 390, height: 820, transform: `scale(${escCel})`, transformOrigin: "0 0" }} />
                  </div>
                )}
              </div>
            );
          })()}
        </main>

        <aside className="ed-dir">
          {sel ? (
            <>
              <button className="pn-fechar" onClick={() => setSelId(null)}>Ajustes da página</button>
              <PainelBloco
                key={sel.id}
                bloco={sel}
                corPagina={corPagina}
                onTrocarTopo={
                  sel.tipo === "heroi" || (sel.tipo === "modelo" && (() => { const o = achar(String(sel.dados.grupo), String(sel.dados.ref)); return !!o.bloco && ehTopo(String(sel.dados.grupo), o.bloco); })())
                    ? () => setTroca(sel.id)
                    : undefined
                }
                onMudar={(caminho, valor, atrasar) => mudarBloco(sel.id, (b) => gravarCaminho(b.dados, caminho, valor), atrasar ? 450 : 0)}
                onImagem={(caminho) => setImagem({ blocoId: sel.id, caminho })}
                onLista={(chave, acao, i = 0) => mudarBloco(sel.id, (b) => {
                  const arr = b.dados[chave] as Record<string, unknown>[];
                  if (acao === "novo") arr.push(structuredClone(arr[arr.length - 1] ?? {}));
                  else if (acao === "tirar") arr.splice(i, 1);
                  else { const j = acao === "subir" ? i - 1 : i + 1; [arr[i], arr[j]] = [arr[j], arr[i]]; }
                })}
              />
            </>
          ) : (
            <div className="pn">
              <h3>Ajustes da página</h3>
              <div className="pn-aviso pn-escopo"><b>Estas cores valem para a página inteira.</b> Para mudar só uma seção, clique nela na página ou na lista da esquerda: aí aparecem as cores só daquela seção.</div>
              <CorBotao rotulo="Cor de TODOS os botões da página" valor={pagina.corBotao} padrao={COR_PADRAO} onMudar={(cor) => mudar((p) => { p.corBotao = cor || undefined; })} rotuloLimpar="Voltar ao laranja da Revolução" />
              <CorFundo valor={pagina.corFundo} padrao="#f1eff4" rotulo="Cor do fundo da página inteira (atrás das seções)" rotuloLimpar="Voltar ao cinza da plataforma" onMudar={(cor) => mudar((p) => { p.corFundo = cor || undefined; })} />
              <label className="pn-campo"><span>Título da aba do navegador</span><input value={pagina.titulo} onChange={(e) => mudar((p) => { p.titulo = e.target.value; }, false)} /></label>
              <label className="pn-campo"><span>Descrição para o Google</span><textarea rows={3} value={pagina.resumo} onChange={(e) => mudar((p) => { p.resumo = e.target.value; }, false)} /></label>
              <label className="pn-campo"><span>Nome nos eventos (slug)</span><input value={pagina.slug} onChange={(e) => mudar((p) => { p.slug = fazSlug(e.target.value); }, false)} /></label>
              <label className="pn-campo"><span>Endereço onde a página está no ar</span><input value={pagina.url} placeholder="https://revolucao.com.br/k/..." onChange={(e) => mudar((p) => { p.url = e.target.value.trim(); }, false)} /></label>
              <p className="pn-dica">Com o endereço preenchido, a página aparece na lista ao criar uma etapa de página no funil.</p>
            </div>
          )}
        </aside>
      </div>

      {barra && !previa && !catalogo && !imagem && !video && (
        <BarraTexto
          x={barra.x}
          y={barra.y}
          onCor={(hex) => formatar((d) => d.execCommand("foreColor", false, hex))}
          onNegrito={() => formatar((d) => d.execCommand("bold"))}
          onLimpar={() => formatar((d) => { d.execCommand("removeFormat"); })}
          onAbrirLivre={() => { const s = [frame.current, espelho.current].map((f) => f?.contentDocument?.getSelection()).find((x) => x && !x.isCollapsed); guardada.current = s && s.rangeCount ? s.getRangeAt(0).cloneRange() : null; }}
          onFecharLivre={() => { guardada.current = null; }}
        />
      )}

      {itemBar && !previa && !catalogo && !imagem && !video && (
        <div className={`barra-texto barra-item${itemBar.y < 90 ? " abaixo" : ""}`} style={{ left: itemBar.x, top: itemBar.y, transform: itemBar.y < 90 ? "translate(-100%, 8px)" : "translate(-100%, calc(-100% - 8px))" }} role="toolbar" aria-label="Item do bloco">
          <button type="button" className="bt" title="Mover para cima ou para a esquerda" onClick={() => acaoItem((h, c) => moverItem(h, c, -1))}>←</button>
          <button type="button" className="bt" title="Mover para baixo ou para a direita" onClick={() => acaoItem((h, c) => moverItem(h, c, 1))}>→</button>
          <button type="button" className="bt" title="Acrescentar uma cópia deste item" onClick={() => acaoItem(duplicarItem)}>+ Duplicar</button>
          <button type="button" className="bt bt-perigo" title="Apagar este item (o resto se ajusta)" onClick={() => acaoItem(apagarItem)}>Apagar item</button>
        </div>
      )}

      {video && (() => {
        const b = pagina.blocos.find((x) => x.id === video.blocoId);
        return (
          <VideoDialog
            atual={lerVideo(String(b?.dados.html ?? ""), video.n)}
            onFechar={() => setVideo(null)}
            onEscolher={(src, poster) => { mudarBloco(video.blocoId, (x) => { x.dados.html = gravarVideo(String(x.dados.html ?? ""), video.n, src, poster); }); setVideo(null); }}
          />
        );
      })()}

      {previa && (
        <Modal largo titulo="Visualizar página" subtitulo="É assim que a página aparece para quem abrir." onFechar={() => setPrevia(false)} rodape={<><button className="btn-secundario" onClick={abrirAba}>Abrir em nova aba</button><button className="btn-primary" onClick={() => setPrevia(false)}>Fechar</button></>}>
          <div className="prev-modal">
            <AlternaAparelho modo={modoPrevia} onMudar={setModoPrevia} />
            <PreviaPagina html={documentoFinal(pagina)} modo={modoPrevia} />
          </div>
        </Modal>
      )}

      {troca && (
        <Modal largo titulo="Trocar o topo" subtitulo="Escolha outro topo. Use Escuro ou Claro para ver nos dois temas." onFechar={() => setTroca(null)} rodape={<button className="btn-secundario" onClick={() => setTroca(null)}>Cancelar</button>}>
          <CatalogoModelos soTopos onEscolher={trocarTopo} />
        </Modal>
      )}

      {catalogo && (
        <Modal largo titulo={telas ? "Adicionar tela" : "Adicionar bloco"} subtitulo="Clique nos blocos para adicionar, um depois do outro. A janela continua aberta; quando terminar, clique em Concluir." onFechar={() => setCatalogo(false)} rodape={<><span className="cat-aviso">{avisoAdd ? `✓ Adicionado: ${avisoAdd}. Na página: ${pagina.blocos.length} ${pagina.blocos.length === 1 ? "bloco" : "blocos"}.` : ""}</span><button className="btn-primary" onClick={() => setCatalogo(false)}>Concluir</button></>}>
          <div className="cat-abas">
            <button className={aba === "vitrine" ? "ativa" : ""} onClick={() => setAba("vitrine")}>Seus modelos (Vitrine)</button>
            <button className={aba === "basicos" ? "ativa" : ""} onClick={() => setAba("basicos")}>Blocos básicos</button>
          </div>
          {aba === "basicos" ? (
            <div className="catalogo">
              {ORDEM_CATALOGO.map((t) => (
                <button key={t} className="card-modelo" onClick={() => adicionar(t)}>
                  <strong>{BLOCOS[t].rotulo}</strong>
                  <span>{BLOCOS[t].descricao}</span>
                </button>
              ))}
            </div>
          ) : (
            <CatalogoModelos onEscolher={adicionarModelo} funcaoInicial={telas ? "Quiz" : undefined} />
          )}
        </Modal>
      )}

      {imagem && (() => {
        const b = pagina.blocos.find((x) => x.id === imagem.blocoId);
        const atual = String(b ? lerCaminho(b.dados, imagem.caminho) ?? "" : "");
        return (
          <ImagemDialog
            atual={atual}
            onFechar={() => setImagem(null)}
            onEscolher={(v) => { mudarBloco(imagem.blocoId, (x) => gravarCaminho(x.dados, imagem.caminho, v)); setImagem(null); }}
          />
        );
      })()}
    </div>
  );
}
