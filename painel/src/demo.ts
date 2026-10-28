import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import type { LeadEdge, EtapaNode } from "./types";
import { nomesDemo } from "./data/funil";
import { uid, type useFunilEngine } from "./engine";

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const ORIGENS = ["Google Ads", "Facebook Ads", "Instagram", "E-mail", "Acesso direto", "WhatsApp"];
const codigo = () => uid().slice(0, 4).toUpperCase();
const DISPOSITIVOS = ["Celular", "Celular", "Celular", "Desktop", "Tablet"]; // celular pesa mais
const CAMPANHAS = ["lancamento-setembro", "quiz-frio", "rmkt-videoview", "(sem campanha)"];

/**
 * Modo demo: simula visitantes entrando, avançando e saindo, só para o
 * Kleber avaliar o visual. Na etapa 2 é substituído pelos eventos reais.
 */
export function useDemo(ligado: boolean, engine: ReturnType<typeof useFunilEngine>) {
  const { getNodes, getEdges } = useReactFlow<EtapaNode, LeadEdge>();

  useEffect(() => {
    if (!ligado) return;
    const timer = window.setInterval(() => {
      const nodes = getNodes();
      const edges = getEdges();
      const entradas = nodes.filter((n) => !["nota", "audiencia", "espera", "saida"].includes(n.data.tipo) && !edges.some((e) => e.target === n.id));

      if (entradas.length && Math.random() < 0.7) {
        engine.entrar(pick(entradas).id, { id: uid(), nome: `Visitante #${codigo()}`, anonimo: true, origem: pick(ORIGENS), dispositivo: pick(DISPOSITIVOS), campanha: pick(CAMPANHAS) });
      }

      for (const lead of engine.leadsRef.current) {
        if (Date.now() - lead.desde < 1800) continue;
        const saidas = edges.filter((e) => e.source === lead.nodeId);
        const sorte = Math.random();
        if (saidas.length && sorte < 0.3) {
          engine.avancar(lead.id, pick(saidas).id, lead.anonimo ? { nome: pick(nomesDemo) } : undefined);
        } else if (sorte < 0.42) {
          engine.sair(lead.id);
        }
      }
    }, 1100);
    return () => window.clearInterval(timer);
  }, [ligado, engine, getEdges, getNodes]);
}
