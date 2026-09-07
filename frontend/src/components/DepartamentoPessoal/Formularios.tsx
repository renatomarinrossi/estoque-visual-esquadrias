import { useState, type FormEvent } from "react";
import type {
  CadastroFuncionario,
  FormaPagamentoDP,
  Funcionario,
  MovimentoFerias,
  NovoMovimentoFerias,
  PagamentoDP,
  PeriodoFerias,
} from "../../types/DepartamentoPessoal";
import {
  atualizarMovimentoFerias,
  lancarAjuste,
  cancelarMovimentoFerias,
  mensagemErroDP,
  pagarFolha,
  registrarMovimentoFerias,
  salvarFuncionario,
} from "../../services/departamentoPessoalSupabase";
import { Campo, Modal } from "./compartilhado";
import {
  botao,
  campo,
  dataBR,
  dataISO,
  dividirSalario,
  moeda,
  secundario,
} from "./utils";

type Base = { fechar: () => void; salvo: () => Promise<void> };
import { tiposMovimento } from "./tiposMovimento";
const formas: FormaPagamentoDP[] = [
  "PIX",
  "DINHEIRO",
  "TRANSFERENCIA",
  "OUTRO",
];
const rotuloForma = (v: string) =>
  ({
    PIX: "PIX",
    DINHEIRO: "Dinheiro",
    TRANSFERENCIA: "Transferência",
    OUTRO: "Outro",
  })[v] ?? v;

