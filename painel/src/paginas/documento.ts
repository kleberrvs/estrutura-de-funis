import { BLOCOS } from "./blocos";
import { esc } from "./html";
import { CSS_EDITOR, CSS_PAGINA } from "./estilo";
import type { Bloco, Pagina } from "./tipos";
import { cssDaPagina } from "./vitrine/biblioteca";

export const COR_PADRAO = "#ff6b01";
const corValida = (c: unknown) => (/^#[0-9a-f]{6}$/i.test(String(c ?? "")) ? String(c) : "");
/** Texto claro sobre fundo escuro e o contrário. */
const textoSobre = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 140 ? "#ffffff" : "#221e27";
};
const varCor = (p: Pagina) => `:root{--cor:${corValida(p.corBotao) || COR_PADRAO}${corValida(p.corBotao) ? `;--cor-btn:${corValida(p.corBotao)}` : ""}${corValida(p.corFundo) ? `;--bg:${corValida(p.corFundo)}` : ""}}${corValida(p.corFundo) ? `body{color:${textoSobre(corValida(p.corFundo))}}` : ""}`;
const bodyCls = (p: Pagina) => (corValida(p.corFundo) ? ' class="pg-tudo"' : "");

/** Estilo e classe de um bloco com cor de botão, de fundo e/ou de texto próprias.
 *  Só o fundo trocado: o texto solto muda sozinho para claro ou escuro (cartões e campos mantêm as cores deles).
 *  Cor de texto escolhida: vale para todo o texto da seção. */
const estiloBloco = (b: Bloco) => {
  const c = corValida(b.dados.corBotao);
  const f = corValida(b.dados.corFundo);
  const t = corValida(b.dados.corTexto);
  const auto = f && !t ? textoSobre(f) : "";
  return {
    classe: [f && "pg-fundo", t && "pg-ct", auto && "pg-auto", c && "pg-cor-btn"].filter(Boolean).join(" "),
    estilo: [c && `--cor:${c};--cor-btn:${c}`, f && `--fb:${f}`, t && `--ct:${t}`, auto && `--ft:${auto}`].filter(Boolean).join(";"),
  };
};
/** Bloco com cor própria ganha uma caixa que só troca as cores. */
const comCor = (b: Bloco, html: string) => {
  const { classe, estilo } = estiloBloco(b);
  return estilo ? `<div class="${classe}" style="${estilo}">${html}</div>` : html;
};

/** Comportamento da página final: formulário, avisos ao Segment (se a página tiver o Segment) e cliques de botão. */
const SCRIPT_FINAL = (slug: string) => `
(function(){
  var P=${JSON.stringify(slug)};
  function ev(n,p){try{if(window.analytics)window.analytics.track(n,Object.assign({project:P},p||{}))}catch(e){}}
  ev("page.viewed");
  document.querySelectorAll("[data-cta]").forEach(function(a){a.addEventListener("click",function(){ev("cta.clicked",{label:a.getAttribute("data-cta")})})});
  document.querySelectorAll("form[data-pg-form]").forEach(function(f){
    var btn=f.querySelector(".pg-enviar");
    function enviar(e){
      if(e)e.preventDefault();
      if(!f.reportValidity())return;
      var d={};new FormData(f).forEach(function(v,k){d[k]=v});
      try{if(window.analytics&&d.email){window.analytics.identify(d.email,{name:d.nome,phone:d.whatsapp,project:P})}}catch(x){}
      ev("lead.captured");
      var destino=f.getAttribute("data-destino");
      setTimeout(function(){if(destino&&destino!=="#")location.href=destino},250);
    }
    f.addEventListener("submit",enviar);
    if(btn)btn.addEventListener("click",enviar);
  });
})();`;

const cabeca = (p: Pagina) =>
  `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.titulo || p.nome)}</title>${p.resumo ? `<meta name="description" content="${esc(p.resumo)}">` : ""}`;

