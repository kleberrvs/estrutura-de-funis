import { documentoFinal } from "./documento";
import { paginaDoExemplo } from "./modelos";
import { novaPagina } from "./storage";
import type { Biblioteca } from "./vitrine/biblioteca";
import type { ModeloBase } from "./tipos";

/** Uma página que dá para escolher ao criar: em branco, o modelo básico ou uma página pronta da Vitrine. */
export type Item = { modelo: string; nome: string; nota: string };

/** Páginas oferecidas em "Nova página", na ordem em que aparecem. Cada tipo aparece com um exemplo; os demais exemplos da Vitrine ficam guardados na biblioteca e voltam quando o Kleber pedir. */
export function paginasDisponiveis(bib: Biblioteca | null): Item[] {
  const existe = (id: string) => !!bib?.exemplos.some((x) => x.id === id);
  const noAr = (id: string, nome: string, nota: string): Item[] => (existe(id) ? [{ modelo: `vitrine:${id}`, nome, nota }] : []);
  return [
    ...noAr("vendas-policial", "Página de vendas policial", "Página completa"),
    ...noAr("noar-vendas", "Página de vendas", "Como está no ar hoje"),
    ...noAr("noar-captura", "Página de captura", "Como está no ar hoje"),
    ...noAr("lista-espera-arte", "Lista de espera", "Exemplo da Vitrine: dobra de arte com formulário"),
    ...noAr("evento-ev-topo", "Página de evento", "Exemplo da Vitrine: aula ao vivo"),
    ...noAr("obrigado-exemplo-01", "Página de obrigado", "Exemplo da Vitrine"),
    ...noAr("quiz-telas", "Quiz", "Exemplo da Vitrine: tela inicial e pergunta"),
    // o modelo básico fica por último
    { modelo: "basico", nome: "Modelo básico", nota: "Base para qualquer página: topo, benefícios, chamada e rodapé" },
  ];
}

/** HTML final da página que o item cria (vazio se a Vitrine ainda não carregou). */
export function htmlDoItem(item: Item, bib: Biblioteca | null): string {
  if (item.modelo.startsWith("vitrine:")) {
    const ex = bib?.exemplos.find((x) => `vitrine:${x.id}` === item.modelo);
    return ex ? documentoFinal(paginaDoExemplo(novaPagina(item.nome, "", "branco"), ex), { videos: false }) : "";
  }
  return documentoFinal(novaPagina(item.nome, "", item.modelo as ModeloBase), { videos: false });
}
