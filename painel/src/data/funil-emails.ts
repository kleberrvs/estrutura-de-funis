import type { EtapaData, EtapaNode, LeadEdge } from "../types";

/**
 * Fluxos de E-mail da Revolução (documentação visual; os disparos reais são
 * montados no Customer.io). Fonte: automacao-emails/fluxos.md no GitHub
 * (kleber-gif/revolucao-marketing, main) e as copies em automacao-emails/emails/.
 * Cores do quadro do Figma: e-mail roxo, gatilho salmão, espera lilás, saída amarelo.
 */
const zero = { entradas: 0, avancaram: 0, ativos: 0 };
const no = (id: string, x: number, y: number, data: Omit<EtapaData, "stats">): EtapaNode => ({
  id,
  type: "etapa",
  position: { x, y },
  data: { ...data, stats: { ...zero } },
});
const seta = (source: string, target: string): LeadEdge => ({
  id: `${source}>${target}`,
  type: "lead",
  source,
  target,
  data: { passagens: 0 },
});

/** Código → nome curto e assunto principal (da pasta emails/). */
const EMAILS: Record<string, [string, string]> = {
  "6.1.1": ["Boas-vindas", "%FIRSTNAME%, seu cadastro na Revolução está confirmado"],
  "6.1.2": ["1º simulado concluído", "%FIRSTNAME%, você concluiu seu primeiro Simulado"],
  "6.1.3": ["Simulado incompleto", "%FIRSTNAME%, seu Simulado ficou pela metade"],
  "6.1.4": ["Primeiras cartas no Memorize", "%FIRSTNAME%, suas primeiras cartas no Memorize já estão prontas"],
  "6.1.5": ["Revisar simulado no Memorize", "%FIRSTNAME%, transforme seu Simulado em revisão"],
  "6.1.6": ["Cinco simulados", "%FIRSTNAME%, 5 Simulados concluídos"],
  "6.1.7": ["Dez simulados", "%FIRSTNAME%, 10 Simulados no seu histórico"],
  "6.1.8": ["Reengajamento 3 dias", "%FIRSTNAME%, sua Jornada está te esperando"],
  "6.1.9": ["Reengajamento 7 dias", "%FIRSTNAME%, não deixe sua Jornada parar"],
  "6.2.1": ["Seu primeiro simulado", "[Nome], seu primeiro simulado leva 2 minutos pra começar"],
  "6.2.2": ["Presente Memorize", "Um presente que só libera depois do seu primeiro simulado"],
  "6.2.3": ["Evite esses 3 erros", "[Nome], os 3 erros que travam quem adia o primeiro simulado"],
  "6.2.4": ["Aviso final", "[Nome], última vez que te escrevo sobre isso"],
  "6.3.15": ["Descubra o concurso perfeito", "Três perguntas que definem em qual concurso você tem vantagem real"],
  "6.3.1": ["Métodos ultrapassados", "Você ainda estuda com equipamento de 2015 (e nem percebeu)"],
  "6.3.9": ["Como passar em concurso", "Como passar em concurso público (sem perder a sanidade)"],
  "6.3.5": ["Baixa retenção", "Você estudou aquilo. Mas na hora da prova, esqueceu."],
  "6.3.11": ["Isolamento e motivação", "Ninguém entende o que você está passando"],
  "6.3.13": ["Concursos 2026", "Os concursos de 2026 vão passar. A pergunta é: com ou sem você?"],
  "6.3.16": ["Concurseiro frustrado", "Todo concurseiro é um pouco frustrado"],
  "6.3.3": ["Vida financeira", "%FIRSTNAME%, sua vida financeira depende de uma coisa só"],
  "6.3.10": ["IA e aprovação", "A IA vai acelerar a sua aprovação (mas não a que você conhece)"],
  "6.3.18": ["Parabéns pelo fracasso", "Parabéns por mais um fracasso"],
  "6.3.19": ["É na próxima semana", "É na próxima semana"],
  "6.3.20": ["Faltam três dias", "Faltam três dias"],
  "6.3.8": ["É amanhã", "%FIRSTNAME%, é amanhã."],
  "6.5.1": ["Oferta liberada", "%FIRSTNAME%, acabou a espera: a Revolução está no ar"],
  "6.4.1": ["Quiz · Policial", "[Nome], seu diagnóstico está pronto"],
  "6.4.2": ["Quiz · Fiscal", "[Nome], seu diagnóstico está pronto"],
  "6.4.3": ["Quiz · Tribunais", "[Nome], seu diagnóstico está pronto"],
  "6.4.4": ["Quiz · Jurídica", "[Nome], seu diagnóstico está pronto"],
  "6.4.5": ["Quiz · Educação", "[Nome], seu diagnóstico está pronto"],
  "6.4.6": ["Quiz · Militar", "[Nome], seu diagnóstico está pronto"],
  "6.4.7": ["Quiz · Saúde", "[Nome], seu diagnóstico está pronto"],
  "6.4.8": ["Quiz · TI", "[Nome], seu diagnóstico está pronto"],
};

