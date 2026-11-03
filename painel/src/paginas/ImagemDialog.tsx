import { useRef, useState } from "react";
import { Modal } from "../components/Modal";
import { IMAGENS_MARCA } from "./blocos";

/** Reduz a foto antes de guardar, para caber no navegador. SVG passa direto. */
async function prepararArquivo(arq: File): Promise<string> {
  if (arq.type === "image/svg+xml") return new Promise((ok, erro) => { const l = new FileReader(); l.onload = () => ok(String(l.result)); l.onerror = erro; l.readAsDataURL(arq); });
  const bmp = await createImageBitmap(arq);
  const escala = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(bmp.width * escala);
  cv.height = Math.round(bmp.height * escala);
  cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
  return cv.toDataURL(arq.type === "image/png" ? "image/png" : "image/jpeg", 0.85);
}

type Props = { atual: string; onEscolher: (valor: string) => void; onFechar: () => void };

/** Janela para trocar uma imagem: enviar do computador, colar um endereço, usar a logo ou remover. */
export function ImagemDialog({ atual, onEscolher, onFechar }: Props) {
  const [url, setUrl] = useState(atual.startsWith("data:") ? "" : atual);
  const [erro, setErro] = useState("");
  const arquivo = useRef<HTMLInputElement>(null);

  const enviar = async (arq?: File) => {
    if (!arq) return;
    try { onEscolher(await prepararArquivo(arq)); } catch { setErro("Não consegui ler essa imagem. Tente outro arquivo."); }
  };

  return (
    <Modal
      titulo="Trocar imagem"
      subtitulo="Envie um arquivo ou cole o endereço de uma imagem que já está no ar."
      onFechar={onFechar}
      rodape={
        <>
          {atual && <button type="button" className="btn-perigo" onClick={() => onEscolher("")}>Remover imagem</button>}
          <button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button>
        </>
      }
    >
      <div className="form">
        {atual && <img className="img-previa" src={atual} alt="" />}
        <button type="button" className="btn-primary" onClick={() => arquivo.current?.click()}>Enviar do computador</button>
        <input ref={arquivo} type="file" accept="image/*" hidden onChange={(e) => enviar(e.target.files?.[0])} />
        <label>
          <span>Ou cole o endereço da imagem</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} onFocus={(e) => e.target.select()} placeholder="https://..." inputMode="url" />
        </label>
        <div className="img-linha">
          <button type="button" className="btn-secundario" disabled={!/^https?:\/\//i.test(url.trim())} onClick={() => onEscolher(url.trim())}>Usar este endereço</button>
        </div>
        <span className="img-marca-tit">Imagens da marca</span>
        <div className="img-marca">
          {IMAGENS_MARCA.map((m) => (
            <button key={m.rotulo} type="button" className={`img-marca-item${m.rotulo.includes("branca") || m.rotulo.includes("colorida") ? " escuro" : ""}`} onClick={() => onEscolher(m.valor)} title={m.rotulo}>
              <img src={m.valor} alt={m.rotulo} />
              <small>{m.rotulo}</small>
            </button>
          ))}
        </div>
        {erro && <p className="aviso-erro">{erro}</p>}
        <p className="dica">Dica: imagem enviada fica guardada neste navegador. Para a página final, o melhor é hospedar a imagem e usar o endereço dela.</p>
      </div>
    </Modal>
  );
}
