import { useState, type ChangeEvent, type FormEvent } from "react";
import { Modal } from "./Modal";
import { API, thumbUrl } from "../api";
import { CANAIS_ANUNCIO, IMAGEM_ANUNCIO_PADRAO, PLATAFORMAS_CHECKOUT, TIPOS } from "../etapas";
import { LogoPlataforma, plataformaDe } from "../plataformas";
import type { EtapaData, TipoEtapa } from "../types";

export type DadosEtapa = Omit<EtapaData, "stats" | "thumbVersao">;

type Props = {
  tipo: TipoEtapa;
  inicial?: DadosEtapa; // preenchido quando é edição
  novo?: boolean; // rascunho recém-criado: rótulos de "nova etapa"
  onSalvar: (dados: DadosEtapa) => void;
  onFechar: () => void;
};

const urlValida = (u: string) => /^https?:\/\/\S+\.\S+/i.test(u.trim());

/** Lê a imagem escolhida e reduz para caber no bloco (e no armazenamento). */
function reduzirImagem(arquivo: File, largura = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, largura / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(arquivo);
  });
}

/** Sugere um nome a partir da URL: "/k/pagina-de-vendas/" → "Pagina de vendas". */
function nomeSugerido(u: string) {
  try {
    const partes = new URL(u).pathname.split("/").filter(Boolean);
    const ultimo = partes[partes.length - 1] ?? new URL(u).hostname;
    const texto = ultimo.replace(/[-_]+/g, " ").trim();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  } catch {
    return "";
  }
}

/** O que cada tipo pede no formulário. */
const CAMPOS: Record<TipoEtapa, { subtitulo: string; texto?: { rotulo: string; dica: string; longo?: boolean }; canais?: string[]; urlObrigatoria?: boolean; compactavel?: boolean; semNome?: boolean }> = {
  anuncio: { subtitulo: "A campanha que traz o lead para o funil.", texto: { rotulo: "Descrição da campanha", dica: "Ex.: Campanhas para LP\nOtimizada para Lead\nOtimizada para compra", longo: true }, canais: CANAIS_ANUNCIO },
  pagina: { subtitulo: "Cole o endereço da página. A miniatura é um print real dela.", urlObrigatoria: true },
  formulario: { subtitulo: "Formulário que coleta os dados do lead.", texto: { rotulo: "Campos coletados (um por linha)", dica: "Nome\nTelefone\nE-mail", longo: true } },
  popup: { subtitulo: "Janela que aparece antes do próximo passo.", texto: { rotulo: "O que o pop-up pede ou mostra", dica: "Ex.: nome, telefone e e-mail antes do checkout", longo: true } },
  checkout: { subtitulo: "Página de pagamento. Com o link, a miniatura é um print real.", texto: { rotulo: "O que tem no checkout (um por linha)", dica: "Vídeo de pitch e reforço da oferta\nAuto-complete com dados do pop-up", longo: true }, canais: PLATAFORMAS_CHECKOUT },
  whatsapp: { subtitulo: "A mensagem que o lead recebe nesta etapa. O link do WhatsApp é opcional.", texto: { rotulo: "Mensagem", dica: "Oi, {nome}! Vi que você fez o quiz…", longo: true }, compactavel: true },
  email: { subtitulo: "O e-mail que dispara nesta etapa da automação.", texto: { rotulo: "Assunto", dica: "Ex.: Seu resultado do quiz chegou" }, compactavel: true },
  audiencia: { subtitulo: "Público de remarketing alimentado pelo funil.", texto: { rotulo: "Públicos (um por linha)", dica: "Videoview\nPageview\nLead cadastrado", longo: true } },
  gatilho: { subtitulo: "Evento que dispara o fluxo. O nome é o próprio evento.", texto: { rotulo: "Observação (opcional)", dica: "Ex.: Condição / Pendente: manual ou automático" } },
  espera: { subtitulo: "Tempo de espera até o próximo passo.", texto: { rotulo: "Quanto tempo", dica: "Ex.: 2 horas / 1 dia / 3 dias" }, semNome: true },
  saida: { subtitulo: "Para onde o contato vai ao sair do fluxo. O nome é o destino.", texto: { rotulo: "Observação (opcional)", dica: "Ex.: 3 criativos de remarketing" } },
  nota: { subtitulo: "Texto solto para organizar o canvas. Não conta leads.", texto: { rotulo: "Texto", dica: "Ex.: ATAQUE SOVIÉTICO", longo: true }, semNome: true },
};