/** Documento HTML completo da página, pronto para publicar (arquivo único, sem dependências). */
const SCRIPT_TELAS = `
(function(){
  var t=[].slice.call(document.querySelectorAll(".pg-tela")),i=0;
  function mostrar(n){i=Math.max(0,Math.min(t.length-1,n));t.forEach(function(e,k){e.hidden=k!==i});[].forEach.call(document.querySelectorAll(".pg-pontos i"),function(e,k){e.className=k===i?"on":""});window.scrollTo(0,0)}
  document.querySelector(".pg-ant").onclick=function(){mostrar(i-1)};
  document.querySelector(".pg-prox").onclick=function(){mostrar(i+1)};
  t.forEach(function(e){e.addEventListener("click",function(ev){var a=ev.target.closest("button,[role=button],a");if(!a)return;var h=a.getAttribute("href");if(a.tagName==="A"&&h&&h!=="#")return;ev.preventDefault();mostrar(i+1)})});
  document.addEventListener("keydown",function(e){if(e.key==="ArrowRight")mostrar(i+1);if(e.key==="ArrowLeft")mostrar(i-1)});
  mostrar(0);
})();`;

/** Vídeos em loop (como na página de vendas): carregam e tocam quando aparecem na tela e pausam quando saem. */
const SCRIPT_VIDEOS = `
(function(){
  [].forEach.call(document.querySelectorAll("source[data-src]"),function(s){s.src=s.getAttribute("data-src");s.removeAttribute("data-src")});
  var vs=[].slice.call(document.querySelectorAll("video.pv-video-loop"));
  if(!vs.length||!("IntersectionObserver" in window))return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;
    if(e.isIntersecting){if(!v.__p){v.__p=1;v.muted=true;if(v.preload==="none")v.preload="auto";try{v.load()}catch(x){}}var p=v.play();if(p&&p.catch)p.catch(function(){})}else v.pause()})},{threshold:.25});
  vs.forEach(function(v){io.observe(v)});
})();`;

/** Página mais curta que a tela: o último bloco (antes do rodapé) estica até o fim, então o fundo dele continua e nunca sobra faixa vazia. */
const SCRIPT_FUNDO = `
(function(){
  var cadeia=[];
  function acha(){
    var bl=document.querySelectorAll("[data-bloco]");
    var u=bl.length?bl[bl.length-1]:(document.getElementById("pg-pagina")||{}).lastElementChild;
    while(u&&u.previousElementSibling&&(u.tagName==="FOOTER"||(u.firstElementChild&&u.firstElementChild.tagName==="FOOTER")))u=u.previousElementSibling;
    return u;
  }
  function ajusta(){
    cadeia.forEach(function(e){e.style.minHeight=""});cadeia=[];
    var resto=window.innerHeight-document.body.offsetHeight;
    if(resto<=0)return;
    var el=acha();
    for(var n=0;el&&n<5;n++){cadeia.push(el);if(el.children.length!==1)break;el=el.firstElementChild}
    cadeia.forEach(function(e){e.style.minHeight=(e.offsetHeight+resto)+"px"});
  }
  window.addEventListener("load",ajusta);window.addEventListener("resize",ajusta);document.addEventListener("input",ajusta);
  ajusta();
})();`;

const CSS_TELA_CHEIA = `body{min-height:100vh;display:flex;flex-direction:column}[data-bloco],.pg-tela{flex:1;display:flex;flex-direction:column;min-height:100vh}[data-bloco]>*,.pg-tela>*{flex:1;display:flex;flex-direction:column}[data-bloco]>*>*,.pg-tela>*>*{flex:1}`;

const CSS_TELAS = `.pg-tela[hidden]{display:none}.pg-telas-nav{position:fixed;left:0;right:0;bottom:12px;display:flex;justify-content:center;align-items:center;gap:12px;z-index:20;pointer-events:none}.pg-telas-nav>*{pointer-events:auto}.pg-telas-nav button{width:36px;height:36px;border-radius:50%;border:0;background:rgba(22,7,29,.75);color:#fff;font-size:20px;cursor:pointer}.pg-pontos{display:flex;gap:6px;background:rgba(22,7,29,.6);padding:8px 10px;border-radius:999px}.pg-pontos i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.35)}.pg-pontos i.on{background:#ff6b01}`;

