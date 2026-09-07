import { selecionarProximoPagamento } from "../../components/DepartamentoPessoal/proximoPagamento";
import Ferias from "../../components/DepartamentoPessoal/Ferias";
import ConfiguracaoDP from "../../components/DepartamentoPessoal/ConfiguracaoDP";
import ArquivoFerias from "../../components/DepartamentoPessoal/ArquivoFerias";
import Pagamentos from "../../components/DepartamentoPessoal/Pagamentos";
import Funcionarios from "../../components/DepartamentoPessoal/Funcionarios";
import VisaoGeral from "../../components/DepartamentoPessoal/VisaoGeral";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  Download,
  FileText,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import type {
  Funcionario,
  MovimentoFerias,
  PagamentoDP,
  PeriodoFerias,
  TipoPagamentoDP,
} from "../../types/DepartamentoPessoal";
import {
  carregarDepartamentoPessoal,
  gerarFolha,
  mensagemErroDP,
} from "../../services/departamentoPessoalSupabase";
import {
  FolhaPagamentoForm,
  FuncionarioForm,
  MovimentoFeriasForm,
  type PeriodoDisponivel,
} from "../../components/DepartamentoPessoal/Formularios";
import Relatorios from "../../components/DepartamentoPessoal/Relatorios";
import {
  botao,
  campo,
  dataBR,
  dataISO,
  moeda,
  secundario,
} from "../../components/DepartamentoPessoal/utils";
import { carregarGeradorPdf } from "../../services/geradorPdf";
import { adicionarCabecalhoPdf } from "../../services/cabecalhoPdf";

const abas = [
  { nome: "Visão geral", icone: LayoutDashboard },
  { nome: "Funcionários", icone: Users },
  { nome: "Pagamentos", icone: CircleDollarSign },
  { nome: "Férias", icone: CalendarDays },
  { nome: "Relatórios", icone: FileText },
] as const;
type Aba = (typeof abas)[number]["nome"];

