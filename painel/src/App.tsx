import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Painel } from "./pages/Painel";
import { lerFunil } from "./storage";
import { aplicarCaixas, caixasAtual } from "./caixas";

aplicarCaixas(caixasAtual());

/** Rota por hash: `#/` é a lista de funis, `#/funil/<id>` abre um painel. */
function rotaAtual() {
  const m = window.location.hash.match(/^#\/funil\/([^/?]+)/);
  return m ? m[1] : null;
}

export default function App() {
  const [funilId, setFunilId] = useState<string | null>(rotaAtual);
  useEffect(() => {
    const onHash = () => setFunilId(rotaAtual());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const abrir = (id: string) => { window.location.hash = `#/funil/${id}`; };
  const voltar = () => { window.location.hash = "#/"; };

  const funil = funilId ? lerFunil(funilId) : undefined;
  if (funilId && !funil) voltar();
  if (!funil) return <Home abrir={abrir} />;
  return <Painel funil={funil} voltar={voltar} />;
}
