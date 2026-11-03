/** Visual base das páginas. Fica num texto só porque vai dentro do arquivo final e do editor. Design fino vem depois. */
export const CSS_PAGINA = `
@font-face{font-family:"Mundial";font-weight:300;src:url("/k/fontes/mundial-regular.woff2") format("woff2"),url("https://revolucaoassets.com.br/shared/fonts/Mundial/Mundial-Light.woff2") format("woff2");font-display:swap}
@font-face{font-family:"Mundial";font-weight:400;src:url("/k/fontes/mundial-regular.woff2") format("woff2"),url("https://revolucaoassets.com.br/shared/fonts/Mundial/Mundial-Regular.woff2") format("woff2");font-display:swap}
@font-face{font-family:"Mundial";font-weight:600;src:url("/k/fontes/mundial-demibold.woff2") format("woff2"),url("https://revolucaoassets.com.br/shared/fonts/Mundial/Mundial-Demibold.woff2") format("woff2");font-display:swap}
:root{
  --font:"Mundial",Inter,system-ui,sans-serif;
  --cor:#ff6b01;
  --brilho:linear-gradient(rgba(255,255,255,.14),rgba(255,255,255,0));
  --bg:#f1eff4;--branco:#fff;--tinta:#221e27;--suave:#67626e;--escuro:#16071d;
  --pessego:#ffbb8b;--mentor:#8903bf;
  --pilula-bg:rgba(247,93,0,.13);--pilula-tx:#cc2500;
  --acao-bg:rgba(166,0,255,.08);--acao-ic:#7d00c0;
  --card-destaque:linear-gradient(155deg,#fcf7ff 40%,#e6bfff 190%);--card-destaque-tx:#4c076c;--card-destaque-borda:rgba(142,0,249,.18);
  --linha:rgba(34,30,39,.12);
  --r-botao:9px;--r-card:24px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--tinta);font-family:var(--font);font-weight:400;font-size:17px;line-height:1.55}
img{max-width:100%;display:block}
h1,h2,h3{font-family:var(--font);font-weight:500;line-height:1.15;margin:0 0 .5em;text-wrap:balance}
p{margin:0 0 1em}
[data-edit]{outline:none;white-space:pre-line;min-width:1ch}
[data-edit]:empty::before{content:"Escreva aqui";opacity:.4}
.pg-sec{padding:60px 0}
.pg-cx{width:min(1080px,100%);margin:0 auto;padding:0 20px}
.pg-estreito{width:min(760px,100%)}
.pg-centro{text-align:center}
.pg-h1{font-size:clamp(2rem,5vw,3.1rem)}
.pg-h2{font-size:clamp(1.55rem,3.6vw,2.1rem);text-align:center}
.pg-h3{font-size:1.2rem}
.pg-lede{font-size:1.15rem;color:var(--suave)}
.pg-etiqueta{display:inline-block;background:var(--pilula-bg);color:var(--pilula-tx);font-weight:500;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;padding:6px 14px;border-radius:9999px;margin-bottom:18px}
.pg-btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer;font:500 16px/1 var(--font);height:40px;padding:0 18px;border:0;border-radius:var(--r-botao);color:#fff;background:var(--brilho),var(--cor);box-shadow:0 4px 12px -4px var(--cor)}
.pg-btn-g{height:52px;padding:0 30px;font-size:17px}
.pg-cheio{display:flex;width:100%}
.pg-topo{padding:12px 0;background:var(--escuro)}
.pg-topo-in{display:flex;align-items:center;justify-content:space-between;gap:16px}
.pg-logo{height:30px;width:auto}
.pg-heroi{background:radial-gradient(900px 380px at 85% -10%,rgba(189,140,240,.35),transparent 70%),radial-gradient(700px 360px at 5% 0,rgba(243,141,112,.28),transparent 70%),var(--bg)}
.pg-hero-in{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.pg-heroi.pg-centro .pg-hero-in{grid-template-columns:1fr;justify-items:center}
.pg-heroi.pg-centro .pg-hero-txt{max-width:780px}
.pg-hero-img{width:100%;border-radius:var(--r-card)}
.pg-grade{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-top:28px}
.pg-card{background:var(--branco);border:1px solid var(--linha);border-radius:var(--r-card);padding:26px;margin:0}
.pg-destaque{background:var(--card-destaque);border-color:var(--card-destaque-borda);color:var(--card-destaque-tx)}
.pg-destaque p{color:var(--card-destaque-tx);margin:0}
.pg-ico{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:var(--acao-bg);color:var(--acao-ic);margin-bottom:14px}
.pg-numeros{background:var(--escuro);color:#fff;padding:40px 0}
.pg-numeros .pg-grade{margin:0;text-align:center}
.pg-num strong{display:block;font:500 2.3rem var(--font);color:var(--pessego)}
.pg-num span{color:#d9d3e0}
.pg-dep blockquote{margin:0 0 16px;font-size:1.02rem}
.pg-dep figcaption{display:flex;gap:12px;align-items:center}
.pg-dep figcaption div{display:flex;flex-direction:column}
.pg-dep figcaption strong{font-weight:500}
.pg-dep figcaption span{color:var(--suave);font-size:.9rem}
.pg-foto{width:48px;height:48px;border-radius:50%;object-fit:cover}
.pg-player{position:relative;aspect-ratio:16/9;border-radius:var(--r-card);overflow:hidden;background:var(--escuro);margin-top:20px}
.pg-player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.pg-legenda{text-align:center;color:var(--suave);font-size:.92rem;margin-top:10px}
.pg-caixa{background:var(--branco);border:1px solid var(--linha);border-radius:var(--r-card);padding:32px}
.pg-oferta .pg-caixa{background:var(--card-destaque);border-color:var(--card-destaque-borda)}
.pg-caixa .pg-h2,.pg-caixa .pg-h3{text-align:center}
.pg-checks{list-style:none;padding:0;margin:16px 0}
.pg-checks li{padding:9px 0 9px 32px;position:relative;border-bottom:1px solid var(--linha)}
.pg-checks li::before{content:"";position:absolute;left:5px;top:15px;width:12px;height:7px;border-left:2.5px solid var(--acao-ic);border-bottom:2.5px solid var(--acao-ic);transform:rotate(-45deg)}
.pg-preco{display:flex;flex-direction:column;align-items:center;margin:18px 0}
.pg-preco s{color:var(--suave)}
.pg-preco strong{font:500 2.7rem var(--font);color:var(--tinta)}
.pg-preco span{color:var(--suave)}
.pg-form form{display:grid;gap:12px;margin-top:16px}
.pg-form label span{display:block;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--suave);margin-bottom:5px}
.pg-form input{width:100%;font:inherit;height:46px;padding:0 14px;border:1px solid rgba(34,30,39,.2);border-radius:var(--r-botao);background:#fff;color:var(--tinta)}
.pg-form input:focus{outline:2px solid var(--cor);outline-offset:1px}
.pg-nota{display:block;text-align:center;color:var(--suave);margin-top:12px}
.pg-faq{background:var(--branco)}
.pg-det{background:var(--bg);border:1px solid var(--linha);border-radius:16px;padding:16px 20px;margin-top:12px}
.pg-det summary{cursor:pointer;font-weight:500}
.pg-det p{margin:12px 0 0;color:var(--suave)}
.pg-linha{display:flex;gap:24px;align-items:center}
.pg-linha .pg-h2{text-align:left}
.pg-linha .pg-ico{width:64px;height:64px;flex:none;margin:0}
.pg-selo{width:120px;flex:none}
.pg-cta{background:var(--escuro);color:#fff}
.pg-cta .pg-lede{color:#d9d3e0}
.pg-corrido{font-size:1.08rem}
.pg-texto .pg-h2{text-align:left}
.pg-img-grande{width:100%;border-radius:var(--r-card)}
.pg-auto{color:var(--ft)}
.pg-card,.pg-caixa,.pg-det{color:var(--tinta)}
/* Cor do fundo da página inteira: vale também para as seções que não têm cor própria (as com cor própria vêm depois e vencem) */
body.pg-tudo :where(body>section,body>header,body>footer,body>main>section,body>main>header,body>main>footer,body>div>section,body>div>header,body>div>footer,body>div>div>section,body>div>div>footer,[data-theme]>section,[data-theme]>header,[data-theme]>footer){background:var(--bg)!important}
.pg-ct{color:var(--ct)}
.pg-ct :is(h1,h2,h3,h4,h5,h6,p,li,span,strong,em,b,i,small,blockquote,summary,label,div,figcaption,td,th,a,s,u):not(.pg-btn):not(.pg-btn *):not(button):not(button *):not([style*="var(--cor)"]):not([style*="var(--cor)"] *){color:var(--ct)!important}
.pg-fundo>section,.pg-fundo>header,.pg-fundo>footer,.pg-fundo>[data-theme],.pg-fundo>[data-theme]>section,.pg-fundo>[data-theme]>header,.pg-fundo>[data-theme]>footer{background:var(--fb)!important}
.pg-rodape{background:var(--escuro);padding:32px 0;color:#b6b1bd;font-size:.9rem}
.pg-rodape nav{display:flex;gap:18px;justify-content:center;flex-wrap:wrap}
.pg-rodape a{color:#b6b1bd}
.pg-foto.pg-vazio{width:48px;height:48px;min-height:0;border-radius:50%;font-size:0;padding:0;flex:none}
.pg-selo.pg-vazio{width:120px;height:120px;min-height:0;padding:8px;font-size:.75rem}
.pg-vazio{display:grid;place-items:center;min-height:140px;border:2px dashed rgba(34,30,39,.25);border-radius:16px;color:var(--suave);text-align:center;padding:16px;font-size:.95rem}
.pg-player .pg-vazio{position:absolute;inset:0;border:0;color:#b6b1bd}
@media(max-width:720px){.pg-hero-in{grid-template-columns:1fr}.pg-sec{padding:42px 0}.pg-linha{flex-direction:column;text-align:center}.pg-linha .pg-h2{text-align:center}}
`;

