import type { LeadEdge, EtapaNode } from "../types";
import { fmtBRL, fmtPct, metricasDoFunil } from "../metricas";
import { TODOS, type Comparar, type Filtros } from "../filtros";
import { useState } from "react";
import { aplicarCaixas, caixasAtual, type Caixas } from "../caixas";

type Props = {
  nome: string;
  voltar: () => void;
  nodes: EtapaNode[];
  edges: LeadEdge[];
  demo: boolean;
  onDemo: (v: boolean) => void;
  onZerar: () => void;
  filtros: Filtros;
  opcoes: { dispositivo: string[]; fonte: string[]; campanha: string[] };
  onFiltros: (f: Filtros) => void;
  comparacao?: { entraram: number; ativos: number; receita: number; conversao: number | null } | null; // janela anterior
};

/** Barra superior: nome do funil, métricas-resumo, filtros e ações. */
export function BarraTopo({ nome, voltar, nodes, edges, demo, onDemo, onZerar, filtros, opcoes, onFiltros, comparacao }: Props) {
  const m = metricasDoFunil(nodes, edges);
  const muda = (k: keyof Filtros) => (e: React.ChangeEvent<HTMLSelectElement>) => onFiltros({ ...filtros, [k]: e.target.value });
  const delta = (atual: number, antes: number | null | undefined) => {
    if (antes === null || antes === undefined || !comparacao) return null;
    if (antes === 0) return atual === 0 ? 0 : null;
    return Math.round(((atual - antes) / antes) * 100);
  };
  const Delta = ({ v }: { v: number | null }) =>
    v === null ? <small className="delta neutro">novo</small> : <small className={`delta ${v > 0 ? "sobe" : v < 0 ? "desce" : "neutro"}`}>{v > 0 ? "▲" : v < 0 ? "▼" : "•"} {Math.abs(v)}%</small>;
  const janela = filtros.comparar === "nenhum" ? "" : ` (${filtros.comparar} min)`;
  const [caixas, setCaixas] = useState<Caixas>(caixasAtual);
  const trocarCaixas = (v: Caixas) => { aplicarCaixas(v); setCaixas(v); };
  return (
    <header className="topo">
      <div className="topo-funil">
        <button className="voltar" onClick={voltar}>← Funis</button>
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="26" height="26" />
        <h1>{nome}</h1>
      </div>

      <div className="topo-kpis">
        <div className="kpi kpi-live">
          <span>Visitantes agora</span>
          <b key={m.ativos} className="bump">{m.ativos}</b>
        </div>
        <div className="kpi">
          <span>Pessoas{janela}</span>
          <b key={m.entraram} className="bump">{m.entraram}</b>
          {comparacao && <Delta v={delta(m.entraram, comparacao.entraram)} />}
        </div>
        <div className="kpi">
          <span>Receita{janela}</span>
          <b>{fmtBRL(m.receita)}</b>
          {comparacao && <Delta v={delta(m.receita, comparacao.receita)} />}
        </div>
        <div className="kpi">
          <span>Conversão{janela}</span>
          <b className={m.conversao ? "verde" : ""}>{fmtPct(m.conversao)}</b>
          {comparacao && <Delta v={delta(m.conversao ?? 0, comparacao.conversao)} />}
        </div>
      </div>

      <div className="topo-filtros">
        <select value={filtros.dispositivo} onChange={muda("dispositivo")} className={filtros.dispositivo !== TODOS ? "ativo" : ""}>
          <option value={TODOS}>Dispositivo: todos</option>
          {opcoes.dispositivo.map((o) => <option key={o} value={o}>Dispositivo: {o}</option>)}
        </select>
        <select value={filtros.fonte} onChange={muda("fonte")} className={filtros.fonte !== TODOS ? "ativo" : ""}>
          <option value={TODOS}>Fonte: todas</option>
          {opcoes.fonte.map((o) => <option key={o} value={o}>Fonte: {o}</option>)}
        </select>
        <select value={filtros.campanha} onChange={muda("campanha")} className={filtros.campanha !== TODOS ? "ativo" : ""}>
          <option value={TODOS}>Campanha: todas</option>
          {opcoes.campanha.map((o) => <option key={o} value={o}>Campanha: {o}</option>)}
        </select>
        <select value={filtros.comparar} onChange={(e) => onFiltros({ ...filtros, comparar: e.target.value as Comparar })} className={filtros.comparar !== "nenhum" ? "ativo" : ""}>
          <option value="nenhum">Comparar: nenhum</option>
          <option value="5">Comparar: últimos 5 min vs 5 anteriores</option>
          <option value="15">Comparar: últimos 15 min vs 15 anteriores</option>
          <option value="60">Comparar: última hora vs hora anterior</option>
        </select>
      </div>

      <div className="topo-acoes">
        <div className="alternador" title="Teste temporário: contraste das caixas (A = elevação, B = roxo da marca)">
          <span>Caixas</span>
          <button className={caixas === "a" ? "ativo" : ""} onClick={() => trocarCaixas("a")}>A</button>
          <button className={caixas === "b" ? "ativo" : ""} onClick={() => trocarCaixas("b")}>B</button>
        </div>
        <button className="btn-secundario" onClick={onZerar}>Zerar</button>
        <button className={demo ? "btn-verde" : "btn-primary"} onClick={() => onDemo(!demo)}>
          {demo ? "● Demo ligado" : "Ligar modo demo"}
        </button>
      </div>
    </header>
  );
}
