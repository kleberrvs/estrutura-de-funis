import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Painel } from "./pages/Painel";
import { HomePaginas } from "./paginas/HomePaginas";
import { EditorPagina } from "./paginas/EditorPagina";
import { lerPagina } from "./paginas/storage";
import { lerFunil } from "./storage";
import { aplicarCaixas, caixasAtual } from "./caixas";

aplicarCaixas(caixasAtual());

/** Rotas por hash: `#/` lista de funis, `#/funil/<id>` painel, `#/paginas` lista de páginas, `#/pagina/<id>` editor. */
type Rota = { tela: "funis" } | { tela: "funil"; id: string } | { tela: "paginas" } | { tela: "pagina"; id: string };

/** Versão publicada em /k/paginas/: só o construtor de páginas (sem a área de funis). */
export const SO_PAGINAS = import.meta.env.VITE_SO_PAGINAS === "1";

function rotaAtual(): Rota {
  const h = window.location.hash;
  const funil = h.match(/^#\/funil\/([^/?]+)/);
  if (funil) return { tela: "funil", id: funil[1] };
  const pagina = h.match(/^#\/pagina\/([^/?]+)/);
  if (pagina) return { tela: "pagina", id: pagina[1] };
  if (h.startsWith("#/paginas")) return { tela: "paginas" };
  return SO_PAGINAS ? { tela: "paginas" } : { tela: "funis" };
}

export default function App() {
  const [rota, setRota] = useState<Rota>(rotaAtual);
  useEffect(() => {
    const onHash = () => setRota(rotaAtual());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const ir = (hash: string) => { window.location.hash = hash; };

  if (rota.tela === "pagina") {
    const pagina = lerPagina(rota.id);
    if (!pagina) { ir("#/paginas"); return null; }
    return <EditorPagina key={pagina.id} inicial={pagina} voltar={() => ir("#/paginas")} />;
  }
  if (rota.tela === "paginas") return <HomePaginas abrir={(id) => ir(`#/pagina/${id}`)} />;

  const funil = rota.tela === "funil" ? lerFunil(rota.id) : undefined;
  if (rota.tela === "funil" && !funil) ir("#/");
  if (!funil) return <Home abrir={(id) => ir(`#/funil/${id}`)} />;
  return <Painel funil={funil} voltar={() => ir("#/")} />;
}
