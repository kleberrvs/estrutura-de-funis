/** Variantes de contraste das caixas (teste A/B para o Kleber escolher). */
export type Caixas = "a" | "b";
const CHAVE = "funil-ao-vivo:caixas";

export function caixasAtual(): Caixas {
  const daUrl = new URLSearchParams(window.location.search).get("caixas");
  if (daUrl === "a" || daUrl === "b") { aplicarCaixas(daUrl); return daUrl; }
  try {
    const v = localStorage.getItem(CHAVE);
    if (v === "a" || v === "b") return v;
  } catch { /* sem storage */ }
  return "a";
}

export function aplicarCaixas(v: Caixas) {
  document.documentElement.dataset.caixas = v;
  try { localStorage.setItem(CHAVE, v); } catch { /* ignora */ }
}