export function FuncionarioForm({
  funcionario,
  pagamentos,
  fechar,
  salvo,
}: Base & { funcionario?: Funcionario; pagamentos: PagamentoDP[] }) {
  const [decisoes, setDecisoes] = useState<Record<string, string>>({});
  const [revisarPendencias, setRevisarPendencias] = useState(false);
  const [dados, setDados] = useState<CadastroFuncionario>(
    () =>
      funcionario ?? {
        nome: "",
        funcao: "",
        salario: 0,
        data_admissao: dataISO(),
        data_inativacao: null,
        data_aviso_ferias: null,
        ativo: true,
        observacoes: "",
      },
  );
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [adiantamento, saldo] = dividirSalario(dados.salario);
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ocupado) return;
    const fd = new FormData(e.currentTarget);
    setOcupado(true);
    setErro("");
    try {
      await salvarFuncionario(
        { ...dados, data_admissao: String(fd.get("admissao") ?? "") },
        funcionario?.id,
        decisoes,
      );
      await salvo();
      fechar();
    } catch (e) {
      setErro(mensagemErroDP(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Modal
      titulo={funcionario ? "Editar funcionário" : "Novo funcionário"}
      ocupado={ocupado}
      fechar={fechar}
    >
      <form onSubmit={(e) => void enviar(e)}>
        <fieldset disabled={ocupado} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo nome="Nome completo">
              <input
                autoFocus
                required
                maxLength={160}
                className={campo}
                value={dados.nome}
                onChange={(e) =>
                  setDados((d) => ({ ...d, nome: e.target.value }))
                }
              />
            </Campo>
            <Campo nome="Função">
              <input
                required
                maxLength={160}
                className={campo}
                value={dados.funcao}
                onChange={(e) =>
                  setDados((d) => ({ ...d, funcao: e.target.value }))
                }
              />
            </Campo>
            <Campo nome="Salário mensal">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className={campo}
                value={dados.salario || ""}
                onChange={(e) =>
                  setDados((d) => ({ ...d, salario: Number(e.target.value) }))
                }
              />
            </Campo>
            <Campo nome="Data de contratação">
              <input
                name="admissao"
                required
                type="date"
                className={campo}
                defaultValue={dados.data_admissao}
              />
            </Campo>
            <Campo nome="Situação">
              <select
                className={campo}
                value={String(dados.ativo)}
                onChange={(e) => {
                  const ativo = e.target.value === "true";
                  setDados((d) => ({
                    ...d,
                    ativo,
                    data_inativacao:
                      !ativo && !d.data_inativacao
                        ? dataISO()
                        : d.data_inativacao,
                  }));
                }}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </Campo>
            <Campo nome="Data da demissão/inativação">
              <input
                type="date"
                min={dados.data_admissao}
                className={campo}
                value={dados.data_inativacao ?? ""}
                onChange={(e) =>
                  setDados((d) => ({
                    ...d,
                    data_inativacao: e.target.value || null,
                  }))
                }
              />
            </Campo>
          </div>
          <div className="grid gap-3 rounded-lg bg-slate-100 p-4 text-sm sm:grid-cols-2">
            <span>
              Adiantamento: <strong>{moeda(adiantamento)}</strong>
            </span>
            <span>
              Pagamento: <strong>{moeda(saldo)}</strong>
            </span>
          </div>
          {funcionario && (
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={revisarPendencias}
                onChange={(e) => {
                  setRevisarPendencias(e.target.checked);
                  setDecisoes({});
                }}
              />
              Revisar pagamentos pendentes
            </label>
          )}
          {funcionario &&
            (revisarPendencias ||
              dados.ativo !== funcionario.ativo ||
              dados.data_inativacao !== funcionario.data_inativacao) && (
              <section className="space-y-3 rounded-lg bg-amber-50 p-4">
                <p>
                  Revise cada competência pendente. Pagamentos já baixados serão
                  preservados.
                </p>
                {[
                  ...new Set(
                    pagamentos
                      .filter(
                        (p) =>
                          p.funcionario_id === funcionario.id &&
                          p.status === "EM_ABERTO",
                      )
                      .map((p) => p.competencia),
                  ),
                ].map((c) => (
                  <Campo
                    key={c}
                    nome={
                      c.slice(0, 7) +
                      " · " +
                      moeda(
                        pagamentos
                          .filter(
                            (p) =>
                              p.funcionario_id === funcionario.id &&
                              p.competencia === c &&
                              p.status === "EM_ABERTO",
                          )
                          .reduce(
                            (s, p) =>
                              s + Number(p.valor) + Number(p.valor_extra),
                            0,
                          ),
                      )
                    }
                  >
                    <select
                      required
                      className={campo}
                      value={decisoes[c] ?? ""}
                      onChange={(e) =>
                        setDecisoes((d) => ({ ...d, [c]: e.target.value }))
                      }
                    >
                      <option value="">Selecione uma decisão</option>
                      <option value="MANTER">Manter valores devidos</option>
                      <option value="RECALCULAR">
                        Recalcular proporcional por 30
                      </option>
                      <option value="CANCELAR">
                        Cancelar pendências desta competência
                      </option>
                    </select>
                  </Campo>
                ))}
              </section>
            )}
          <Campo nome="Observações">
            <textarea
              rows={2}
              className={campo}
              value={dados.observacoes}
              onChange={(e) =>
                setDados((d) => ({ ...d, observacoes: e.target.value }))
              }
            />
          </Campo>
          {erro && (
            <p role="alert" className="text-sm text-red-700">
              {erro}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" className={secundario} onClick={fechar}>
              Cancelar
            </button>
            <button className={botao}>
              {ocupado ? "Salvando..." : "Salvar funcionário"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export type PeriodoDisponivel = {
  periodo: PeriodoFerias;
  funcionario: Funcionario;
  diasUsados: number;
  diasDisponiveis: number;
};
export function MovimentoFeriasForm({
  opcao,
  movimentos,
  fechar,
  salvo,
}: Base & { opcao: PeriodoDisponivel; movimentos: MovimentoFerias[] }) {
  const vazio: NovoMovimentoFerias = {
    periodo_id: opcao.periodo.id,
    tipo_movimentacao: "GOZO",
    valor: 0,
    descricao: "",
    quantidade_dias: 0,
    data_movimentacao: dataISO(),
    observacoes: "",
    idempotencia: crypto.randomUUID(),
  };
  const [dados, setDados] = useState<NovoMovimentoFerias>(vazio);
  const [editando, setEditando] = useState<MovimentoFerias | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const historico = movimentos.filter((m) => m.periodo_id === opcao.periodo.id);
  const saldoParaEdicao =
    opcao.diasDisponiveis + Number(editando?.quantidade_dias ?? 0);
  const saldoDepois = saldoParaEdicao - Number(dados.quantidade_dias || 0);
  function editar(m: MovimentoFerias) {
    setEditando(m);
    setErro("");
    setDados({
      periodo_id: opcao.periodo.id,
      tipo_movimentacao: m.tipo_movimentacao,
      valor: Number(m.valor),
      descricao: m.descricao,
      quantidade_dias: Number(m.quantidade_dias),
      data_movimentacao: m.data_movimentacao,
      observacoes: m.observacoes,
      idempotencia: crypto.randomUUID(),
    });
  }
  function limparEdicao() {
    setEditando(null);
    setErro("");
    setDados({ ...vazio, idempotencia: crypto.randomUUID() });
  }
  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!dados.descricao.trim()) {
      setErro("Escreva o que deseja registrar.");
      return;
    }
    if (saldoDepois < 0 || saldoDepois > opcao.periodo.dias_direito) {
      setErro("A quantidade deve estar dentro do saldo disponível.");
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      if (editando) await atualizarMovimentoFerias(editando.id, dados);
      else
        await registrarMovimentoFerias({
          ...dados,
          descricao: dados.descricao.trim(),
        });
      await salvo();
      fechar();
    } catch (e) {
      setErro(mensagemErroDP(e));
    } finally {
      setOcupado(false);
    }
  }
  async function cancelar(m: MovimentoFerias) {
    if (!confirm(`Cancelar o lançamento “${m.descricao}”?`)) return;
    setOcupado(true);
    setErro("");
    try {
      await cancelarMovimentoFerias(m.id);
      await salvo();
      fechar();
    } catch (e) {
      setErro(mensagemErroDP(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Modal
      titulo={
        opcao.diasDisponiveis > 0 || editando
          ? editando
            ? "Editar movimentação"
            : "Lançar movimentação"
          : "Histórico de férias"
      }
      ocupado={ocupado}
      fechar={fechar}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="font-bold text-blue-900">{opcao.funcionario.nome}</p>
          <p className="text-sm text-slate-600">
            Período aquisitivo:{" "}
            {dataBR(opcao.periodo.periodo_aquisitivo_inicio)} a{" "}
            {dataBR(opcao.periodo.periodo_aquisitivo_fim)}
          </p>
          <p className="mt-3 text-2xl font-bold text-blue-900">
            Saldo atual: {opcao.diasDisponiveis} dias
          </p>
        </div>
        {
          <form onSubmit={(e) => void enviar(e)}>
            <fieldset disabled={ocupado} className="space-y-4">
              <Campo nome="Tipo de movimentação">
                <select
                  className={campo}
                  value={dados.tipo_movimentacao}
                  onChange={(e) =>
                    setDados((d) => ({
                      ...d,
                      tipo_movimentacao: e.target
                        .value as NovoMovimentoFerias["tipo_movimentacao"],
                      quantidade_dias: 0,
                      valor: 0,
                    }))
                  }
                >
                  {Object.entries(tiposMovimento)
                    .filter(
                      ([t]) =>
                        t !== "LEGADO" ||
                        editando?.tipo_movimentacao === "LEGADO",
                    )
                    .map(([t, n]) => (
                      <option key={t} value={t}>
                        {n}
                      </option>
                    ))}
                </select>
              </Campo>
              <Campo nome="Valor pago (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={campo}
                  required
                  value={dados.valor}
                  onChange={(e) =>
                    setDados((d) => ({ ...d, valor: Number(e.target.value) }))
                  }
                />
              </Campo>
              <Campo nome="O que deseja registrar?">
                <input
                  autoFocus
                  required
                  maxLength={200}
                  className={campo}
                  placeholder="Descrição do lançamento"
                  value={dados.descricao}
                  onChange={(e) =>
                    setDados((d) => ({ ...d, descricao: e.target.value }))
                  }
                />
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo nome="Quantidade de dias">
                  <input
                    required
                    type="number"
                    disabled={dados.tipo_movimentacao.startsWith("PAGAMENTO_")}
                    min={dados.tipo_movimentacao === "AJUSTE" ? -30 : 0}
                    max={saldoParaEdicao}
                    step="1"
                    className={campo}
                    value={dados.quantidade_dias || ""}
                    onChange={(e) =>
                      setDados((d) => ({
                        ...d,
                        quantidade_dias: Number(e.target.value),
                      }))
                    }
                  />
                </Campo>
                <Campo nome="Data">
                  <input
                    required
                    type="date"
                    className={campo}
                    value={dados.data_movimentacao}
                    onChange={(e) =>
                      setDados((d) => ({
                        ...d,
                        data_movimentacao: e.target.value,
                      }))
                    }
                  />
                </Campo>
              </div>
              <Campo nome="Observações (opcional)">
                <textarea
                  rows={2}
                  className={campo}
                  value={dados.observacoes}
                  onChange={(e) =>
                    setDados((d) => ({ ...d, observacoes: e.target.value }))
                  }
                />
              </Campo>
              {dados.quantidade_dias > 0 && (
                <p
                  className={`rounded-lg p-3 text-sm font-semibold ${saldoDepois < 0 ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}
                >
                  Saldo depois da {editando ? "alteração" : "movimentação"}:{" "}
                  {Math.max(0, saldoDepois)} dias
                </p>
              )}
              {erro && (
                <p role="alert" className="text-sm text-red-700">
                  {erro}
                </p>
              )}
              <div className="flex justify-end gap-3">
                {editando && (
                  <button
                    type="button"
                    className={secundario}
                    onClick={limparEdicao}
                  >
                    Cancelar edição
                  </button>
                )}
                <button type="button" className={secundario} onClick={fechar}>
                  Fechar
                </button>
                <button className={botao}>
                  {ocupado
                    ? "Salvando..."
                    : editando
                      ? "Salvar alteração"
                      : "Salvar lançamento"}
                </button>
              </div>
            </fieldset>
          </form>
        }
        <section className="border-t pt-4">
          <h3 className="font-bold text-blue-900">Histórico do período</h3>
          {historico.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">
              Nenhum lançamento neste período.
            </p>
          ) : (
            <div className="mt-2 divide-y">
              {historico.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <strong
                      className={
                        m.cancelado_em
                          ? "text-slate-400 line-through"
                          : "text-slate-800"
                      }
                    >
                      {tiposMovimento[m.tipo_movimentacao]} ·{" "}
                      {m.quantidade_dias} dias · {moeda(m.valor)} —{" "}
                      {m.descricao}
                    </strong>
                    <p className="text-xs text-slate-500">
                      {dataBR(m.data_movimentacao)}
                      {m.observacoes ? ` · ${m.observacoes}` : ""}
                    </p>
                  </div>
                  {!m.cancelado_em && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="text-xs font-medium text-blue-700"
                        onClick={() => editar(m)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-red-700"
                        onClick={() => void cancelar(m)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}

export function FolhaPagamentoForm({
  registro,
  fechar,
  salvo,
}: Base & { registro: PagamentoDP }) {
  const [valorExtra, setValorExtra] = useState(0);
  const [chave] = useState(() => crypto.randomUUID());
  const [observacoes, setObservacoes] = useState(
    registro.observacoes_extra || "",
  );
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const total =
    Number(registro.valor) + Number(registro.valor_extra) + valorExtra;
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setOcupado(true);
    setErro("");
    try {
      const acao = (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
        "value",
      );
      if (acao === "AJUSTAR") {
        if (!valorExtra)
          throw new Error(
            "Informe um acréscimo ou desconto diferente de zero.",
          );
        await lancarAjuste(registro.id, valorExtra, observacoes, chave);
      } else
        await pagarFolha(
          registro.id,
          String(fd.get("data")),
          String(fd.get("forma")) as FormaPagamentoDP,
          valorExtra,
          observacoes,
          chave,
        );
      await salvo();
      fechar();
    } catch (e) {
      setErro(mensagemErroDP(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Modal titulo="Dar baixa no pagamento" ocupado={ocupado} fechar={fechar}>
      <form onSubmit={(e) => void enviar(e)}>
        <fieldset disabled={ocupado} className="space-y-4">
          <div>
            <strong>{registro.nome_funcionario}</strong>
            <p className="text-sm text-slate-500">
              {registro.tipo === "ADIANTAMENTO" ? "Adiantamento" : "Pagamento"}{" "}
              · {dataBR(registro.data_vencimento)}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo nome="Valor calculado">
              <input
                readOnly
                className={`${campo} bg-slate-100`}
                value={moeda(registro.valor)}
              />
            </Campo>
            <Campo nome="Novo acréscimo (+) ou desconto (−)">
              <input
                type="number"
                step="0.01"
                className={campo}
                value={valorExtra || ""}
                onChange={(e) => setValorExtra(Number(e.target.value))}
              />
            </Campo>
          </div>
          <Campo nome="Descrição do ajuste">
            <input
              required={valorExtra !== 0}
              className={campo}
              maxLength={200}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </Campo>
          <p className="rounded-lg bg-blue-50 p-4 text-lg font-bold text-blue-900">
            Total atualizado: {moeda(total)}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo nome="Data do pagamento">
              <input
                name="data"
                required
                type="date"
                max={dataISO()}
                defaultValue={dataISO()}
                className={campo}
              />
            </Campo>
            <Campo nome="Forma de pagamento">
              <select
                name="forma"
                defaultValue={registro.forma_pagamento}
                className={campo}
              >
                {formas.map((f) => (
                  <option key={f} value={f}>
                    {rotuloForma(f)}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          {erro && <p className="text-sm text-red-700">{erro}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={fechar} className={secundario}>
              Cancelar
            </button>
            <button name="acao" value="AJUSTAR" className={secundario}>
              Salvar somente ajuste
            </button>
            <button name="acao" value="PAGAR" className={botao}>
              Confirmar baixa
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
