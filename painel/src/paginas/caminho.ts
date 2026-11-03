import { achar, htmlDoTema, type Tema } from "./vitrine/biblioteca";
import { gravarImagem, gravarLink, lerImagem, prepararModelo } from "./modeloHtml";

/** Ler e gravar um valor dentro dos dados de um bloco por caminho, ex.: "itens.2.titulo".
 *  Blocos da Vitrine têm caminhos especiais: "html-img:N", "html-link:N" e "html-tema". */
export function lerCaminho(dados: unknown, caminho: string): unknown {
  const d = dados as Record<string, unknown>;
  if (caminho.startsWith("html-img:")) return lerImagem(String(d.html ?? ""), caminho.slice(9));
  return caminho.split(".").reduce<unknown>((acc, parte) => (acc == null ? undefined : (acc as Record<string, unknown>)[parte]), dados);
}

export function gravarCaminho(dados: Record<string, unknown>, caminho: string, valor: unknown) {
  if (caminho.startsWith("html-img:")) { dados.html = gravarImagem(String(dados.html ?? ""), caminho.slice(9), String(valor ?? "")); return; }
  if (caminho.startsWith("html-link:")) { dados.html = gravarLink(String(dados.html ?? ""), caminho.slice(10), String(valor ?? "")); return; }
  if (caminho === "html-tema") {
    // trocar o tema volta o bloco ao texto original da Vitrine
    const { bloco } = achar(String(dados.grupo), String(dados.ref));
    if (bloco) { dados.html = prepararModelo(htmlDoTema(bloco, valor as Tema)); dados.tema = valor; }
    return;
  }
  const partes = caminho.split(".");
  let atual: Record<string, unknown> = dados;
  for (let i = 0; i < partes.length - 1; i++) atual = atual[partes[i]] as Record<string, unknown>;
  atual[partes[partes.length - 1]] = valor;
}
