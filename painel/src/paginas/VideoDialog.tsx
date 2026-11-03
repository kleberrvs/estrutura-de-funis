import { useRef, useState } from "react";
import { Modal } from "../components/Modal";

const LIMITE = 3 * 1024 * 1024; // vídeo enviado fica guardado no navegador: só cabe arquivo pequeno

type Props = { atual: { src: string; poster: string }; onEscolher: (src: string, poster: string) => void; onFechar: () => void };

/** Trocar o vídeo de um bloco: colar o endereço do arquivo (recomendado) ou enviar um arquivo pequeno. */
export function VideoDialog({ atual, onEscolher, onFechar }: Props) {
  const [src, setSrc] = useState(atual.src.startsWith("data:") ? "" : atual.src);
  const [poster, setPoster] = useState(atual.poster.startsWith("data:") ? "" : atual.poster);
  const [erro, setErro] = useState("");
  const arquivo = useRef<HTMLInputElement>(null);

  const enviar = (arq?: File) => {
    if (!arq) return;
    if (arq.size > LIMITE) { setErro(`Esse arquivo tem ${(arq.size / 1048576).toFixed(1)} MB e não cabe aqui (limite de 3 MB). Coloque o vídeo no Drive ou no site e cole o endereço dele acima.`); return; }
    const l = new FileReader();
    l.onload = () => onEscolher(String(l.result), poster.trim());
    l.onerror = () => setErro("Não consegui ler esse arquivo.");
    l.readAsDataURL(arq);
  };

  return (
    <Modal
      titulo="Trocar vídeo"
      subtitulo="O vídeo toca em loop, sem som, quando aparece na tela."
      onFechar={onFechar}
      rodape={<><button className="btn-secundario" onClick={onFechar}>Cancelar</button><button className="btn-primary" disabled={!/^https?:\/\//i.test(src.trim())} onClick={() => onEscolher(src.trim(), poster.trim())}>Usar este vídeo</button></>}
    >
      <div className="form">
        <label><span>Endereço do vídeo (arquivo .mp4 ou .webm)</span><input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="https://..." inputMode="url" autoFocus /></label>
        <label><span>Imagem de capa <em>(opcional, aparece antes de o vídeo carregar)</em></span><input value={poster} onChange={(e) => setPoster(e.target.value)} placeholder="https://..." inputMode="url" /></label>
        <button type="button" className="btn-secundario" onClick={() => arquivo.current?.click()}>Ou enviar um arquivo pequeno do computador (até 3 MB)</button>
        <input ref={arquivo} type="file" accept="video/*" hidden onChange={(e) => enviar(e.target.files?.[0])} />
        {erro && <p className="aviso-erro">{erro}</p>}
        <p className="dica">Para vídeos grandes, o melhor é hospedar o arquivo (Drive, site) e colar o endereço dele: assim a página carrega rápido e o arquivo não pesa no navegador.</p>
      </div>
    </Modal>
  );
}
