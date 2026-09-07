import { AlertTriangle } from "lucide-react";
import type { Funcionario } from "../../types/DepartamentoPessoal";
import type { PeriodoDisponivel } from "./Formularios";
import { card, moeda, dataBR, secundario } from "./utils";
import { Vazio } from "./compartilhado";
import Tabela from "./Tabela";
export default function VisaoGeral({
  ativos,
  valores,
  vencidas,
  setPeriodoAberto,
  setAba,
}: {
  ativos: Funcionario[];
  valores: number[][];
  vencidas: PeriodoDisponivel[];
  setPeriodoAberto: (id: number) => void;
  setAba: (aba: "Férias") => void;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Funcionários ativos", String(ativos.length)],
          [
            "Salários cadastrados",
            moeda(ativos.reduce((s, f) => s + Number(f.salario), 0)),
          ],
          [
            "Adiantamento · dia 20",
            moeda(valores.reduce((s, v) => s + v[0], 0)),
          ],
          ["Saldo · dia 05", moeda(valores.reduce((s, v) => s + v[1], 0))],
        ].map(([t, v]) => (
          <div key={t} className={`${card} border-l-4 border-l-blue-600`}>
            <p className="text-sm text-slate-500">{t}</p>
            <p className="mt-2 text-2xl font-bold text-blue-900">{v}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-blue-900">
          <AlertTriangle size={19} className="text-red-600" />
          Avisos de férias vencidas
        </h2>
        <Tabela
          cabecalhos={[
            "Funcionário",
            "Período aquisitivo",
            "Prazo final",
            "Saldo",
            "Ação",
          ]}
        >
          {vencidas.length ? (
            vencidas.map((o) => (
              <tr key={o.periodo.id} className="border-t">
                <td>
                  <strong>{o.funcionario.nome}</strong>
                  <p className="text-xs text-slate-500">
                    {o.funcionario.funcao}
                  </p>
                </td>
                <td>
                  {dataBR(o.periodo.periodo_aquisitivo_inicio)} a{" "}
                  {dataBR(o.periodo.periodo_aquisitivo_fim)}
                </td>
                <td className="font-semibold text-red-700">
                  {dataBR(o.periodo.limite_concessao)}
                </td>
                <td>{o.diasDisponiveis} dias</td>
                <td>
                  <button
                    className={secundario}
                    onClick={() => {
                      setPeriodoAberto(o.periodo.id);
                      setAba("Férias");
                    }}
                  >
                    Ver férias
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>
                <Vazio texto="Nenhuma férias vencida." />
              </td>
            </tr>
          )}
        </Tabela>
      </section>
    </>
  );
}
