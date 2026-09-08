import { useState, type FormEvent } from "react";
import type { Funcionario, PagamentoDP } from "../../types/DepartamentoPessoal";
import { excluirFuncionario, mensagemErroDP } from "../../services/departamentoPessoalSupabase";
import { Campo, Modal } from "./compartilhado";
import { campo, secundario } from "./utils";

export default function ExcluirFuncionario({ funcionario, pagamentos, fechar, salvo }: {
  funcionario: Funcionario;
  pagamentos: PagamentoDP[];
  fechar: () => void;
  salvo: () => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const folha = pagamentos.filter((p) => p.funcionario_id === funcionario.id);
  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (ocupado || nome !== funcionario.nome) return;
    setOcupado(true);
    setErro("");
    try {
      await excluirFuncionario(funcionario.id, nome);
      await salvo();
      fechar();
    } catch (e) {
      setErro(mensagemErroDP(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Modal titulo="Excluir funcionário definitivamente" ocupado={ocupado} fechar={fechar}>
      <form onSubmit={(e) => void enviar(e)} className="space-y-4">
        <p>Você excluirá <strong>{funcionario.nome}</strong> e todos os registros vinculados: pagamentos, ajustes, férias, períodos aquisitivos e auditoria desse funcionário.</p>
        <p className="rounded-lg bg-red-50 p-3 text-red-800">
          Serão removidos inclusive os pagamentos já quitados. Atualmente há {folha.length} pagamentos, dos quais {folha.filter((p) => p.status === "PAGO").length} pagos. Esta ação não pode ser desfeita pela tela.
        </p>
        <p className="text-sm text-slate-600">Arquivos e backups gerados anteriormente permanecem nas cópias de segurança.</p>
        <Campo nome={`Digite ${funcionario.nome} para confirmar`}>
          <input autoFocus required autoComplete="off" className={campo} value={nome} disabled={ocupado} onChange={(e) => setNome(e.target.value)} />
        </Campo>
        {erro && <p role="alert" className="text-red-700">{erro}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" disabled={ocupado} className={secundario} onClick={fechar}>Cancelar</button>
          <button disabled={ocupado || nome !== funcionario.nome} className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
            {ocupado ? "Excluindo..." : "Excluir todos os registros"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