/** Formulário de etapa (criar ou editar), com campos conforme o tipo. */
export function EtapaDialog({ tipo, inicial, novo, onSalvar, onFechar }: Props) {
  const def = TIPOS[tipo];
  const campos = CAMPOS[tipo];
  const editando = !!inicial && !novo;
  const [titulo, setTitulo] = useState(inicial?.titulo ?? (campos.semNome ? def.rotulo : ""));
  const [url, setUrl] = useState(inicial?.url ?? (campos.urlObrigatoria ? "https://" : ""));
  const [texto, setTexto] = useState(inicial?.texto ?? "");
  const [canal, setCanal] = useState(inicial?.canal ?? campos.canais?.[0] ?? "");
  const [compacto, setCompacto] = useState(inicial?.compacto ?? false);
  const [imagem, setImagem] = useState(inicial?.imagem ?? "");
  const escolherImagem = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) setImagem(await reduzirImagem(arquivo));
  };
  const [tituloEditado, setTituloEditado] = useState(editando);
  const [previa, setPrevia] = useState<"vazia" | "carregando" | "ok" | "erro">(
    inicial?.url && urlValida(inicial.url) ? "carregando" : "vazia",
  );

  const nomeOk = campos.semNome ? texto.trim().length > 0 : titulo.trim().length > 0;
  const urlOk = campos.urlObrigatoria ? urlValida(url) : !url.trim() || urlValida(url);
  const valido = nomeOk && urlOk;
  const mostraPrevia = API !== null && (tipo === "pagina" || tipo === "checkout");

  const mudarUrl = (v: string) => {
    setUrl(v);
    if (tipo === "pagina" && !tituloEditado) setTitulo(nomeSugerido(v));
    setPrevia(urlValida(v) ? "carregando" : "vazia");
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    onSalvar({
      tipo,
      titulo: campos.semNome ? texto.trim().split("\n")[0].slice(0, 40) : titulo.trim(),
      url: url.trim() || undefined,
      texto: texto.trim() || undefined,
      canal: campos.canais ? canal : undefined,
      compacto: campos.compactavel ? compacto : undefined,
      imagem: tipo === "anuncio" && imagem ? imagem : undefined,
    });
  };

  return (
    <Modal
      titulo={`${editando ? "Editar etapa" : "Nova etapa"} · ${def.rotulo}`}
      subtitulo={campos.subtitulo}
      onFechar={onFechar}
      rodape={
        <>
          <button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" form="form-etapa" className="btn-primary" disabled={!valido}>
            {editando ? "Salvar" : "Adicionar ao funil"}
          </button>
        </>
      }
    >
      <form id="form-etapa" onSubmit={enviar} className="form">
        {campos.urlObrigatoria && (
          <label>
            <span>Endereço (URL)</span>
            <input autoFocus value={url} onChange={(e) => mudarUrl(e.target.value)} placeholder="https://revolucao.com.br/k/..." inputMode="url" />
          </label>
        )}

        {!campos.semNome && (
          <label>
            <span>Nome da etapa</span>
            <input
              autoFocus={!campos.urlObrigatoria}
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); setTituloEditado(true); }}
              placeholder={`Ex.: ${def.rotulo} 1`}
            />
          </label>
        )}

        {campos.canais && (
          <label>
            <span>Plataforma</span>
            <div className="select-logo">
              {plataformaDe(canal) && <LogoPlataforma plataforma={plataformaDe(canal)!} tamanho={18} />}
              <select value={canal} onChange={(e) => setCanal(e.target.value)}>
                {campos.canais.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </label>
        )}

        {campos.texto && (
          <label>
            <span>{campos.texto.rotulo}</span>
            {campos.texto.longo ? (
              <textarea autoFocus={campos.semNome} rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={campos.texto.dica} />
            ) : (
              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={campos.texto.dica} />
            )}
          </label>
        )}

        {tipo === "anuncio" && (
          <div className="imagem-campo">
            <span>Imagem do criativo</span>
            <div className="imagem-linha">
              <img src={imagem || IMAGEM_ANUNCIO_PADRAO} alt="" />
              <div>
                <label className="btn-secundario btn-arquivo">
                  Escolher imagem…
                  <input type="file" accept="image/*" onChange={escolherImagem} />
                </label>
                {imagem && <button type="button" className="link" onClick={() => setImagem("")}>Voltar para a padrão</button>}
                <small>Sem imagem própria, o bloco usa a grade de criativos da raposa.</small>
              </div>
            </div>
          </div>
        )}

        {!campos.urlObrigatoria && !["nota", "espera", "gatilho", "saida"].includes(tipo) && (
          <label>
            <span>Link <em>(opcional)</em></span>
            <input value={url} onChange={(e) => mudarUrl(e.target.value)} placeholder={tipo === "whatsapp" ? "https://wa.me/55..." : "https://..."} inputMode="url" />
          </label>
        )}

        {campos.compactavel && (
          <label className="check">
            <input type="checkbox" checked={compacto} onChange={(e) => setCompacto(e.target.checked)} />
            <span>Bloco compacto (bom para sequências D1, D2, D3…)</span>
          </label>
        )}

        {mostraPrevia && (
          <div className={`previa previa-${previa}`}>
            {previa === "vazia" && <span>{campos.urlObrigatoria ? "A prévia aparece quando a URL estiver completa." : "Com o link, a prévia é um print real da página."}</span>}
            {previa === "carregando" && <span>Tirando o print da página…</span>}
            {previa === "erro" && <span>Não consegui abrir essa página. Confira o endereço.</span>}
            {previa !== "vazia" && (
              <img key={url} src={thumbUrl(url.trim()) ?? undefined} alt="" onLoad={() => setPrevia("ok")} onError={() => setPrevia("erro")} />
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
