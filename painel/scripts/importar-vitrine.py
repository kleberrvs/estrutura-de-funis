#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lê as bancadas da Vitrine de Páginas (paginas/modelos/*/index.html) e grava a biblioteca de
blocos do construtor de páginas em src/paginas/vitrine/biblioteca.json.

Uso:  python3 scripts/importar-vitrine.py [pasta-paginas/modelos]
Rodar de novo sempre que um bloco da Vitrine mudar.
"""
import json, re, sys
from pathlib import Path

MODELOS = Path(sys.argv[1] if len(sys.argv) > 1 else "/Users/pessoal/Desktop/Revolução Master/.worktrees/l1/paginas/modelos")
SAIDA = Path(__file__).resolve().parents[1] / "src/paginas/vitrine/biblioteca.json"
SITE = "https://revolucao.com.br/k/modelos/"

# nome mostrado, pasta, css extra do grupo (além do vitrine.css, que vale para todos)
GRUPOS = [
    ("vendas", "Página de vendas", ["assets/pv.css"]),
    ("captura", "Página de captura", ["captura/promo/estilo.css"]),
    ("lista", "Lista de espera", []),
    ("evento", "Evento", []),
    ("obrigado", "Obrigado e onboarding", []),
    ("publicitaria", "Página publicitária", []),
    ("quiz", "Quiz", []),
    ("vendas-policial", "Vendas policial", ["vendas-policial/policial.css"]),
]
MINI = re.compile(r'<div class="vt-mini"><div class="vt-mini-inner">\n(.*?)\n\s*</div></div>', re.S)
tira_tags = lambda s: re.sub(r"<[^>]+>", "", s).strip()


def absolutizar(texto, pasta):
    """Caminhos relativos viram endereços do site publicado (imagens continuam no ar)."""
    texto = re.sub(r'(["\'(])\.\./assets/', rf"\1{SITE}assets/", texto)
    texto = re.sub(r'(["\'(])assets/', rf"\1{SITE}{pasta}/assets/", texto)
    return texto


def limpar_bloco(html, pasta):
    html = re.sub(r"<script\b.*?</script>", "", html, flags=re.S)
    return absolutizar(html, pasta)


def css(arquivos):
    partes = []
    for a in arquivos:
        p = MODELOS / a
        if p.exists():
            partes.append(absolutizar(p.read_text(encoding="utf-8"), p.parent.name))
    return "\n".join(partes)


biblioteca = {"css": css(["assets/vitrine.css"]), "grupos": [], "exemplos": []}
rotulos = {}

for pasta, nome, extras in GRUPOS:
    fonte = (MODELOS / pasta / "index.html").read_text(encoding="utf-8")
    estilo = "\n".join(re.findall(r"<style>(.*?)</style>", fonte, re.S))
    posicoes = [m.start() for m in re.finditer(r'<div class="vt-frame"', fonte)] + [len(fonte)]
    blocos = []
    for i in range(len(posicoes) - 1):
        seg = fonte[posicoes[i]:posicoes[i + 1]]
        id_ = re.search(r'id="([^"]+)"', seg[:200])
        id_ = id_.group(1) if id_ else f"{pasta}-{i + 1:02d}"
        minis = MINI.findall(seg)
        if not minis:
            continue
        tag = re.search(r'class="vt-frame-tag">(.*?)</span>', seg, re.S)
        titulo = re.search(r"<h2>(.*?)</h2>", seg, re.S)
        desc = re.search(r"<p>(.*?)</p>", seg, re.S)
        bloco = {
            "id": id_,
            "rotulo": tira_tags(tag.group(1)) if tag else "",
            "nome": tira_tags(titulo.group(1)) if titulo else id_.group(1),
            "descricao": tira_tags(desc.group(1)) if desc else "",
            "escuro": limpar_bloco(minis[0], pasta),
        }
        if len(minis) > 1:
            bloco["claro"] = limpar_bloco(minis[1], pasta)
        blocos.append(bloco)
    if pasta == "vendas-policial":
        # página inteira (sem bancada): cada seção do <main> vira um bloco, com os ícones da página junto
        icones = re.search(r'<svg class="police-symbols".*?</svg>', fonte, re.S).group(0)
        principal = re.search(r"<main.*?</main>", fonte, re.S).group(0)
        for n, sec in enumerate(re.findall(r"<section\b.*?</section>", principal, re.S), 1):
            titulo = re.search(r"<h[12][^>]*>(.*?)</h[12]>", sec, re.S)
            blocos.append({"id": f"policial-{n:02d}", "rotulo": f"Seção {n:02d}", "nome": tira_tags(titulo.group(1))[:70] if titulo else f"Seção {n}", "descricao": "", "escuro": '<div class="policial page-view">' + icones + limpar_bloco(sec, pasta) + "</div>"})
        biblioteca["exemplos"].append({"id": "vendas-policial", "grupo": pasta, "nome": "Vendas policial · página completa", "fundo": "#FFFFFF", "blocos": [{"id": b["id"], "tema": "escuro"} for b in blocos]})
    if pasta == "obrigado":
        # pedido do Kleber (02/11): no "Seu acesso está pronto" sai a imagem do mockup; o texto fica centralizado
        for bl in blocos:
            if bl["id"] != "ob-op-pc":
                continue
            for chave in ("escuro", "claro"):
                if chave in bl:
                    h = re.sub(r'<img src="[^"]*mockup-plataforma\.png"[^>]*>', "", bl[chave])
                    h = h.replace("grid-template-columns:1fr 1fr", "grid-template-columns:1fr").replace("text-align:left", "text-align:center").replace("align-items:flex-start", "align-items:center")
                    bl[chave] = h
    if pasta == "captura":
        # pedido do Kleber (02/11): sem exclamação no título do topo "Mascote apresentadora"
        for bl in blocos:
            if bl["id"] == "topo-09":
                for chave in ("escuro", "claro"):
                    if chave in bl:
                        bl[chave] = bl[chave].replace("Diário Oficial</span>!", "Diário Oficial</span>")
    if pasta == "quiz":
        # pedido do Kleber (02/11): no quiz fica só o logo do topo; sai a etiqueta "Quiz interativo"
        for bl in blocos:
            for chave in ("escuro", "claro"):
                if chave in bl:
                    bl[chave] = re.sub(r'<div><span class="qz-chip">.*?</span></div>\s*', "", bl[chave], flags=re.S)
    css_grupo = absolutizar(estilo, pasta) + "\n" + css(extras)
    # celular: a regra "imagens se adaptam" não pode aumentar as fotinhas redondas (selos de aprovados, avatares)
    css_grupo = css_grupo.replace('img:not([style*="position:absolute"])', 'img:not([style*="position:absolute"]):not([style*="border-radius:999rem"])')
    if pasta == "vendas-policial":
        # na página original as variáveis e o fundo vivem no <body class="policial">; aqui cada bloco é um div.policial.page-view
        css_grupo = css_grupo.replace("body.policial", ".policial")
        # pedido do Kleber (02/11): no celular a foto de fundo do topo fica centralizada (vale também para a foto que ele escolher)
        css_grupo += "\n@media(max-width:700px){.policial .hero-photo,.page-view .hero-photo{object-position:50% 25%!important;object-fit:cover}}"
    if pasta == "captura":
        # celular do topo "Mascote apresentadora" (pedido do Kleber): texto em cima e a raposa grande subindo até quase encostar no botão
        css_grupo += """
