import type { PeriodoDisponivel } from "./Formularios";
import { dataBR, dataISO, secundario, botao } from "./utils";
import { Vazio } from "./compartilhado";
import Tabela from "./Tabela";
export default function Ferias({
  listaPeriodos,
  setPeriodoAberto,
}: {
  listaPeriodos: PeriodoDisponivel[];
  setPeriodoAberto: (id: number) => void;
}) {
  return (
    <Tabela
      cabecalhos={[
        "Funcionário",
        "Período aquisitivo",
        "Prazo final",
        "Saldo",
        "Situação",
        "Ação",
      ]}
    >
      {listaPeriodos.length ? (
        listaPeriodos.map((o) => {
          const encerrado = o.diasDisponiveis === 0;
          const vencida = !encerrado && o.periodo.data_direito <= dataISO();
          return (
            <tr key={o.periodo.id} className="border-t">
              <td>
                <strong>{o.funcionario.nome}</strong>
                <p className="text-xs text-slate-500">{o.funcionario.funcao}</p>
              </td>
              <td>
                {dataBR(o.periodo.periodo_aquisitivo_inicio)} a{" "}
                {dataBR(o.periodo.periodo_aquisitivo_fim)}
              </td>
              <td>{dataBR(o.periodo.limite_concessao)}</td>
              <td>
                <strong>{o.diasDisponiveis} dias</strong>
              </td>
              <td>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${encerrado ? "bg-slate-100 text-slate-700" : vencida ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                >
                  {encerrado
                    ? "Encerrado"
                    : vencida
                      ? "Vencidas"
                      : "Disponível"}
                </span>
              </td>
              <td>
                <button
                  className={encerrado ? secundario : botao}
                  onClick={() => setPeriodoAberto(o.periodo.id)}
                >
                  {encerrado ? "Histórico" : "Lançar"}
                </button>
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan={6}>
            <Vazio texto="Nenhum período de férias adquirido." />
          </td>
        </tr>
      )}
    </Tabela>
  );
}
