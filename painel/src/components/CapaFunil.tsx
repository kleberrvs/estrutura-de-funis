import type { EtapaNode, LeadEdge } from "../types";
import { MiniCanvas } from "./MiniCanvas";

type Props = { capa?: string; nodes: EtapaNode[]; edges: LeadEdge[] };

/** O Rév 3D com o mesmo tratamento da tela de login (glow roxo→ciano, sombra). */
function RevCapa({ player }: { player?: boolean }) {
  const base = import.meta.env.BASE_URL;
  return (
    <div className={`capa capa-rev3d${player ? " com-player" : ""}`}>
      <div className="capa-glow" />
      <img src={`${base}marca/raposa.webp`} alt="" loading="lazy" />
      {player && <span className="capa-play" aria-hidden="true" />}
    </div>
  );
}

/** Página de vendas em miniatura: moldura de browser, headline borrada e player com o estudante. */
function VslCapa() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="capa capa-vsl">
      <div className="browser">
        <div className="browser-barra"><i /><i /><i /><span /></div>
        <div className="browser-corpo">
          <div className="headline"><b /><b /></div>
          <div className="player">
            <img src={`${base}capas/estudante.webp`} alt="" loading="lazy" />
            <span className="play-vsl" aria-hidden="true" />
          </div>
          <div className="cta" />
        </div>
      </div>
    </div>
  );
}

/** Caixa de entrada estilizada: envelope aberto com uma carta saindo. */
function EmailCapa() {
  return (
    <div className="capa capa-email">
      <svg viewBox="0 0 320 160" aria-hidden="true">
        <defs>
          <linearGradient id="capaEnv" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9126c5" /><stop offset="1" stopColor="#43e6ee" />
          </linearGradient>
          <linearGradient id="capaCarta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dfe6ff" />
          </linearGradient>
        </defs>
        <g transform="translate(96 22)">
          <path d="M0 44 L64 0 L128 44 V112 a8 8 0 0 1 -8 8 H8 a8 8 0 0 1 -8 -8 Z" fill="#2a1a4a" />
          <rect x="18" y="20" width="92" height="84" rx="6" fill="url(#capaCarta)" />
          <rect x="30" y="38" width="52" height="6" rx="3" fill="#7c3aed" />
          <rect x="30" y="52" width="68" height="4" rx="2" fill="#c4b5fd" />
          <rect x="30" y="62" width="60" height="4" rx="2" fill="#c4b5fd" />
          <rect x="30" y="72" width="44" height="4" rx="2" fill="#c4b5fd" />
          <path d="M0 44 L64 92 L128 44 V112 a8 8 0 0 1 -8 8 H8 a8 8 0 0 1 -8 -8 Z" fill="url(#capaEnv)" />
          <path d="M0 112 L52 78 M128 112 L76 78" stroke="rgba(255,255,255,.35)" strokeWidth="2" />
          <circle cx="122" cy="10" r="13" fill="#fd6a18" stroke="#0e1420" strokeWidth="3" />
          <text x="122" y="15" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="Inter, system-ui, sans-serif">5</text>
        </g>
      </svg>
    </div>
  );
}

/**
 * Capa do cartão de funil. "rev" e "vsl" = Rév 3D (a VSL ganha um play);
 * "pessoas" = foto de gente comum; "email" = envelope; URL = imagem direta;
 * vazio = diagrama do funil.
 */
export function CapaFunil({ capa, nodes, edges }: Props) {
  const base = import.meta.env.BASE_URL;
  if (!capa) return <MiniCanvas nodes={nodes} edges={edges} />;
  if (capa === "rev") return <RevCapa />;
  if (capa === "vsl") return <VslCapa />;
  if (capa === "email") return <EmailCapa />;
  const src = capa === "pessoas" ? `${base}capas/pessoas.webp` : capa;
  return (
    <div className={`capa capa-foto capa-${capa === "pessoas" ? "pessoas" : "url"}`}>
      <img src={src} alt="" loading="lazy" />
    </div>
  );
}
