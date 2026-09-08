import type { Funcionario, PagamentoDP } from "../../types/DepartamentoPessoal";
import { dividirSalario, moeda, dataBR, secundario } from "./utils";
import Tabela from "./Tabela";
export default function Funcionarios({
  listaFuncionarios,
  pagamentos,
  setFormFuncionario,
  excluir,
  ocupado,
}: {
  listaFuncionarios: Funcionario[];
  pagamentos: PagamentoDP[];
  setFormFuncionario: (f: Funcionario) => void;
  excluir: (f: Funcionario) => void;
  ocupado: boolean;
}) {
  return (
    <Tabela
      cabecalhos={[
        "Nome / função",
        "Salário",
        "Adiantamento — dia 20",
        "Pagamento — 5º dia útil",
        "Situação",
        "Demissão/inativação",
        "Ação",
      ]}
    >
      {listaFuncionarios.map((f) => {
        const [a, s] = dividirSalario(f.salario);
        const proximo = pagamentos
          .filter(
            (p) =>
              p.funcionario_id === f.id &&
              p.tipo === "SALARIO" &&
              p.status === "EM_ABERTO",
          )
          .sort((x, y) =>
            x.data_vencimento.localeCompare(y.data_vencimento),
          )[0];
        return (
          <tr key={f.id} className="border-t">
            <td>
              <strong>{f.nome}</strong>
              <p className="text-xs text-slate-500">{f.funcao}</p>
            </td>
            <td>{moeda(f.salario)}</td>
            <td>{moeda(a)}</td>
            <td>
              {moeda(s)}
              <p className="text-xs text-slate-500">
                {dataBR(proximo?.data_vencimento)}
              </p>
            </td>
            <td>{f.ativo ? "Ativo" : "Inativo"}</td>
            <td>{dataBR(f.data_inativacao)}</td>
            <td>
              <button
                disabled={ocupado}
                className={secundario}
                onClick={() => setFormFuncionario(f)}
              >
                Editar
              </button>
              <button
                disabled={ocupado}
                className={`${secundario} ml-2 text-red-700`}
                onClick={() => excluir(f)}
              >
                Excluir
              </button>
            </td>
          </tr>
        );
      })}
    </Tabela>
  );
}
