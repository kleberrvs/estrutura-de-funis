import { uid } from "../engine";
import { BLOCOS } from "./blocos";
import type { Bloco, Dados, ModeloPagina, Pagina, TipoBloco } from "./tipos";
import { achar, htmlDoTema, type ExemploVitrine, type Tema } from "./vitrine/biblioteca";
import { prepararModelo } from "./modeloHtml";

/** Cria um bloco novo com os dados iniciais do tipo, trocando só o que o modelo quiser. */
export function novoBloco(tipo: TipoBloco, mudar: Dados = {}): Bloco {
  return { id: uid(), tipo, dados: { ...BLOCOS[tipo].padrao(), ...mudar } };
}

const PROMESSA =
  "A Revolução é uma plataforma preparatória para concursos públicos, com inteligência artificial, com um estudo montado para a sua rotina, com revisão que acontece sozinha antes de você esquecer e um mentor que não te deixa travar.";
const TEMPO = "Você diz quanto tempo tem por dia e a inteligência artificial monta todo o seu cronograma de acordo com o seu tempo.";

type Receita = { rotulo: string; descricao: string; blocos: () => Bloco[] };

/** Modelos de página. Todo texto aqui é exemplo para editar. */
export const MODELOS_PAGINA: Record<Exclude<ModeloPagina, "vitrine">, Receita> = {
  branco: {
    rotulo: "Página em branco",
    descricao: "Começa vazia: use o + para ir adicionando blocos, cada um já com o layout pronto",
    blocos: () => [],
  },
  basico: {
    rotulo: "Modelo básico",
    descricao: "Base para qualquer página: topo, benefícios, chamada e rodapé",
    blocos: () => [
      novoBloco("topo", { link: "#chamada" }),
      novoBloco("heroi", { alinha: "centro", etiqueta: "", titulo: "Título principal da página", subtitulo: "Uma frase que explica o que a pessoa ganha.", botao: "Quero começar", link: "#chamada" }),
      novoBloco("beneficios", { titulo: "Por que isso funciona" }),
      novoBloco("cta", { titulo: "Pronto para começar", botao: "Quero entrar", link: "#" }),
      novoBloco("rodape"),
    ],
  },
  captura: {
    rotulo: "Página de captura",
    descricao: "Promessa, benefícios e formulário para pegar nome, e-mail e WhatsApp",
    blocos: () => [
      novoBloco("topo", { link: "#formulario" }),
      novoBloco("heroi", { etiqueta: "Material gratuito", titulo: "Nome do material que a pessoa vai receber", subtitulo: "Uma frase dizendo o que ela ganha ao preencher o formulário.", botao: "Quero receber", link: "#formulario" }),
      novoBloco("beneficios", { titulo: "O que você vai encontrar" }),
      novoBloco("formulario", { titulo: "Receba agora no seu e-mail", botao: "Quero receber" }),
      novoBloco("rodape"),
    ],
  },
  vendas: {
    rotulo: "Página de vendas",
    descricao: "Promessa, vídeo, prova, benefícios, depoimentos, oferta e perguntas",
    blocos: () => [
      novoBloco("topo", { botao: "Quero entrar", link: "#oferta" }),
      novoBloco("heroi", { alinha: "centro", etiqueta: "Plataforma preparatória para concursos", titulo: "Estude para o seu concurso com um plano feito para a sua rotina", subtitulo: PROMESSA, botao: "Quero conhecer a plataforma", link: "#oferta" }),
      novoBloco("video", { titulo: "Veja a plataforma por dentro" }),
      novoBloco("numeros"),
      novoBloco("beneficios", { titulo: "Como a Revolução monta o seu estudo", itens: [{ icone: "calendario", titulo: "Cronograma no seu tempo", texto: TEMPO }, { icone: "repetir", titulo: "Revisão no fim de cada aula", texto: "No fim de cada aula o conteúdo vira flashcard automático e a revisão volta para você não esquecer." }, { icone: "chat", titulo: "Mentor que acompanha", texto: "Um mentor que não te deixa travar quando a dúvida aparece." }] }),
      novoBloco("depoimentos"),
      novoBloco("oferta", { link: "#" }),
      novoBloco("garantia"),
      novoBloco("faq"),
      novoBloco("cta", { titulo: "Comece hoje o seu plano de estudo", botao: "Quero entrar", link: "#oferta" }),
      novoBloco("rodape"),
    ],
  },
  interessados: {
    rotulo: "Lista de interessados",
    descricao: "Lista de espera: a pessoa deixa os dados para ser avisada primeiro",
    blocos: () => [
      novoBloco("topo", { mostrarBotao: false }),
      novoBloco("heroi", { alinha: "centro", etiqueta: "Em breve", titulo: "Entre na lista e seja avisado primeiro", subtitulo: "Deixe seus dados e receba o aviso assim que as vagas abrirem.", botao: "Entrar na lista", link: "#formulario" }),
      novoBloco("formulario", { titulo: "Entre na lista de interessados", subtitulo: "Leva menos de um minuto.", botao: "Entrar na lista" }),
      novoBloco("beneficios", { titulo: "Quem está na lista recebe primeiro" }),
      novoBloco("rodape"),
    ],
  },
  obrigado: {
    rotulo: "Página de obrigado",
    descricao: "Confirmação depois do cadastro, com o próximo passo",
    blocos: () => [
      novoBloco("topo", { mostrarBotao: false }),
      novoBloco("heroi", { alinha: "centro", etiqueta: "Cadastro confirmado", titulo: "Pronto, deu certo", subtitulo: "Confira o seu e-mail nos próximos minutos. Se não chegar, olhe a caixa de spam.", mostrarBotao: false }),
      novoBloco("texto", { titulo: "Próximo passo", texto: "Diga aqui o que a pessoa deve fazer agora, por exemplo entrar no grupo do WhatsApp." }),
      novoBloco("cta", { titulo: "Entre no grupo", botao: "Entrar no grupo", link: "#" }),
      novoBloco("rodape"),
    ],
  },
};

/** Bloco da Vitrine: guarda o HTML do bloco (com marcas de edição) e de onde ele veio. Biblioteca precisa estar carregada. */
export function novoBlocoModelo(grupo: string, id: string, tema: Tema): Bloco | undefined {
  const { bloco } = achar(grupo, id);
  if (!bloco) return;
  const t: Tema = tema === "claro" && bloco.claro ? "claro" : "escuro";
  return { id: uid(), tipo: "modelo", dados: { grupo, ref: id, nome: bloco.nome, tema: t, destino: "", html: prepararModelo(htmlDoTema(bloco, t)) } };
}

/** Blocos de uma página de exemplo da Vitrine. */
export const blocosDoExemplo = (ex: ExemploVitrine): Bloco[] =>
  ex.blocos.map((b) => novoBlocoModelo(b.grupo ?? ex.grupo, b.id, b.tema)).filter((b): b is Bloco => !!b);

export function paginaDoExemplo(p: Pagina, ex: ExemploVitrine): Pagina {
  return { ...p, modelo: "vitrine", blocos: blocosDoExemplo(ex), corFundo: undefined, modo: ex.grupo === "quiz" ? "telas" : undefined };
}