const email = (codigo: string, x: number, y: number) =>
  no(`e-${codigo}`, x, y, { tipo: "email", titulo: `${codigo} · ${EMAILS[codigo][0]}`, texto: EMAILS[codigo][1], compacto: true });
const gatilho = (id: string, evento: string, papel: string, x: number, y: number) =>
  no(id, x, y, { tipo: "gatilho", titulo: evento, texto: papel === "Gatilho" || papel === "Evento" ? undefined : papel });
const espera = (id: string, tempo: string, x: number, y: number) => no(id, x + 35, y + 22, { tipo: "espera", titulo: "Espera", texto: tempo }); // pílula (~150 px) centrada no vão
const saida = (id: string, _rotulo: string, destino: string, x: number, y: number) => no(id, x, y, { tipo: "saida", titulo: destino });
const nota = (id: string, texto: string, x: number, y: number) => no(id, x, y, { tipo: "nota", titulo: texto.split("\n")[0], texto });

const PASSO = 360; // distância horizontal entre blocos (compactos têm 260 px)
const nodes: EtapaNode[] = [];
const edges: LeadEdge[] = [];
const add = (...ns: EtapaNode[]) => nodes.push(...ns);
const liga = (...ids: string[]) => { for (let i = 1; i < ids.length; i++) edges.push(seta(ids[i - 1], ids[i])); };

// ---- Fluxo 1: AUTOMÁTICOS — 9 gatilhos → 1 e-mail cada
const Y1 = 0;
add(nota("n-automaticos", "FLUXO 1 · AUTOMÁTICOS\n9 gatilhos de evento, 1 e-mail cada", 0, Y1));
const automaticos: [string, string][] = [
  ["Criou conta", "6.1.1"],
  ["1º simulado completo", "6.1.2"],
  ["Simulado incompleto", "6.1.3"],
  ["1º Memorize (pendente: manual ou automático)", "6.1.4"],
  ["Fez simulado e não criou Memorize, +1 dia", "6.1.5"],
  ["5 simulados", "6.1.6"],
  ["10 simulados", "6.1.7"],
  ["3 dias sem acessar", "6.1.8"],
  ["7 dias sem acessar", "6.1.9"],
];
automaticos.forEach(([evento, codigo], i) => {
  const y = Y1 + i * 150;
  add(gatilho(`g-${codigo}`, evento, "Evento", 320, y), email(codigo, 320 + PASSO + 40, y + 10));
  liga(`g-${codigo}`, `e-${codigo}`);
});

// ---- Fluxo 2: CRIAÇÃO DE CONTA
const Y2 = 1500;
add(nota("n-conta", "FLUXO 2 · CRIAÇÃO DE CONTA\nSai do fluxo assim que criar o 1º simulado", 0, Y2));
add(
  gatilho("g-conta", "Criou conta", "Gatilho", 320, Y2),
  espera("w-conta-2h", "2 horas", 320 + PASSO, Y2 + 20),
  gatilho("c-conta-sem-simulado", "Não criou o 1º simulado", "Condição", 320 + PASSO * 2, Y2),
  email("6.2.1", 320 + PASSO * 3, Y2 + 10),
  espera("w-conta-1d", "1 dia", 320 + PASSO * 4, Y2 + 20),
  email("6.2.2", 320 + PASSO * 5, Y2 + 10),
  espera("w-conta-2d", "2 dias", 320 + PASSO * 6, Y2 + 20),
  email("6.2.3", 320 + PASSO * 7, Y2 + 10),
  espera("w-conta-3d", "3 dias", 320 + PASSO * 8, Y2 + 20),
  email("6.2.4", 320 + PASSO * 9, Y2 + 10),
  espera("w-conta-8h", "8 horas", 320 + PASSO * 10, Y2 + 20),
  saida("s-conta-rmkt", "Saída", "Remarketing (3 criativos)", 320 + PASSO * 11, Y2),
  saida("s-conta-simulado", "Saída", "Criou o simulado: sai do fluxo", 320 + PASSO * 2, Y2 + 180),
);
liga("g-conta", "w-conta-2h", "c-conta-sem-simulado", "e-6.2.1", "w-conta-1d", "e-6.2.2", "w-conta-2d", "e-6.2.3", "w-conta-3d", "e-6.2.4", "w-conta-8h", "s-conta-rmkt");
liga("c-conta-sem-simulado", "s-conta-simulado");

