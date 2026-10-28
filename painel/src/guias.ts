import type { EtapaNode } from "./types";

/** Linhas de alinhamento a desenhar (coordenadas do canvas). */
export type Guias = { x?: number; y?: number; eixoX?: number; eixoY?: number }; // eixo* = linha tracejada do Shift

type Ajuste = { delta: number; linha: number; dist: number };

const tamanho = (n: EtapaNode) => ({
  w: n.measured?.width ?? 300,
  h: n.measured?.height ?? 200,
});

/**
 * Ao arrastar um bloco, compara bordas e centro dele com os dos outros
 * blocos. Se algum ficar a menos de `limiar`, gruda nele e devolve a linha
 * para desenhar. Arrastar além do limiar solta (como no Figma).
 */
export function alinhar(
  pos: { x: number; y: number },
  bloco: EtapaNode,
  outros: EtapaNode[],
  limiar: number,
): { pos: { x: number; y: number }; guias: Guias } {
  const { w, h } = tamanho(bloco);
  const meusX = [pos.x, pos.x + w / 2, pos.x + w];
  const meusY = [pos.y, pos.y + h / 2, pos.y + h];

  let melhorX: Ajuste | null = null;
  let melhorY: Ajuste | null = null;

  for (const outro of outros) {
    const { w: ow, h: oh } = tamanho(outro);
    const { x, y } = outro.position;
    const linhasX = [x, x + ow / 2, x + ow];
    const linhasY = [y, y + oh / 2, y + oh];

    for (const meu of meusX) {
      for (const linha of linhasX) {
        const dist = Math.abs(linha - meu);
        if (dist < limiar && (!melhorX || dist < melhorX.dist)) melhorX = { delta: linha - meu, linha, dist };
      }
    }
    for (const meu of meusY) {
      for (const linha of linhasY) {
        const dist = Math.abs(linha - meu);
        if (dist < limiar && (!melhorY || dist < melhorY.dist)) melhorY = { delta: linha - meu, linha, dist };
      }
    }
  }

  return {
    pos: { x: pos.x + (melhorX?.delta ?? 0), y: pos.y + (melhorY?.delta ?? 0) },
    guias: { x: melhorX?.linha, y: melhorY?.linha },
  };
}
