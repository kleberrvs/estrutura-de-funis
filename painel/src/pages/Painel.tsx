import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from "react";
import { salvarFunil, type Funil } from "../storage";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type NodeChange,
} from "@xyflow/react";
import type { LeadEdge as LeadEdgeType, EtapaNode as EtapaNodeType } from "../types";
import { EtapaNode } from "../components/EtapaNode";
import { LeadEdge } from "../components/LeadEdge";
import { AoVivo } from "../components/AoVivo";
import { BarraTopo } from "../components/BarraTopo";
import { ContextMenu, type MenuAlvo } from "../components/ContextMenu";
import { EtapaDialog, type DadosEtapa } from "../components/EtapaDialog";
import { MIME_TIPO, Paleta } from "../components/Paleta";
import { TIPOS } from "../etapas";
import { Guias } from "../components/Guias";
import { alinhar, type Guias as GuiasTipo } from "../guias";
import type { TipoEtapa } from "../types";
import { renovarThumb } from "../api";
import { TransitsContext } from "../transits";
import { useFunilEngine } from "../engine";
import { FILTROS_VAZIOS, aplicarFiltro, filtroAtivo, opcoesDe, statsDeEventos, type Filtros } from "../filtros";
import { metricasDoFunil } from "../metricas";
import { comMod, emCampoDeTexto, useHistorico } from "../historico";
import { uid } from "../engine";
import { useDemo } from "../demo";

const nodeTypes = { etapa: EtapaNode };
const edgeTypes = { lead: LeadEdge };
type Props = { funil: Funil; voltar: () => void };

