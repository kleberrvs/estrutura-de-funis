import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { MODELOS, type Modelo } from "../storage";

type Props = {
  modo: "criar" | "renomear";
  modeloInicial?: Modelo;
  inicial?: { nome: string; descricao: string };
  onSalvar: (dados: { nome: string; descricao: string; modelo: Modelo }) => void;
  onFechar: () => void;
};

/** Formulário de nome e descrição de um funil (criar ou renomear). */
export function FunilDialog({ modo, modeloInicial, inicial, onSalvar, onFechar }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? (modeloInicial && modeloInicial !== "vazio" ? MODELOS[modeloInicial].rotulo : ""));
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [modelo, setModelo] = useState<Modelo>(modeloInicial ?? "vazio");
  const valido = nome.trim().length > 0;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (valido) onSalvar({ nome: nome.trim(), descricao: descricao.trim(), modelo });
  };

  return (
    <Modal
      titulo={modo === "criar" ? "Novo funil" : "Renomear funil"}
      subtitulo={modo === "criar" ? "Escolha um modelo para começar; depois é só ajustar no canvas." : undefined}
      onFechar={onFechar}
      rodape={
        <>
          <button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" form="form-funil" className="btn-primary" disabled={!valido}>
            {modo === "criar" ? "Criar funil" : "Salvar"}
          </button>
        </>
      }
    >
      <form id="form-funil" onSubmit={enviar} className="form">
        <label>
          <span>Nome</span>
          <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Lançamento de setembro" />
        </label>
        {modo === "criar" && (
          <label>
            <span>Começar com</span>
            <select value={modelo} onChange={(e) => setModelo(e.target.value as Modelo)}>
              {(Object.keys(MODELOS) as Modelo[]).map((k) => <option key={k} value={k}>{MODELOS[k].rotulo}</option>)}
            </select>
          </label>
        )}
        <label>
          <span>Descrição <em>(opcional)</em></span>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Anúncio → Quiz → Página de vendas" />
        </label>
      </form>
    </Modal>
  );
}
