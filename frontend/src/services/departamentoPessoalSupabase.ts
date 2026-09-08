import { supabase } from "./supabase";
import type {
  CadastroFuncionario,
  FormaPagamentoDP,
  Funcionario,
  MovimentoFerias,
  NovoMovimentoFerias,
  PagamentoDP,
  PeriodoFerias,
} from "../types/DepartamentoPessoal";

export function mensagemErroDP(erro: unknown): string {
  if (erro && typeof erro === "object" && "message" in erro) {
    const mensagem = String(erro.message);
    if (/schema cache|does not exist|Could not find/i.test(mensagem))
      return "O banco ainda não recebeu a atualização completa do Departamento Pessoal.";
    return mensagem;
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}
async function listar<T>(tabela: string, selecao = "*"): Promise<T[]> {
  const linhas: T[] = [];
  for (let inicio = 0; ; inicio += 500) {
    const { data, error } = await supabase
      .from(tabela)
      .select(selecao)
      .order("id")
      .range(inicio, inicio + 499);
    if (error) throw error;
    linhas.push(...(data as unknown as T[]));
    if (data.length < 500) return linhas;
  }
}
export async function carregarDepartamentoPessoal() {
  const { error } = await supabase.rpc("dp_sincronizar_periodos_ferias");
  if (error) throw error;
  const [funcionarios, pagamentos, periodos, movimentos] =
    await Promise.all([
      listar<Funcionario>("dp_funcionarios"),
      listar<PagamentoDP>("dp_pagamentos"),
      listar<PeriodoFerias>("dp_periodos_ferias"),
      listar<MovimentoFerias>("dp_ferias_movimentacoes"),
    ]);
  return {
    funcionarios: funcionarios.sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    ),
    pagamentos: pagamentos
      .map((p) => ({
        ...p,
        valor_extra: Number(p.valor_extra ?? 0),
        observacoes_extra: p.observacoes_extra ?? "",
      }))
      .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento)),
    periodos: periodos.sort((a, b) =>
      a.data_direito.localeCompare(b.data_direito),
    ),
    movimentos: movimentos.sort(
      (a, b) =>
        b.data_movimentacao.localeCompare(a.data_movimentacao) || b.id - a.id,
    ),
  };
}
export async function salvarFuncionario(
  dados: CadastroFuncionario,
  id?: number,
  decisoes: Record<string, string> = {},
) {
  const payload = {
    ...dados,
    nome: dados.nome.trim(),
    funcao: dados.funcao.trim(),
    data_aviso_ferias: null,
  };
  if (
    !payload.nome ||
    !payload.funcao ||
    !Number.isFinite(payload.salario) ||
    payload.salario <= 0 ||
    !payload.data_admissao
  )
    throw new Error("Preencha nome, função, salário positivo e admissão.");
  const { error } = await supabase.rpc("dp_salvar_funcionario", {
    p_dados: payload,
    p_id: id ?? null,
    p_decisoes: decisoes,
  });
  if (error) throw error;
}
export async function gerarFolha(competencia: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia))
    throw new Error("Selecione o mês de competência.");
  const { data, error } = await supabase.rpc("dp_gerar_folha", {
    p_competencia: `${competencia}-01`,
  });
  if (error) throw error;
  return Number(data);
}
export async function excluirFuncionario(id: number, nomeConfirmacao: string) {
  const { error } = await supabase.rpc("dp_excluir_funcionario", {
    p_id: id,
    p_nome_confirmacao: nomeConfirmacao,
  });
  if (error) throw error;
}
export async function pagarFolha(
  id: number,
  data: string,
  forma: FormaPagamentoDP,
  valor = 0,
  descricao = "",
  idempotencia = crypto.randomUUID(),
) {
  const { error } = await supabase.rpc("dp_baixar_com_ajuste", {
    p_id: id, p_data: data, p_forma: forma,
    p_valor: valor, p_descricao: descricao, p_idempotencia: idempotencia,
  });
  if (error) throw error;
}
export async function lancarAjuste(
  id: number,
  valor: number,
  descricao: string,
  idempotencia: string,
) {
  const { error } = await supabase.rpc("dp_lancar_ajuste", {
    p_pagamento_id: id,
    p_valor: valor,
    p_descricao: descricao,
    p_idempotencia: idempotencia,
  });
  if (error) throw error;
}
export async function registrarMovimentoFerias(d: NovoMovimentoFerias) {
  const { error } = await supabase.rpc("dp_salvar_movimento_ferias", {
    p_dados: d,
    p_id: null,
  });
  if (error) throw error;
}
export async function atualizarMovimentoFerias(
  id: number,
  d: NovoMovimentoFerias,
) {
  const { error } = await supabase.rpc("dp_salvar_movimento_ferias", {
    p_dados: d,
    p_id: id,
  });
  if (error) throw error;
}
export async function cancelarMovimentoFerias(id: number) {
  const { error } = await supabase.rpc("dp_cancelar_movimento_ferias", {
    p_movimento_id: id,
  });
  if (error) throw error;
}
