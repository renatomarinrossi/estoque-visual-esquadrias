import type { PagamentoDP } from "../../types/DepartamentoPessoal";
import { moeda, dataBR, secundario, card } from "./utils";
import { Vazio, Status } from "./compartilhado";
import Tabela from "./Tabela";
export default function Pagamentos({
  listaFolha,
  extras,
  setPagarItem,
}: {
  listaFolha: PagamentoDP[];
  extras: Record<number, number>;
  setPagarItem: (p: PagamentoDP) => void;
}) {
  return (
    <>
      <Tabela
        cabecalhos={[
          "Funcionário",
          "Tipo",
          "Vencimento",
          "Valor calculado",
          "Acréscimos / descontos",
          "Total atualizado",
          "Situação",
          "Ação",
        ]}
      >
        {listaFolha.length ? (
          listaFolha.map((p) => (
            <tr key={p.id} className="border-t">
              <td>
                <strong>{p.nome_funcionario}</strong>
                <p className="text-xs text-slate-500">{p.funcao_funcionario}</p>
              </td>
              <td>
                {p.tipo === "ADIANTAMENTO" ? "Adiantamento" : "Pagamento"}
              </td>
              <td>{dataBR(p.data_vencimento)}</td>
              <td>{moeda(p.valor)}</td>
              <td>
                <span>{moeda(p.valor_extra)}</span>
              </td>
              <td className="font-bold">
                {moeda(Number(p.valor) + Number(extras[p.id] ?? 0))}
              </td>
              <td>
                <Status status={p.status} />
              </td>
              <td>
                {p.status === "EM_ABERTO" ? (
                  <button
                    className={secundario}
                    onClick={() =>
                      setPagarItem({
                        ...p,
                        valor_extra: Number(extras[p.id] ?? 0),
                      })
                    }
                  >
                    Ajustar / baixar
                  </button>
                ) : (
                  dataBR(p.data_pagamento)
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={8}>
              <Vazio texto="Nenhum pagamento encontrado." />
            </td>
          </tr>
        )}
      </Tabela>
      <div className={`${card} flex items-center justify-between`}>
        <span className="font-medium text-slate-600">
          Total atualizado da folha
        </span>
        <strong className="text-2xl text-blue-900">
          {moeda(
            listaFolha.reduce(
              (s, p) => s + Number(p.valor) + Number(extras[p.id] ?? 0),
              0,
            ),
          )}
        </strong>
      </div>
    </>
  );
}