export default function DepartamentoPessoal() {
  const [aba, setAba] = useState<Aba>("Visão geral");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoDP[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoFerias[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoFerias[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [busca, setBusca] = useState("");
  const [competencia, setCompetencia] = useState(() => dataISO().slice(0, 7));
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamentoDP | "">("");
  const [statusPagamento, setStatusPagamento] = useState("");
  const [situacao, setSituacao] = useState("ATIVOS");
  const [formFuncionario, setFormFuncionario] = useState<
    Funcionario | "novo" | null
  >(null);
  const [periodoAberto, setPeriodoAberto] = useState<number | null>(null);
  const [pagarItem, setPagarItem] = useState<PagamentoDP | null>(null);
  const [extras, setExtras] = useState<Record<number, number>>({});
  const sequencia = useRef(0);
  const tipoDefinido = useRef(false);
  const carregar = useCallback(async () => {
    const pedido = ++sequencia.current;
    setCarregando(true);
    setErro("");
    try {
      const d = await carregarDepartamentoPessoal();
      if (pedido !== sequencia.current) return;
      setFuncionarios(d.funcionarios);
      setPagamentos(d.pagamentos);
      setPeriodos(d.periodos);
      setMovimentos(d.movimentos);
      setExtras(
        Object.fromEntries(
          d.pagamentos.map((p) => [p.id, Number(p.valor_extra || 0)]),
        ),
      );
    } catch (e) {
      if (pedido === sequencia.current) setErro(mensagemErroDP(e));
    } finally {
      if (pedido === sequencia.current) setCarregando(false);
    }
  }, []);
  useEffect(() => {
    const controle = sequencia;
    void carregar();
    return () => {
      controle.current++;
    };
  }, [carregar]);
  useEffect(() => {
    if (tipoDefinido.current || !pagamentos.length) return;
    const hoje = dataISO();
    const proximo = selecionarProximoPagamento(pagamentos, hoje);
    if (proximo) {
      setCompetencia(proximo.competencia.slice(0, 7));
      setTipoPagamento(proximo.tipo);
      tipoDefinido.current = true;
    }
  }, [pagamentos]);
  const ativos = funcionarios.filter((f) => f.ativo);
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const corresponde = (s: string) =>
    s.toLocaleLowerCase("pt-BR").includes(termo);
  const valores = ativos.map((f) => [
    Math.round(Number(f.salario) * 40) / 100,
    Number(f.salario) - Math.round(Number(f.salario) * 40) / 100,
  ]);
  const opcoesFerias = useMemo<PeriodoDisponivel[]>(
    () =>
      periodos
        .map((periodo) => {
          const funcionario = funcionarios.find(
            (f) => f.id === periodo.funcionario_id,
          );
          const usadosNovos = movimentos
            .filter((m) => m.periodo_id === periodo.id && !m.cancelado_em)
            .reduce((s, m) => s + Number(m.quantidade_dias), 0);
          const diasUsados = usadosNovos;
          return funcionario
            ? {
                periodo,
                funcionario,
                diasUsados,
                diasDisponiveis: Math.max(0, periodo.dias_direito - diasUsados),
              }
            : null;
        })
        .filter((o): o is PeriodoDisponivel => Boolean(o))
        .sort((a, b) =>
          a.periodo.data_direito.localeCompare(b.periodo.data_direito),
        ),
    [periodos, funcionarios, movimentos],
  );
  const periodosAtivos = opcoesFerias.filter((o) => o.funcionario.ativo);
  const vencidas = periodosAtivos.filter(
    (o) => o.diasDisponiveis > 0 && o.periodo.data_direito <= dataISO(),
  );
  const listaPeriodos = periodosAtivos.filter((o) =>
    corresponde(`${o.funcionario.nome} ${o.funcionario.funcao}`),
  );
  const listaFuncionarios = funcionarios.filter(
    (f) =>
      corresponde(`${f.nome} ${f.funcao}`) &&
      (situacao === "TODOS" || f.ativo === (situacao === "ATIVOS")),
  );
  const listaFolha = pagamentos.filter(
    (p) =>
      p.competencia.slice(0, 7) === competencia &&
      corresponde(p.nome_funcionario) &&
      (!tipoPagamento || p.tipo === tipoPagamento) &&
      (!statusPagamento || p.status === statusPagamento),
  );
  const selecionado = opcoesFerias.find((o) => o.periodo.id === periodoAberto);
  const bloqueado = ocupado || carregando || Boolean(erro);
  async function gerar() {
    if (bloqueado || !competencia) return;
    setOcupado(true);
    try {
      const n = await gerarFolha(competencia);
      setAviso(
        n
          ? `${n} pagamentos criados.`
          : "A folha desta competência já está gerada.",
      );
      await carregar();
    } catch (e) {
      setAviso(mensagemErroDP(e));
    } finally {
      setOcupado(false);
    }
  }
  async function gerarRelatorio() {
    if (!listaFolha.length) {
      setAviso("Nenhum pagamento corresponde aos filtros.");
      return;
    }
    setOcupado(true);
    try {
      const { jsPDF, autoTable } = await carregarGeradorPdf();
      const doc = new jsPDF({ orientation: "landscape" });
      await adicionarCabecalhoPdf(doc, "Relatório de pagamentos");
      doc.setFontSize(9);
      doc.text(
        `Competência: ${competencia.split("-").reverse().join("/")} | Tipo: ${tipoPagamento === "ADIANTAMENTO" ? "Adiantamento" : tipoPagamento === "SALARIO" ? "Pagamento" : "Todos"} | Situação: ${statusPagamento || "Todas"}`,
        14,
        43,
      );
      const linhas = listaFolha.map((p) => [
        p.nome_funcionario,
        p.tipo === "ADIANTAMENTO" ? "Adiantamento" : "Pagamento",
        dataBR(p.data_vencimento),
        moeda(p.valor),
        moeda(extras[p.id] ?? 0),
        moeda(Number(p.valor) + Number(extras[p.id] ?? 0)),
        p.status === "PAGO"
          ? "Pago"
          : p.status === "CANCELADO"
            ? "Cancelado"
            : "Pendente",
        "________________",
      ]);
      autoTable(doc, {
        startY: 49,
        head: [
          [
            "Funcionário",
            "Tipo",
            "Vencimento",
            "Calculado",
            "Extra",
            "Total",
            "Situação",
            "Assinatura",
          ],
        ],
        body: linhas,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 64, 175] },
      });
      const y =
        (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
          ?.finalY ?? 80;
      doc.text(
        "Observações: __________________________________________________________________________________________________",
        14,
        y + 12,
      );
      doc.text(
        `Total atualizado: ${moeda(listaFolha.reduce((s, p) => s + Number(p.valor) + Number(extras[p.id] ?? 0), 0))}`,
        14,
        y + 24,
      );
      doc.save(`pagamentos-${competencia}.pdf`);
    } catch (e) {
      setAviso(mensagemErroDP(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">
            Departamento Pessoal
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Atualizar"
            disabled={ocupado}
            className={secundario}
            onClick={() => void carregar()}
          >
            <RefreshCw size={17} />
          </button>
          <button
            disabled={bloqueado}
            className={botao}
            onClick={() => setFormFuncionario("novo")}
          >
            <Plus size={17} />
            Novo funcionário
          </button>
        </div>
      </div>
      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        {abas.map(({ nome, icone: Icone }) => (
          <button
            key={nome}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${aba === nome ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500"}`}
            onClick={() => {
              setAba(nome);
              setBusca("");
            }}
          >
            <Icone size={17} />
            {nome}
          </button>
        ))}
      </nav>
      {aviso && (
        <div
          role="status"
          className="flex justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
        >
          {aviso}
          <button onClick={() => setAviso("")}>×</button>
        </div>
      )}
      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"
        >
          {erro}
          <br />
          <button
            className={`${secundario} mt-3`}
            onClick={() => void carregar()}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {carregando && (
        <p className="py-10 text-center text-slate-500">Carregando...</p>
      )}
      {!carregando && !erro && (
        <>
          {aba === "Visão geral" && (
            <VisaoGeral
              ativos={ativos}
              valores={valores}
              vencidas={vencidas}
              setPeriodoAberto={setPeriodoAberto}
              setAba={setAba}
            />
          )}
          {(aba === "Funcionários" ||
            aba === "Pagamentos" ||
            aba === "Férias") && (
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-52 flex-1 text-sm text-slate-600">
                Buscar
                <input
                  className={`${campo} mt-1`}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome do funcionário"
                />
              </label>
              {aba === "Funcionários" && (
                <label>
                  Situação
                  <select
                    className={campo}
                    value={situacao}
                    onChange={(e) => setSituacao(e.target.value)}
                  >
                    <option value="ATIVOS">Ativos</option>
                    <option value="INATIVOS">Inativos</option>
                    <option value="TODOS">Todos</option>
                  </select>
                </label>
              )}
              {aba === "Pagamentos" && (
                <>
                  <label>
                    Competência
                    <input
                      type="month"
                      className={campo}
                      value={competencia}
                      onChange={(e) => setCompetencia(e.target.value)}
                    />
                  </label>
                  <label>
                    Tipo
                    <select
                      className={campo}
                      value={tipoPagamento}
                      onChange={(e) => {
                        tipoDefinido.current = true;
                        setTipoPagamento(
                          e.target.value as TipoPagamentoDP | "",
                        );
                      }}
                    >
                      <option value="">Todos</option>
                      <option value="ADIANTAMENTO">Adiantamento</option>
                      <option value="SALARIO">Pagamento</option>
                    </select>
                  </label>
                  <label>
                    Situação
                    <select
                      className={campo}
                      value={statusPagamento}
                      onChange={(e) => setStatusPagamento(e.target.value)}
                    >
                      <option value="">Todas</option>
                      <option value="EM_ABERTO">Pendentes</option>
                      <option value="PAGO">Pagos</option>
                      <option value="CANCELADO">Cancelados</option>
                    </select>
                  </label>
                  <button
                    disabled={bloqueado}
                    className={secundario}
                    onClick={() => void gerar()}
                  >
                    Gerar folha
                  </button>
                  <button
                    disabled={bloqueado}
                    className={botao}
                    onClick={() => void gerarRelatorio()}
                  >
                    <Download size={17} />
                    Gerar relatório
                  </button>
                </>
              )}
            </div>
          )}
          {aba === "Funcionários" && (
            <Funcionarios
              listaFuncionarios={listaFuncionarios}
              pagamentos={pagamentos}
              setFormFuncionario={setFormFuncionario}
            />
          )}
          {aba === "Pagamentos" && (
            <Pagamentos
              listaFolha={listaFolha}
              extras={extras}
              setPagarItem={setPagarItem}
            />
          )}
          {aba === "Férias" && (
            <>
              <Ferias
                listaPeriodos={listaPeriodos}
                setPeriodoAberto={setPeriodoAberto}
              />
              <ArquivoFerias />
            </>
          )}
          {aba === "Relatórios" && (
            <>
              <Relatorios
                funcionarios={funcionarios}
                pagamentos={pagamentos}
                movimentos={movimentos}
              />
              <ConfiguracaoDP />
            </>
          )}
        </>
      )}
      {formFuncionario && (
        <FuncionarioForm
          pagamentos={pagamentos}
          funcionario={formFuncionario === "novo" ? undefined : formFuncionario}
          fechar={() => setFormFuncionario(null)}
          salvo={carregar}
        />
      )}{" "}
      {selecionado && (
        <MovimentoFeriasForm
          opcao={selecionado}
          movimentos={movimentos}
          fechar={() => setPeriodoAberto(null)}
          salvo={carregar}
        />
      )}{" "}
      {pagarItem && (
        <FolhaPagamentoForm
          registro={pagarItem}
          fechar={() => setPagarItem(null)}
          salvo={carregar}
        />
      )}
    </div>
  );
}
