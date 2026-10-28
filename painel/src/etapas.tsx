import type { ReactNode } from "react";
import type { TipoEtapa } from "./types";

type Def = { rotulo: string; descricao: string; cor: string; icone: ReactNode; semNumeros?: boolean };

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** Catálogo dos tipos de etapa: nome, cor e ícone. */
export const TIPOS: Record<TipoEtapa, Def> = {
  anuncio: {
    rotulo: "Anúncio",
    descricao: "Campanha de Meta, Google, TikTok, YouTube",
    cor: "#f472b6",
    icone: svg("M4 11v2a1 1 0 0 0 1 1h2l6 4V6L7 10H5a1 1 0 0 0-1 1z M17 9a4 4 0 0 1 0 6 M20 7a7 7 0 0 1 0 10"),
  },
  pagina: {
    rotulo: "Página",
    descricao: "Landing page, quiz, blog, obrigado",
    cor: "#38bdf8",
    icone: svg("M3 5h18v14H3z M3 9h18 M6 7h.01 M9 7h.01"),
  },
  formulario: {
    rotulo: "Formulário",
    descricao: "Forms nativo do Meta, cadastro",
    cor: "#fbbf24",
    icone: svg("M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5"),
  },
  popup: {
    rotulo: "Pop-up",
    descricao: "Janela que abre antes do próximo passo",
    cor: "#e879f9",
    icone: svg("M4 6h16v12H4z M8 10h8v5H8z"),
  },
  checkout: {
    rotulo: "Checkout",
    descricao: "Hotmart, Kiwify, página de pagamento",
    cor: "#fb923c",
    icone: svg("M12 2v20 M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"),
  },
  whatsapp: {
    rotulo: "WhatsApp",
    descricao: "Mensagem, HSM, grupo ou atendimento",
    cor: "#25d366",
    icone: svg("M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.2-1.6-1.1-.9.7a4 4 0 0 1-2-2l.7-.9-1.1-1.6z"),
  },
  email: {
    rotulo: "E-mail",
    descricao: "Disparo, automação ou sequência",
    cor: "#a78bfa",
    icone: svg("M3 6h18v12H3z M3 7l9 6 9-6"),
  },
  audiencia: {
    rotulo: "Audiência",
    descricao: "Público de remarketing",
    cor: "#9ca3af",
    icone: svg("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8"),
  },
  gatilho: {
    rotulo: "Gatilho",
    descricao: "Evento que dispara o fluxo (criou conta, fez simulado…)",
    cor: "#f28b82",
    icone: svg("M13 2L4 14h7l-1 8 9-12h-7l1-8z"),
  },
  espera: {
    rotulo: "Espera",
    descricao: "Tempo entre um passo e outro (2h, 1 dia…)",
    cor: "#c4b5fd",
    icone: svg("M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2"),
    semNumeros: true,
  },
  saida: {
    rotulo: "Saída",
    descricao: "Sai do fluxo: remarketing, outro fluxo, fim",
    cor: "#facc15",
    icone: svg("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9"),
  },
  nota: {
    rotulo: "Nota",
    descricao: "Texto solto para organizar o canvas",
    cor: "#fde047",
    icone: svg("M4 4h16v12l-4 4H4z M16 20v-4h4"),
    semNumeros: true,
  },
};

export const ORDEM_TIPOS: TipoEtapa[] = ["anuncio", "pagina", "formulario", "popup", "checkout", "whatsapp", "email", "gatilho", "espera", "saida", "audiencia", "nota"];

/** Criativo padrão dos blocos de anúncio (grade da raposa, 14/09/2026). */
export const IMAGEM_ANUNCIO_PADRAO = `${import.meta.env.BASE_URL}anuncios/criativos-raposa.jpg`;

export const CANAIS_ANUNCIO = ["Meta Ads", "Instagram", "Facebook", "TikTok", "Google Ads", "YouTube", "Outro"];
export const PLATAFORMAS_CHECKOUT = ["Hotmart", "Kiwify", "Eduzz", "Stripe", "Outro"];
