import { siFacebook, siGmail, siGoogleads, siInstagram, siMeta, siTiktok, siWhatsapp, siYoutube } from "simple-icons";
import type { ReactNode } from "react";

/** Plataformas com logo oficial (simple-icons) e cor da marca. */
export type Plataforma = "meta" | "instagram" | "facebook" | "tiktok" | "google" | "youtube" | "whatsapp" | "email";

type Def = { rotulo: string; hex: string; path: string };
const P: Record<Plataforma, Def> = {
  meta: { rotulo: "Meta Ads", hex: siMeta.hex, path: siMeta.path },
  instagram: { rotulo: "Instagram", hex: siInstagram.hex, path: siInstagram.path },
  facebook: { rotulo: "Facebook", hex: siFacebook.hex, path: siFacebook.path },
  tiktok: { rotulo: "TikTok", hex: "69C9D0", path: siTiktok.path }, // preto oficial some no fundo escuro
  google: { rotulo: "Google Ads", hex: siGoogleads.hex, path: siGoogleads.path },
  youtube: { rotulo: "YouTube", hex: siYoutube.hex, path: siYoutube.path },
  whatsapp: { rotulo: "WhatsApp", hex: siWhatsapp.hex, path: siWhatsapp.path },
  email: { rotulo: "E-mail", hex: siGmail.hex, path: siGmail.path },
};
export const PLATAFORMAS = P;
export const ORDEM_PLATAFORMAS: Plataforma[] = ["meta", "instagram", "facebook", "tiktok", "google", "youtube", "whatsapp", "email"];

/** Aceita o nome antigo do campo `canal` ("Meta Ads", "Google Ads"...) ou uma utm_source. */
const ALIAS: Record<string, Plataforma> = {
  "meta ads": "meta", meta: "meta", fb: "facebook", facebook: "facebook", ig: "instagram", instagram: "instagram",
  "tiktok ads": "tiktok", tiktok: "tiktok", "google ads": "google", google: "google", adwords: "google",
  youtube: "youtube", yt: "youtube", whatsapp: "whatsapp", wpp: "whatsapp", zap: "whatsapp",
  email: "email", "e-mail": "email", mail: "email", newsletter: "email", "customer.io": "email",
};

export function plataformaDe(canal?: string, url?: string): Plataforma | undefined {
  const c = canal?.trim().toLowerCase();
  if (c && ALIAS[c]) return ALIAS[c];
  try {
    const utm = url ? new URL(url).searchParams.get("utm_source")?.toLowerCase() : null;
    if (utm && ALIAS[utm]) return ALIAS[utm];
  } catch { /* url inválida */ }
  return undefined;
}

/** Logo da plataforma na cor da marca. */
export function LogoPlataforma({ plataforma, tamanho = 16 }: { plataforma: Plataforma; tamanho?: number }): ReactNode {
  const d = P[plataforma];
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} fill={`#${d.hex}`} aria-label={d.rotulo} role="img">
      <path d={d.path} />
    </svg>
  );
}
