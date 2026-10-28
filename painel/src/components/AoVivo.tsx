import { useEffect, useState } from "react";
import type { FeedItem, LeadEdge, EtapaNode } from "../types";
import type { LeadAtivo } from "../engine";
import { metricasDoFunil } from "../metricas";

type Props = {
  nodes: EtapaNode[];
  edges: LeadEdge[];
  leads: LeadAtivo[];
  feed: FeedItem[];
  demo: boolean;
};

type Aba = "visitantes" | "atividade" | "etapas";

const hora = (t: number) =>
  new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const tempo = (desde: number, agora: number) => {
  const s = Math.max(0, Math.round((agora - desde) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)} min`;
};

const CORES_AVATAR = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#a78bfa", "#14b8a6", "#f97316", "#eab308"];
const corDe = (id: string) => CORES_AVATAR[[...id].reduce((h, c) => h + c.charCodeAt(0), 0) % CORES_AVATAR.length];
const iniciais = (nome: string) =>
  nome.replace(/#\w+/, "").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "V";

/** Painel esquerdo "Ao vivo": quem está no funil agora, atividade e etapas. */
export function AoVivo({ nodes, edges, leads, feed, demo }: Props) {
  const [aba, setAba] = useState<Aba>("visitantes");
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { ativos } = metricasDoFunil(nodes, edges);
  const noSite = leads.length; // etapa 2: presença em todo o site, vinda do backend
  const tituloDe = (id: string) => nodes.find((n) => n.id === id)?.data.titulo ?? "—";
  const visitantes = [...leads].sort((a, b) => b.desde - a.desde);

  return (
    <aside className="aovivo">
      <header className="aovivo-cabeca">
        <div className="aovivo-titulo">
          <i className={`pulse${demo || ativos ? "" : " off"}`} />
          <h2>Ao vivo</h2>
          <span className="aovivo-modo">{demo ? "demo" : "parado"}</span>
        </div>
        <p>
          <b>{ativos}</b> no funil · <b>{noSite}</b> no site
        </p>
      </header>

      <nav className="abas">
        {(["visitantes", "atividade", "etapas"] as Aba[]).map((a) => (
          <button key={a} className={aba === a ? "ativa" : ""} onClick={() => setAba(a)}>
            {a === "visitantes" ? `Visitantes (${leads.length})` : a === "atividade" ? "Atividade" : "Etapas"}
          </button>
        ))}
      </nav>

      {aba === "visitantes" && (
        <ul className="visitantes">
          {visitantes.map((l) => (
            <li key={l.id} className={l.anonimo ? "" : "identificado"}>
              <span className="avatar" style={{ background: corDe(l.id) }}>{iniciais(l.nome)}</span>
              <div className="visitante-info">
                <strong>{l.nome}</strong>
                <span className="visitante-linha">
                  <em>{tituloDe(l.nodeId)}</em> · via {l.origem} · {l.etapas} {l.etapas === 1 ? "etapa" : "etapas"} · {tempo(l.desde, agora)}
                </span>
              </div>
            </li>
          ))}
          {visitantes.length === 0 && (
            <li className="vazio">{demo ? "Aguardando visitantes…" : "Ninguém no funil agora. Ligue o modo demo para simular."}</li>
          )}
        </ul>
      )}

      {aba === "atividade" && (
        <ul className="feed">
          {feed.slice(0, 40).map((f) => (
            <li key={f.id} className={`feed-${f.tipo}`}>
              <time>{hora(f.quando)}</time>
              <span>{f.texto}</span>
            </li>
          ))}
          {feed.length === 0 && <li className="vazio">Nada aconteceu ainda.</li>}
        </ul>
      )}

      {aba === "etapas" && (
        <ul className="etapas">
          {nodes.filter((n) => n.data.tipo !== "nota").map((n) => {
            const aqui = leads.filter((l) => l.nodeId === n.id);
            return (
              <li key={n.id}>
                <div className="etapa-linha">
                  <span>{n.data.titulo}</span>
                  <b className={n.data.stats.ativos ? "verde" : ""}>{n.data.stats.ativos}</b>
                </div>
                {aqui.length > 0 && (
                  <p className="nomes">
                    {aqui.slice(0, 4).map((l) => l.nome).join(", ")}
                    {aqui.length > 4 ? ` +${aqui.length - 4}` : ""}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <footer>
        <p>Atalhos: ⌘Z desfaz, ⌘⇧Z refaz, ⌘C/⌘V copia e cola, ⌘D duplica, Delete apaga, Esc limpa a seleção (Ctrl no Windows). Shift ao arrastar trava o eixo; Espaço + arrastar move a tela. Botão direito edita ou apaga.</p>
      </footer>
    </aside>
  );
}
