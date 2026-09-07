import { useState } from "react";
import { Download } from "lucide-react";
import type {
  Funcionario,
  MovimentoFerias,
  PagamentoDP,
  StatusPagamentoDP,
} from "../../types/DepartamentoPessoal";
import { carregarGeradorPdf } from "../../services/geradorPdf";
import { adicionarCabecalhoPdf } from "../../services/cabecalhoPdf";
import { tiposMovimento } from "./tiposMovimento";
import { Campo } from "./compartilhado";
import {
  botao,
  campo,
  card,
  dataBR,
  dataISO,
  moeda,
  rotuloStatus,
} from "./utils";

export default function Relatorios({
  funcionarios,
  pagamentos,
  movimentos = [],
}: {
  funcionarios: Funcionario[];
  pagamentos: PagamentoDP[];
  movimentos?: MovimentoFerias[];
}) {
  const [inicio, setInicio] = useState(() => `${dataISO().slice(0, 7)}-01`);
  const [fim, setFim] = useState(dataISO);
  const [funcionario, setFuncionario] = useState("");
  const [status, setStatus] = useState<StatusPagamentoDP | "">("");
  const [tipoMovimento, setTipoMovimento] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function gerar(tipo: "SALARIO" | "ADIANTAMENTO" | "FERIAS") {
    if (inicio > fim) {
      setErro("Informe um período válido.");
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      const linhas =
        tipo === "FERIAS"
          ? movimentos
              .filter(
                (m) =>
                  !m.cancelado_em &&
                  (!tipoMovimento || m.tipo_movimentacao === tipoMovimento) &&
                  (!funcionario || String(m.funcionario_id) === funcionario) &&
                  m.data_movimentacao >= inicio &&
                  m.data_movimentacao <= fim,
              )
              .map((m) => [
                funcionarios.find((f) => f.id === m.funcionario_id)?.nome ??
                  "—",
                dataBR(m.data_movimentacao),
                tiposMovimento[m.tipo_movimentacao],
                m.descricao,
                `${m.quantidade_dias} dias`,
                moeda(m.valor),
                m.observacoes || "—",
              ])
          : pagamentos
              .filter(
                (p) =>
                  p.tipo === tipo &&
                  (!funcionario || String(p.funcionario_id) === funcionario) &&
                  (!status || p.status === status) &&
                  p.data_vencimento >= inicio &&
                  p.data_vencimento <= fim,
              )
              .map((p) => [
                p.nome_funcionario,
                p.competencia.slice(0, 7).split("-").reverse().join("/"),
                dataBR(p.data_vencimento),
                dataBR(p.data_pagamento),
                p.forma_pagamento,
                moeda(p.valor),
                moeda(p.valor_extra || 0),
                moeda(Number(p.valor) + Number(p.valor_extra || 0)),
                rotuloStatus(p.status),
              ]);
      if (!linhas.length) {
        setErro("Nenhum registro corresponde aos filtros.");
        return;
      }
      const { jsPDF, autoTable } = await carregarGeradorPdf();
      const doc = new jsPDF({ orientation: "landscape" });
      const titulo =
        tipo === "SALARIO"
          ? "Pagamentos de salários"
          : tipo === "ADIANTAMENTO"
            ? "Adiantamentos salariais"
            : "Movimentações de férias";
      await adicionarCabecalhoPdf(doc, titulo);
      doc.setFontSize(9);
      doc.text(
        `Período: ${dataBR(inicio)} a ${dataBR(fim)} | Funcionário: ${funcionario ? funcionarios.find((f) => String(f.id) === funcionario)?.nome : "Todos"} | Situação: ${status ? rotuloStatus(status) : "Todas"}`,
        14,
        43,
      );
      autoTable(doc, {
        startY: 49,
        head: [
          tipo === "FERIAS"
            ? [
                "Funcionário",
                "Data",
                "Tipo",
                "Movimentação",
                "Dias",
                "Valor pago",
                "Observações",
              ]
            : [
                "Funcionário",
                "Competência",
                "Vencimento",
                "Pago em",
                "Forma",
                "Calculado",
                "Extra",
                "Total",
                "Situação",
              ],
        ],
        body: linhas,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [30, 64, 175] },
      });
      doc.save(`dp-${tipo.toLowerCase()}-${inicio}-a-${fim}.pdf`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o PDF.");
    } finally {
      setOcupado(false);
    }
  }
  return (
    <section className={card}>
      <h2 className="text-xl font-bold text-blue-900">Relatórios</h2>
      <p className="mt-1 text-sm text-slate-500">
        Os relatórios incluem somente os registros internos do Departamento
        Pessoal.
      </p>
      <fieldset
        disabled={ocupado}
        className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Campo nome="Data inicial">
          <input
            type="date"
            className={campo}
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
        </Campo>
        <Campo nome="Data final">
          <input
            type="date"
            className={campo}
            value={fim}
            onChange={(e) => setFim(e.target.value)}
          />
        </Campo>
        <Campo nome="Funcionário">
          <select
            className={campo}
            value={funcionario}
            onChange={(e) => setFuncionario(e.target.value)}
          >
            <option value="">Todos</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo nome="Situação">
          <select
            className={campo}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as StatusPagamentoDP | "")
            }
          >
            <option value="">Todas</option>
            <option value="EM_ABERTO">Pendente</option>
            <option value="PARCIAL">Parcial</option>
            <option value="PAGO">Pago</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </Campo>
        <Campo nome="Tipo de férias">
          <select
            className={campo}
            value={tipoMovimento}
            onChange={(e) => setTipoMovimento(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            {Object.entries(tiposMovimento).map(([tipo, nome]) => (
              <option key={tipo} value={tipo}>
                {nome}
              </option>
            ))}
          </select>
        </Campo>
      </fieldset>
      {erro && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {erro}
        </p>
      )}
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {(
          [
            ["SALARIO", "Salários"],
            ["ADIANTAMENTO", "Adiantamentos"],
            ["FERIAS", "Férias e pagamentos"],
          ] as const
        ).map(([tipo, nome]) => (
          <button
            key={tipo}
            disabled={ocupado}
            className={botao}
            onClick={() => void gerar(tipo)}
          >
            <Download size={17} />
            {ocupado ? "Preparando..." : `Baixar ${nome}`}
          </button>
        ))}
      </div>
    </section>
  );
}