@media(max-width:700px){
  [style*="grid-template-columns:1.05fr 0.95fr"]{display:flex!important;flex-direction:column!important}
  [style*="grid-template-columns:1.05fr 0.95fr"]>div:first-child{padding:44px 0 0!important;text-align:center!important}
  [style*="grid-template-columns:1.05fr 0.95fr"]>div:last-child{width:100%;overflow:hidden;margin-top:-6px}
  [style*="grid-template-columns"] img[alt="Rév de braços cruzados"][alt]{width:min(94%,22rem)!important;max-width:22rem!important;margin:0 auto!important}
  [style*="min-height:420px"][style*="align-items:flex-end"]{min-height:380px!important}
  [style*="top:16%"][style*="right:-2%"]{top:43%!important;right:-3%!important}
  [style*="width:430px;height:430px"]{width:360px!important;height:360px!important;bottom:-170px!important}
}"""
    if pasta == "captura":
        # celular do topo "Clean" (raposa em pé no centro): raposa grande e círculo menor, sem o espaço vazio
        css_grupo += """
@media(max-width:700px){
  [style*="max-width:60rem"][style*="height:500px"]{height:430px!important}
  img[alt="Rév"][style*="width:490px"]{width:min(96%,22rem)!important;max-width:22rem!important;height:auto!important}
  [style*="width:380px;height:380px"]{width:310px!important;height:310px!important;bottom:60px!important}
}"""
    biblioteca["grupos"].append({"id": pasta, "nome": nome, "css": css_grupo, "blocos": blocos})
    rotulos[pasta] = {b["id"] for b in blocos}

# páginas de exemplo (spec.json) viram modelos de página inteira
for spec_path in sorted(MODELOS.rglob("spec.json")):
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    grupo = spec["source"].split("/")[0]
    blocos = []
    for b in spec["blocks"]:
        if "id" in b and b["id"] in rotulos.get(grupo, set()):
            blocos.append({"id": b["id"], "tema": "claro" if b["theme"] == "light" else "escuro"})
    if blocos:
        titulo = spec["title"].split("—")[0].split("·")[0].strip() + " " + spec_path.parent.name.replace("exemplo-", "· Exemplo ")
        biblioteca["exemplos"].append({"id": f"{grupo}-{spec_path.parent.name}", "grupo": grupo, "nome": titulo.replace("Exemplo  ", "Exemplo "), "fundo": spec.get("body_bg", "#FFFFFF"), "blocos": blocos})

# ---------- Formulários (pedido do Kleber, 02/11): blocos que são só o formulário, para colocar em qualquer página ----------
def _campo(tipo, ph, c):
    return (f'<input type="{tipo}" placeholder="{ph}" required style="width:100%;font:inherit;font-size:0.98rem;padding:0.9rem 1rem;'
            f'border-radius:9px;border:1px solid {c["borda"]};background:{c["campo"]};color:{c["tinta"]}">')


def _botao(txt, extra=""):
    return (f'<button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#FF6B01;color:#FFFFFF;'
            f'font-weight:600;font-size:1rem;border:0;border-radius:9px;padding:0.9rem 1.7rem;cursor:pointer;{extra}">{txt}</button>')


TEMAS_FORM = {
    "escuro": {"fundo": "#16071D", "cartao": "#1F0D29", "tinta": "#EFEDF1", "suave": "#B6B1BD", "borda": "rgba(255,255,255,0.18)", "campo": "rgba(255,255,255,0.07)"},
    "claro": {"fundo": "#F1EFF4", "cartao": "#FFFFFF", "tinta": "#221E27", "suave": "#67626E", "borda": "rgba(34,30,39,0.2)", "campo": "#FFFFFF"},
}


def _form_html(modelo, c):
    t = lambda x: x
    if modelo == "completo":
        campos = _campo("text", "Seu nome", c) + _campo("email", "Seu melhor e-mail", c) + _campo("tel", "Seu WhatsApp com DDD", c)
        return (f'<section style="background:{c["fundo"]};color:{c["tinta"]};padding:4rem 1.5rem"><div style="max-width:30rem;margin:0 auto;background:{c["cartao"]};'
                f'border:1px solid {c["borda"]};border-radius:24px;padding:2rem 1.6rem;text-align:center">'
                f'<h2 style="margin:0 0 0.4rem;font-size:1.6rem;font-weight:500;line-height:1.15">Receba o acesso</h2>'
                f'<p style="margin:0 0 1.2rem;color:{c["suave"]};font-size:1rem">Preencha abaixo para continuar.</p>'
                f'<form onsubmit="return false" style="display:grid;gap:12px">{campos}{_botao("Enviar", "width:100%")}</form>'
                f'<p style="margin:0.9rem 0 0;font-size:0.8rem;color:{c["suave"]}">Seus dados ficam protegidos. Nada de spam.</p></div></section>')
    if modelo == "email":
        return (f'<section style="background:{c["fundo"]};color:{c["tinta"]};padding:3.5rem 1.5rem;text-align:center"><div style="max-width:36rem;margin:0 auto">'
                f'<h2 style="margin:0 0 0.4rem;font-size:1.6rem;font-weight:500;line-height:1.15">Entre na lista e seja avisado primeiro</h2>'
                f'<p style="margin:0 0 1.2rem;color:{c["suave"]}">Só o e-mail. Leva menos de um minuto.</p>'
                f'<form onsubmit="return false" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><div style="flex:1;min-width:14rem">{_campo("email", "Seu melhor e-mail", c)}</div>{_botao("Me avisar")}</form></div></section>')
    if modelo == "nome-email":
        campos = _campo("text", "Seu nome", c) + _campo("email", "Seu melhor e-mail", c)
        return (f'<section style="background:{c["fundo"]};color:{c["tinta"]};padding:4rem 1.5rem"><div style="max-width:28rem;margin:0 auto;text-align:center">'
                f'<h2 style="margin:0 0 1.2rem;font-size:1.6rem;font-weight:500;line-height:1.15">Quero receber</h2>'
                f'<form onsubmit="return false" style="display:grid;gap:12px">{campos}{_botao("Quero receber", "width:100%")}</form></div></section>')
    # lado a lado: texto à esquerda e formulário à direita
    campos = _campo("text", "Seu nome", c) + _campo("email", "Seu melhor e-mail", c) + _campo("tel", "Seu WhatsApp com DDD", c)
    return (f'<section style="background:{c["fundo"]};color:{c["tinta"]};padding:4rem 1.5rem"><div style="max-width:62rem;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:center">'
            f'<div style="text-align:left"><h2 style="margin:0 0 0.6rem;font-size:2rem;font-weight:500;line-height:1.1">Garanta a sua vaga</h2>'
            f'<p style="margin:0;color:{c["suave"]};font-size:1.05rem;line-height:1.6">Escreva aqui em uma frase o que a pessoa ganha ao preencher o formulário.</p></div>'
            f'<div style="background:{c["cartao"]};border:1px solid {c["borda"]};border-radius:24px;padding:1.6rem"><form onsubmit="return false" style="display:grid;gap:12px">{campos}{_botao("Enviar", "width:100%")}</form></div></div></section>')


FORMS = [("form-completo", "Nome, e-mail e WhatsApp", "completo"), ("form-email", "Só o e-mail (lista de espera)", "email"),
         ("form-nome-email", "Nome e e-mail", "nome-email"), ("form-lado", "Texto ao lado do formulário", "lado")]
biblioteca["grupos"].append({"id": "formularios", "nome": "Formulários", "css": "", "blocos": [
    {"id": i, "rotulo": f"Form {n:02d}", "nome": nome, "descricao": "", "escuro": _form_html(m, TEMAS_FORM["escuro"]), "claro": _form_html(m, TEMAS_FORM["claro"])}
    for n, (i, nome, m) in enumerate(FORMS, 1)]})

# páginas que estão no ar hoje (cópia em scripts/no-ar/, atualizar com:
#   curl -s https://revolucao.com.br/k/pagina-de-vendas/ -o scripts/no-ar/vendas.html  (e o vendas.css, e captura.html)
NO_AR = [
    ("noar-vendas", "Página de vendas (no ar hoje)", "https://revolucao.com.br/k/pagina-de-vendas/", "vendas.html", "vendas.css"),
    ("noar-captura", "Página de captura (no ar hoje)", "https://revolucao.com.br/k/pagina-de-captura/", "captura.html", None),
]
AQUI = Path(__file__).resolve().parent / "no-ar"
TOKEN = re.compile(r"<(/?)(section|header|footer)\b[^>]*>")


def absolutiza_site(texto, base):
    """design/... (relativo à página no ar) vira endereço completo."""
    texto = re.sub(r'(["\'(])(design/|motion/)', rf"\1{base}\2", texto)
    return texto


def blocos_de_cima(corpo):
    """Cada <section>, <header> e <footer> do primeiro nível do corpo vira um bloco."""
    saida, nivel, ini = [], 0, 0
    for m in TOKEN.finditer(corpo):
        if m.group(1) == "":
            if nivel == 0:
                ini = m.start()
            nivel += 1
        else:
            nivel -= 1
            if nivel == 0:
                saida.append(corpo[ini:m.end()])
    return saida


for gid, gnome, base, html_arq, css_arq in NO_AR:
    fonte = (AQUI / html_arq).read_text(encoding="utf-8")
    corpo = fonte[fonte.index("<body"):]
    estilo = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", fonte, re.S))
    if css_arq:
        estilo += "\n" + (AQUI / css_arq).read_text(encoding="utf-8")
    blocos = []
    for n, sec in enumerate(blocos_de_cima(corpo), 1):
        sec = absolutiza_site(re.sub(r"<script\b.*?</script>", "", sec, flags=re.S), base)
        titulo = re.search(r"<h[12][^>]*>(.*?)</h[12]>", sec, re.S)
        sid = re.search(r'id="([^"]+)"', sec[:300])
        nome = tira_tags(titulo.group(1)) if titulo else (sid.group(1) if sid else f"Seção {n}")
        blocos.append({"id": f"{gid}-{n:02d}", "rotulo": f"Seção {n:02d}", "nome": re.sub(r"\s+", " ", nome)[:70], "descricao": "", "escuro": sec})
    if gid == "noar-captura":
        # pedido do Kleber (02/11): no topo da captura entra a raposinha em pé (topo "Clean" da Vitrine), com o texto da página no ar
        clean = next(bl for g in biblioteca["grupos"] if g["id"] == "captura" for bl in g["blocos"] if bl["id"] == "topo-06")
        h = clean["escuro"]
        h = re.sub(r"(<h1[^>]*>).*?(</h1>)", r"\1Um time de inteligências artificiais trabalha com você até a aprovação, na Revolução Concursos.\2", h, count=1, flags=re.S)
        h = re.sub(r"(</h1><p[^>]*>).*?(</p>)", r"\1No momento da abertura, em <b>outubro</b>, sua assinatura dará acesso a todos os concursos da plataforma.\2", h, count=1, flags=re.S)
        h = h.replace("Come&ccedil;ar gratuitamente", "Receber oferta em primeira m&atilde;o")
        blocos[0]["escuro"] = h
        if "claro" in clean:
            # versão branca do mesmo topo (usada no exemplo da lista de espera), com o mesmo texto
            c = clean["claro"]
            c = re.sub(r"(<h1[^>]*>).*?(</h1>)", r"\1Um time de inteligências artificiais trabalha com você até a aprovação, na Revolução Concursos.\2", c, count=1, flags=re.S)
            c = re.sub(r"(</h1><p[^>]*>).*?(</p>)", r"\1No momento da abertura, em <b>outubro</b>, sua assinatura dará acesso a todos os concursos da plataforma.\2", c, count=1, flags=re.S)
            blocos[0]["claro"] = c.replace("Come&ccedil;ar gratuitamente", "Receber oferta em primeira m&atilde;o")
    if gid == "noar-captura":
        # celular do topo da raposa em pé: raposa grande e círculo menor, sem espaço vazio
        estilo += """