// ---- Fluxo 3: ATIVAÇÃO
const Y3 = 1950;
add(nota("n-ativacao", "FLUXO 3 · ATIVAÇÃO\nCadência de 3 dias. Quem não abriu recebe o mesmo e-mail com o Assunto B após 1 dia", 0, Y3));
const ativacao = ["6.3.15", "6.3.1", "6.3.9", "6.3.5", "6.3.11", "6.3.13", "6.3.16", "6.3.3", "6.3.10", "6.3.18"];
add(gatilho("g-ativacao", "Realizou o 1º simulado", "Gatilho", 320, Y3), espera("w-ativacao-5h", "5 horas", 320 + PASSO, Y3 + 20));
const cadeiaAtivacao = ["g-ativacao", "w-ativacao-5h"];
ativacao.forEach((codigo, i) => {
  const x = 320 + PASSO * (2 + i * 2);
  add(email(codigo, x, Y3 + 10));
  cadeiaAtivacao.push(`e-${codigo}`);
  if (i < ativacao.length - 1) {
    add(espera(`w-ativacao-${i}`, "3 dias", x + PASSO, Y3 + 20));
    cadeiaAtivacao.push(`w-ativacao-${i}`);
  }
});
liga(...cadeiaAtivacao);

// ---- Fluxo 4: L1 LANÇAMENTO (datas fixas)
const Y4 = 2400;
add(nota("n-lancamento", "FLUXO 4 · L1 LANÇAMENTO\nDatas fixas a definir (pendente: datas do quadro incoerentes)", 0, Y4));
add(
  gatilho("g-lanc", "Base cadastrada · datas fixas", "Gatilho", 320, Y4),
  email("6.3.19", 320 + PASSO, Y4 + 10),
  espera("w-lanc-1", "Data fixa", 320 + PASSO * 2, Y4 + 20),
  email("6.3.20", 320 + PASSO * 3, Y4 + 10),
  espera("w-lanc-2", "Data fixa", 320 + PASSO * 4, Y4 + 20),
  email("6.3.8", 320 + PASSO * 5, Y4 + 10),
  espera("w-lanc-3", "Data fixa", 320 + PASSO * 6, Y4 + 20),
  email("6.5.1", 320 + PASSO * 7, Y4 + 10),
);
liga("g-lanc", "e-6.3.19", "w-lanc-1", "e-6.3.20", "w-lanc-2", "e-6.3.8", "w-lanc-3", "e-6.5.1");

// ---- Fluxo 5: AUTOMAÇÃO QUIZ
const Y5 = 2850;
add(nota("n-quiz", "FLUXO 5 · AUTOMAÇÃO QUIZ\nE-mail da carreira do resultado; sem simulado em 2h, entra na régua 6.2 (pendente: regra anti-duplicação)", 0, Y5));
add(gatilho("g-quiz", "Quiz respondido", "Gatilho", 320, Y5 + 400));
const quiz = ["6.4.1", "6.4.2", "6.4.3", "6.4.4", "6.4.5", "6.4.6", "6.4.7", "6.4.8"];
quiz.forEach((codigo, i) => {
  add(email(codigo, 320 + PASSO, Y5 + i * 130));
  liga("g-quiz", `e-${codigo}`, "w-quiz-2h");
});
add(
  espera("w-quiz-2h", "2 horas", 320 + PASSO * 2, Y5 + 410),
  gatilho("c-quiz-sem-simulado", "Não criou simulado", "Condição", 320 + PASSO * 3, Y5 + 390),
  saida("s-quiz-regua", "Saída", "Entra na régua 6.2.1 → 6.2.4 (Fluxo 2)", 320 + PASSO * 4, Y5 + 390),
);
liga("w-quiz-2h", "c-quiz-sem-simulado", "s-quiz-regua");

// setas duplicadas (liga repetida do gatilho e da espera no fan-out) são removidas
const vistos = new Set<string>();
export const nosEmails = nodes;
export const setasEmails = edges.filter((e) => (vistos.has(e.id) ? false : (vistos.add(e.id), true)));