/** Só vale dentro do editor: contorno dos blocos, imagens clicáveis. */
export const CSS_EDITOR = `
[data-bloco]{position:relative;cursor:default}
[data-bloco]:hover{outline:2px dashed rgba(253,106,24,.55);outline-offset:-2px}
[data-bloco].sel{outline:3px solid #fd6a18;outline-offset:-3px}
[data-bloco]::after{content:attr(data-rotulo);position:absolute;top:0;left:0;background:#fd6a18;color:#fff;font:600 11px Inter,sans-serif;padding:3px 9px;border-radius:0 0 8px 0;opacity:0;pointer-events:none;z-index:5}
[data-bloco]:hover::after,[data-bloco].sel::after{opacity:1}
[data-edit]:hover{background:rgba(253,106,24,.08);border-radius:4px}
[data-edit]:focus{background:rgba(253,106,24,.14);border-radius:4px;box-shadow:0 0 0 2px rgba(253,106,24,.5)}
[data-img]{cursor:pointer}
[data-img]:hover{filter:brightness(.92);outline:2px solid #fd6a18}
.pg-btn[data-edit]{cursor:text}
/* Cor de botão escolhida: vale também para os botões que a Vitrine desenha por classe */
.pg-cor-btn :is(.pv-plano__cta,.cta,.cta-laranja,.cta-roxo,.of-btn,.rec-btn,.bf-btn-verde,.m3-cta-mini,.m3-btn,.b-btn--accent,.qz-cta,.pv-concursos-cta,.enrollment-cta){background:var(--cor-btn)!important;border-color:var(--cor-btn)!important}
.pg-item-sel{outline:2px dashed #22c55e!important;outline-offset:3px}
[data-v]{cursor:pointer}
`;