@media(max-width:700px){
  [style*="max-width:60rem"][style*="height:500px"]{height:430px!important}
  img[alt="Rév"][style*="width:490px"]{width:min(96%,22rem)!important;max-width:22rem!important;height:auto!important}
  [style*="width:380px;height:380px"]{width:310px!important;height:310px!important;bottom:60px!important}
}"""
    biblioteca["grupos"].append({"id": gid, "nome": gnome, "css": absolutiza_site(estilo, base), "soExemplo": True, "blocos": blocos})
    biblioteca["exemplos"].insert(0, {"id": gid, "grupo": gid, "nome": gnome, "fundo": "#0C0514", "blocos": [{"id": b["id"], "tema": "escuro"} for b in blocos]})

# páginas promocionais completas da Vitrine (captura/promo): cada uma vira um exemplo
PROMOS = [
    ("promo-captura", "Captura · Promo Black Friday", "captura/promo/index.html"),
    ("promo-quase-la", "Captura · Promo, inscrição quase concluída", "captura/promo/quase-la/index.html"),
    ("promo-obrigado", "Obrigado · Promo Black Friday", "captura/promo/obrigado/index.html"),
]
for gid, gnome, caminho in PROMOS:
    fonte = (MODELOS / caminho).read_text(encoding="utf-8")
    corpo = fonte[fonte.index("<body"):]
    estilo = (MODELOS / "captura/promo/estilo.css").read_text(encoding="utf-8")
    blocos = []
    for n, sec in enumerate(blocos_de_cima(corpo), 1):
        sec = re.sub(r"<script\b.*?</script>", "", sec, flags=re.S)
        sec = re.sub(r'(["\'(])(?:\.\./)+assets/', rf"\1{SITE}assets/", sec)
        titulo = re.search(r"<h[12][^>]*>(.*?)</h[12]>", sec, re.S)
        blocos.append({"id": f"{gid}-{n:02d}", "rotulo": f"Seção {n:02d}", "nome": re.sub(r"\s+", " ", tira_tags(titulo.group(1)))[:70] if titulo else f"Seção {n}", "descricao": "", "escuro": sec})
    biblioteca["grupos"].append({"id": gid, "nome": gnome, "css": re.sub(r'(["\'(])(?:\.\./)+assets/', rf"\1{SITE}assets/", estilo), "soExemplo": True, "blocos": blocos})
    biblioteca["exemplos"].append({"id": gid, "grupo": gid, "nome": gnome, "fundo": "#0C0514", "blocos": [{"id": b["id"], "tema": "escuro"} for b in blocos]})

SAIDA.write_text(json.dumps(biblioteca, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(SAIDA, SAIDA.stat().st_size // 1024, "KB")
for g in biblioteca["grupos"]:
    print(f'  {g["id"]}: {len(g["blocos"])} blocos, css {len(g["css"])//1024} KB')
for e in biblioteca["exemplos"]:
    print("  exemplo:", e["id"], "|", e["nome"], "|", len(e["blocos"]), "blocos")