function PainelInterno({ funil, voltar }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<EtapaNodeType>(funil.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<LeadEdgeType>(funil.edges);
  const [demo, setDemo] = useState(() => new URLSearchParams(window.location.search).has("demo"));
  const engine = useFunilEngine(funil.eventos ?? [], setNodes, setEdges);
  const atualRef = useRef({ nodes, edges });
  atualRef.current = { nodes, edges };
  const historico = useHistorico(atualRef, setNodes, setEdges);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  useDemo(demo, engine);
  const { deleteElements, screenToFlowPosition, getZoom } = useReactFlow();
  const [guias, setGuias] = useState<GuiasTipo>({});

  // Shift pressionado? (trava o eixo do arrasto, como no Figma/Photoshop)
  const shift = useRef(false);
  useEffect(() => {
    const on = (e: KeyboardEvent) => { shift.current = e.shiftKey; };
    window.addEventListener("keydown", on);
    window.addEventListener("keyup", on);
    return () => { window.removeEventListener("keydown", on); window.removeEventListener("keyup", on); };
  }, []);
  // Onde cada arrasto começou (para decidir o eixo dominante).
  const inicioArraste = useRef<{ id: string; x: number; y: number } | null>(null);

  // Guias de alinhamento: ao arrastar um bloco sozinho, gruda nas bordas/centros dos vizinhos.
  const onNodesChangeComGuias = useCallback((changes: NodeChange<EtapaNodeType>[]) => {
    // Com filtro ativo o React Flow enxerga cópias com números filtrados; uma troca
    // vinda dele (ex.: edição inline) não pode sobrescrever os números reais.
    if (changes.some((c) => c.type === "remove")) historico.registrar();
    for (const ch of changes) {
      if (ch.type === "replace") {
        const real = nodes.find((n) => n.id === ch.id);
        if (real) {
          ch.item = { ...ch.item, data: { ...ch.item.data, stats: real.data.stats } };
          if (JSON.stringify(real.data) !== JSON.stringify(ch.item.data)) historico.registrar(`edicao:${ch.id}`); // digitação agrupada
        }
      }
    }
    const arraste = changes.length === 1 && changes[0].type === "position" && changes[0].position ? changes[0] : null;
    if (arraste) {
      const bloco = nodes.find((n) => n.id === arraste.id);
      if (bloco) {
        if (inicioArraste.current?.id !== arraste.id) inicioArraste.current = { id: arraste.id, ...bloco.position };
        const inicio = inicioArraste.current;
        let pos = arraste.position!;
        let eixo: Partial<GuiasTipo> = {};
        if (shift.current) { // vale também no soltar, para o bloco não pular ao final
          // Eixo dominante = maior deslocamento desde o início do arrasto.
          const dx = pos.x - inicio.x, dy = pos.y - inicio.y;
          const w = bloco.measured?.width ?? 300, h = bloco.measured?.height ?? 200;
          if (Math.abs(dx) >= Math.abs(dy)) { pos = { x: pos.x, y: inicio.y }; eixo = { eixoY: inicio.y + h / 2 }; }
          else { pos = { x: inicio.x, y: pos.y }; eixo = { eixoX: inicio.x + w / 2 }; }
          arraste.position = pos;
          setGuias(arraste.dragging ? eixo : {});
        } else {
          const r = alinhar(pos, bloco, nodes.filter((n) => n.id !== arraste.id), 8 / getZoom());
          arraste.position = r.pos; // vale também para o último movimento, ao soltar
          setGuias(arraste.dragging ? r.guias : {});
        }
        if (!arraste.dragging) inicioArraste.current = null;
      }
    } else {
      setGuias({});
    }
    onNodesChange(changes);
  }, [nodes, onNodesChange, getZoom, historico]);
  const canvasRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState<MenuAlvo | null>(null);
  type Dialogo = { tipo: TipoEtapa; editarId: string; inicial?: DadosEtapa; rascunho?: boolean; inserirNaSeta?: string };
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);

  // Salva desenho, números e registro de eventos deste funil neste navegador (etapa 2: backend).
  useEffect(() => {
    salvarFunil({ ...funil, nodes, edges, eventos: engine.eventos });
  }, [funil, nodes, edges, engine.eventos]);

  // Filtros: recalculam os números a partir do registro, só para exibição.
  const opcoes = useMemo(() => opcoesDe(engine.eventos), [engine.eventos]);
  const { nodesVisiveis, edgesVisiveis, comparacao } = useMemo(() => {
    if (!filtroAtivo(filtros)) return { nodesVisiveis: nodes, edgesVisiveis: edges, comparacao: null };
    const agora = Date.now();
    const min = filtros.comparar === "nenhum" ? null : Number(filtros.comparar) * 60_000;
    const atual = statsDeEventos(engine.eventos, filtros, min ? [agora - min, agora] : undefined);
    const ativosPorNo = new Map<string, number>();
    for (const l of engine.leads) {
      const ok = (filtros.dispositivo === "todos" || l.dispositivo === filtros.dispositivo) && (filtros.fonte === "todos" || l.origem === filtros.fonte) && (filtros.campanha === "todos" || l.campanha === filtros.campanha);
      if (ok) ativosPorNo.set(l.nodeId, (ativosPorNo.get(l.nodeId) ?? 0) + 1);
    }
    const vis = aplicarFiltro(nodes, edges, atual.porNo, atual.porSeta, ativosPorNo);
    let comparacao = null;
    if (min) {
      const antes = statsDeEventos(engine.eventos, filtros, [agora - 2 * min, agora - min]);
      const ant = aplicarFiltro(nodes, edges, antes.porNo, antes.porSeta, new Map());
      const m = metricasDoFunil(ant.nodes, ant.edges);
      comparacao = { entraram: m.entraram, ativos: m.ativos, receita: m.receita, conversao: m.conversao };
    }
    return { nodesVisiveis: vis.nodes, edgesVisiveis: vis.edges, comparacao };
  }, [filtros, nodes, edges, engine.eventos, engine.leads]);
  const leadsVisiveis = useMemo(() => filtroAtivo(filtros)
    ? engine.leads.filter((l) => (filtros.dispositivo === "todos" || l.dispositivo === filtros.dispositivo) && (filtros.fonte === "todos" || l.origem === filtros.fonte) && (filtros.campanha === "todos" || l.campanha === filtros.campanha))
    : engine.leads, [filtros, engine.leads]);

  // Ao sair do painel a simulação para, então ninguém fica "ativo agora".
  const ultimo = useRef({ nodes, edges });
  ultimo.current = { nodes, edges };
  useEffect(
    () => () => {
      const { nodes: ns, edges: es } = ultimo.current;
      salvarFunil({
        ...funil,
        edges: es,
        nodes: ns.map((n) => ({ ...n, data: { ...n.data, stats: { ...n.data.stats, ativos: 0 } } })),
      });
    },
    [funil],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      historico.registrar();
      setEdges((es) =>
        addEdge<LeadEdgeType>({ ...c, id: `${c.source}>${c.target}`, type: "lead", data: { passagens: 0 } }, es),
      );
    },
    [setEdges, historico],
  );

  // Setas apagadas (Delete com a seta selecionada): foto antes.
  const onEdgesChangeComHistorico = useCallback((changes: Parameters<typeof onEdgesChange>[0]) => {
    if (changes.some((c) => c.type === "remove")) historico.registrar();
    onEdgesChange(changes);
  }, [onEdgesChange, historico]);

  const GRADE = 20;
  const naGrade = (v: number) => Math.round(v / GRADE) * GRADE;

  /**
   * Cria o bloco no ponto (como rascunho) e abre o formulário na hora.
   * Se a pessoa cancelar, o rascunho é removido. `inserirNaSeta` = solto em
   * cima de uma conexão: ao salvar, entra no meio dela.
   */
  const criarRascunho = useCallback((tipo: TipoEtapa, ponto: { x: number; y: number }, inserirNaSeta?: string) => {
    historico.registrar();
    const id = `e-${Date.now().toString(36)}`;
    const largura = ["gatilho", "espera", "saida"].includes(tipo) ? 220 : tipo === "nota" ? 240 : 300;
    setNodes((ns) => [
      ...ns,
      {
        id,
        type: "etapa",
        position: { x: naGrade(ponto.x - largura / 2), y: naGrade(ponto.y - 40) },
        selected: true,
        data: { tipo, titulo: `Novo ${TIPOS[tipo].rotulo.toLowerCase()}`, rascunho: true, stats: { entradas: 0, avancaram: 0, ativos: 0 } },
      },
    ]);
    setDialogo({ tipo, editarId: id, rascunho: true, inserirNaSeta });
  }, [setNodes, historico]);

  const salvarEtapa = useCallback((dados: DadosEtapa) => {
    if (!dialogo) return;
    const { editarId, inserirNaSeta } = dialogo;
    if (!dialogo.rascunho) historico.registrar(); // edição pelo modal (o rascunho já tirou foto ao nascer)
    setNodes((ns) => {
      const novo = ns.find((n) => n.id === editarId);
      const seta = inserirNaSeta ? edges.find((e) => e.id === inserirNaSeta) : undefined;
      const origem = seta ? ns.find((n) => n.id === seta.source) : undefined;
      if (!novo || !origem) {
        return ns.map((n) => (n.id === editarId ? { ...n, data: { ...n.data, ...dados, rascunho: false } } : n));
      }
      // Inserido no meio de uma seta: entra logo depois da origem, alinhado a ela,
      // e o que vem depois é empurrado para a direita para abrir espaço.
      const GAP = 140;
      const largura = novo.measured?.width ?? 300;
      const x = naGrade(origem.position.x + (origem.measured?.width ?? 300) + GAP);
      const empurrar = largura + GAP;
      return ns.map((n) => {
        if (n.id === editarId) return { ...n, position: { x, y: naGrade(origem.position.y) }, data: { ...n.data, ...dados, rascunho: false } };
        if (n.position.x >= x) return { ...n, position: { ...n.position, x: n.position.x + empurrar } };
        return n;
      });
    });
    if (inserirNaSeta) {
      setEdges((es) => {
        const seta = es.find((e) => e.id === inserirNaSeta);
        if (!seta) return es;
        return [
          ...es.filter((e) => e.id !== inserirNaSeta),
          { id: `${seta.source}>${editarId}`, type: "lead", source: seta.source, target: editarId, data: { passagens: 0 } },
          { id: `${editarId}>${seta.target}`, type: "lead", source: editarId, target: seta.target, data: { passagens: 0 } },
        ];
      });
    }
    setDialogo(null);
  }, [dialogo, edges, setEdges, setNodes, historico]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelarDialogo = useCallback(() => {
    if (dialogo?.rascunho) {
      // Volta ao estado de antes do rascunho sem deixar rastro no desfazer.
      setNodes((ns) => ns.filter((n) => n.id !== dialogo.editarId));
      setEdges((es) => es.filter((e) => e.source !== dialogo.editarId && e.target !== dialogo.editarId));
      historico.descartarUltima();
    }
    setDialogo(null);
  }, [dialogo, setNodes, setEdges, historico]);

  // ---- Área de transferência e atalhos (Cmd/Ctrl + Z, Shift+Z, C, V, D; Delete; Esc)
  const transferencia = useRef<{ nodes: EtapaNodeType[]; edges: LeadEdgeType[]; colagens: number } | null>(null);
  const copiarSelecao = useCallback(() => {
    const sel = nodes.filter((n) => n.selected);
    if (!sel.length) return false;
    const ids = new Set(sel.map((n) => n.id));
    transferencia.current = {
      nodes: JSON.parse(JSON.stringify(sel)),
      edges: JSON.parse(JSON.stringify(edges.filter((e) => ids.has(e.source) && ids.has(e.target)))),
      colagens: 0,
    };
    return true;
  }, [nodes, edges]);
  const colar = useCallback(() => {
    const t = transferencia.current;
    if (!t) return false;
    historico.registrar();
    t.colagens += 1;
    const desloc = 24 * t.colagens;
    const novoId = new Map(t.nodes.map((n) => [n.id, `e-${uid()}`]));
    const novos: EtapaNodeType[] = t.nodes.map((n) => ({
      ...n,
      id: novoId.get(n.id)!,
      position: { x: n.position.x + desloc, y: n.position.y + desloc },
      selected: true,
      data: { ...n.data, stats: { entradas: 0, avancaram: 0, ativos: 0 } },
    }));
    const novasSetas: LeadEdgeType[] = t.edges.map((e) => ({
      ...e,
      id: `${novoId.get(e.source)}>${novoId.get(e.target)}`,
      source: novoId.get(e.source)!,
      target: novoId.get(e.target)!,
      selected: false,
      data: { passagens: 0 },
    }));
    setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), ...novos]);
    setEdges((es) => [...es.map((e) => ({ ...e, selected: false })), ...novasSetas]);
    return true;
  }, [historico, setNodes, setEdges]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (emCampoDeTexto(document.activeElement) || dialogo) return; // texto e modais ficam com o comportamento nativo
      const k = e.key.toLowerCase();
      if (comMod(e) && k === "z") { e.preventDefault(); if (e.shiftKey) historico.refazer(); else historico.desfazer(); return; }
      if (comMod(e) && k === "y") { e.preventDefault(); historico.refazer(); return; }
      if (comMod(e) && k === "c") { if (copiarSelecao()) e.preventDefault(); return; }
      if (comMod(e) && k === "v") { if (colar()) e.preventDefault(); return; }
      if (comMod(e) && k === "d") { e.preventDefault(); if (copiarSelecao()) colar(); return; }
      if (e.key === "Escape") {
        setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n)));
        setEdges((es) => es.map((ed) => (ed.selected ? { ...ed, selected: false } : ed)));
        setMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historico, copiarSelecao, colar, dialogo, setNodes, setEdges]);

  /** Seta debaixo do cursor (a área clicável da seta é larga), se houver. */
  const setaEm = (x: number, y: number) => {
    const el = document.elementsFromPoint(x, y).find((e) => e.closest(".react-flow__edge"));
    const id = el?.closest<HTMLElement>(".react-flow__edge")?.dataset.id;
    return id && edges.some((e) => e.id === id) ? id : undefined;
  };

  // Arrastar da paleta e soltar no canvas: cria o bloco ali e abre o formulário.
  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }, []);
  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const tipo = e.dataTransfer.getData(MIME_TIPO) as TipoEtapa;
    if (!tipo) return;
    let ponto = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    // Shift ao soltar da paleta: alinha com o bloco mais próximo (mesma linha ou mesma coluna).
    if (e.shiftKey && nodes.length) {
      const perto = nodes
        .map((n) => ({ n, dx: ponto.x - (n.position.x + (n.measured?.width ?? 300) / 2), dy: ponto.y - (n.position.y + 40) }))
        .sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy))[0];
      ponto = Math.abs(perto.dx) >= Math.abs(perto.dy)
        ? { x: ponto.x, y: perto.n.position.y + 40 }
        : { x: perto.n.position.x + (perto.n.measured?.width ?? 300) / 2, y: ponto.y };
    }
    criarRascunho(tipo, ponto, setaEm(e.clientX, e.clientY));
  }, [criarRascunho, screenToFlowPosition, edges, nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clique simples na paleta: cria perto do centro visível do canvas.
  const criarNoCentro = useCallback((tipo: TipoEtapa) => {
    const r = canvasRef.current?.querySelector(".flow")?.getBoundingClientRect();
    const centro = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    criarRascunho(tipo, screenToFlowPosition(centro));
  }, [criarRascunho, screenToFlowPosition]);

  const editarAlvo = useCallback(() => {
    if (menu?.tipo !== "node") return;
    const n = nodes.find((x) => x.id === menu.id);
    setMenu(null);
    if (!n) return;
    const { stats: _s, thumbVersao: _t, ...inicial } = n.data;
    setDialogo({ tipo: n.data.tipo, editarId: n.id, inicial });
  }, [menu, nodes]);

  // Menu do botão direito: posição relativa ao canvas.
  const posicao = (e: MouseEvent) => {
    const r = canvasRef.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };
  const abrirMenuNode = useCallback((e: MouseEvent, n: EtapaNodeType) => {
    e.preventDefault();
    setMenu({ tipo: "node", id: n.id, url: n.data.url, ehPagina: n.data.tipo === "pagina", ...posicao(e) });
  }, []);
  const abrirMenuEdge = useCallback((e: MouseEvent, ed: LeadEdgeType) => {
    e.preventDefault();
    setMenu({ tipo: "edge", id: ed.id, ...posicao(e) });
  }, []);
  const fecharMenu = useCallback(() => setMenu(null), []);
  const renovarMiniatura = useCallback(async () => {
    if (menu?.tipo !== "node" || !menu.url) return;
    const { id, url } = menu;
    setMenu(null);
    try {
      await renovarThumb(url);
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, thumbVersao: Date.now() } } : n)));
    } catch {
      /* serviço fora do ar: mantém a miniatura atual */
    }
  }, [menu, setNodes]);
  const apagarAlvo = useCallback(() => {
    if (!menu) return;
    if (menu.tipo === "node") {
      engine.esquecerEtapa(menu.id);
      deleteElements({ nodes: [{ id: menu.id }] }); // o "remove" resultante tira a foto do histórico
    } else {
      deleteElements({ edges: [{ id: menu.id }] });
    }
    setMenu(null);
  }, [deleteElements, engine, menu]);

  return (
    <div className="layout">
      <AoVivo nodes={nodesVisiveis} edges={edgesVisiveis} leads={leadsVisiveis} feed={engine.feed} demo={demo} />
      <main className="canvas" ref={canvasRef}>
        <BarraTopo nome={funil.nome} voltar={voltar} nodes={nodesVisiveis} edges={edgesVisiveis} demo={demo} onDemo={setDemo} onZerar={engine.zerar} filtros={filtros} opcoes={opcoes} onFiltros={setFiltros} comparacao={comparacao} />
        <Paleta onEscolher={criarNoCentro} />
        {menu && (
          <ContextMenu alvo={menu} onApagar={apagarAlvo} onEditar={editarAlvo} onRenovarThumb={renovarMiniatura} onFechar={fecharMenu} />
        )}
        {dialogo && (
          <EtapaDialog key={dialogo.editarId} tipo={dialogo.tipo} inicial={dialogo.inicial} novo={dialogo.rascunho} onSalvar={salvarEtapa} onFechar={cancelarDialogo} />
        )}
        <TransitsContext.Provider value={engine.transits}>
          <div className="flow">
          <ReactFlow
            nodes={nodesVisiveis}
            edges={edgesVisiveis}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChangeComGuias}
            onNodeDragStart={() => historico.registrar()}
            onNodeDragStop={() => setGuias({})}
            onEdgesChange={onEdgesChangeComHistorico}
            onConnect={onConnect}
            onNodeContextMenu={abrirMenuNode}
            onEdgeContextMenu={abrirMenuEdge}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onPaneClick={fecharMenu}
            onMoveStart={fecharMenu}
            deleteKeyCode={["Backspace", "Delete"]}
            selectionOnDrag
            selectionKeyCode={null}
            multiSelectionKeyCode={["Meta", "Control"]}
            selectionMode={SelectionMode.Partial}
            panOnDrag={[1, 2]}
            panOnScroll
            zoomOnScroll={false}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.3}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
          >
            <Guias {...guias} />
            <Background variant={BackgroundVariant.Lines} gap={28} lineWidth={1} color="rgba(255,255,255,0.03)" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor="#2f3d5c" maskColor="rgba(14,20,32,.75)" />
          </ReactFlow>
          </div>
        </TransitsContext.Provider>
      </main>
    </div>
  );
}

/** Painel de um funil; a `key` pelo id garante estado limpo ao trocar de funil. */
export function Painel(props: Props) {
  return (
    <ReactFlowProvider>
      <PainelInterno key={props.funil.id} {...props} />
    </ReactFlowProvider>
  );
}