/** Documento HTML completo da página, pronto para publicar (arquivo único, sem dependências). */
export function documentoFinal(p: Pagina, opc: { videos?: boolean } = {}): string {
  const videos = opc.videos !== false ? SCRIPT_VIDEOS : "";
  const blocos = p.blocos.map((b) => comCor(b, BLOCOS[b.tipo].render(b.dados, { ed: false })));
  if (p.modo === "telas" && blocos.length) {
    // quiz: uma tela por vez, setas para os lados; clicar num botão da tela vai para a próxima
    const telas = blocos.map((h, i) => `<div class="pg-tela" data-tela="${i}"${i ? " hidden" : ""}>${h}</div>`).join("\n");
    const pontos = blocos.map(() => "<i></i>").join("");
    return `<!doctype html><html lang="pt-BR"${p.corBotao ? ' class="pg-cor-btn"' : ""}><head>${cabeca(p)}<style>${cssDaPagina(p.blocos)}${CSS_PAGINA}${varCor(p)}${CSS_TELA_CHEIA}${CSS_TELAS}</style></head><body${bodyCls(p)}>\n${telas}\n<nav class="pg-telas-nav"><button class="pg-ant" aria-label="Tela anterior">‹</button><span class="pg-pontos">${pontos}</span><button class="pg-prox" aria-label="Próxima tela">›</button></nav>\n<script>${SCRIPT_FINAL(p.slug)}${videos}${SCRIPT_TELAS}</script></body></html>`;
  }
  return `<!doctype html><html lang="pt-BR"${p.corBotao ? ' class="pg-cor-btn"' : ""}><head>${cabeca(p)}<style>${cssDaPagina(p.blocos)}${CSS_PAGINA}${varCor(p)}</style></head><body${bodyCls(p)}>\n<main id="pg-pagina">${blocos.join("\n")}</main>\n<script>${SCRIPT_FINAL(p.slug)}${videos}${SCRIPT_FUNDO}</script></body></html>`;
}

/** Documento do editor: igual ao final, mais contornos e campos editáveis. */
export function documentoEditor(p: Pagina, selecionado: string | null): string {
  // quiz (telas): o editor mostra só a tela escolhida
  const aMostrar = p.modo === "telas" ? p.blocos.filter((b) => b.id === (selecionado ?? p.blocos[0]?.id)).concat(p.blocos.some((b) => b.id === selecionado) ? [] : p.blocos.slice(0, 1)).slice(0, 1) : p.blocos;
  const corpo = aMostrar
    .map((b) => `<div data-bloco="${b.id}" data-rotulo="${esc(BLOCOS[b.tipo].rotulo)}" class="${[b.id === selecionado ? "sel" : "", estiloBloco(b).classe].join(" ").trim()}"${estiloBloco(b).estilo ? ` style="${estiloBloco(b).estilo}"` : ""}>${BLOCOS[b.tipo].render(b.dados, { ed: true })}</div>`)
    .join("\n");
  const vazio = p.blocos.length ? "" : `<div class="pg-vazio" style="margin:60px 20px">Página vazia. Use "+ Adicionar bloco" no painel da esquerda.</div>`;
  return `<!doctype html><html lang="pt-BR"${p.corBotao ? ' class="pg-cor-btn"' : ""}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cssDaPagina(p.blocos)}${CSS_PAGINA}${varCor(p)}${CSS_EDITOR}${p.modo === "telas" ? CSS_TELA_CHEIA : ""}</style></head><body${bodyCls(p)}>${corpo}${vazio}<script>${SCRIPT_VIDEOS}</script>${p.modo === "telas" ? "" : `<script>${SCRIPT_FUNDO}</script>`}</body></html>`;
}
