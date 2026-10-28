import { Modal } from "./Modal";

type Props = {
  titulo: string;
  texto: string;
  rotulo?: string;
  onConfirmar: () => void;
  onFechar: () => void;
};

/** Confirmação de ação destrutiva (apagar funil, zerar números). */
export function ConfirmDialog({ titulo, texto, rotulo = "Apagar", onConfirmar, onFechar }: Props) {
  return (
    <Modal
      titulo={titulo}
      onFechar={onFechar}
      rodape={
        <>
          <button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button>
          <button type="button" className="btn-perigo" onClick={onConfirmar} autoFocus>{rotulo}</button>
        </>
      }
    >
      <p className="modal-texto">{texto}</p>
    </Modal>
  );
}
