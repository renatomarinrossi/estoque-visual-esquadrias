export type StatusPagamentoDP = "EM_ABERTO" | "PARCIAL" | "PAGO" | "CANCELADO";
export type FormaPagamentoDP = "PIX" | "DINHEIRO" | "TRANSFERENCIA" | "OUTRO";
export type TipoPagamentoDP = "ADIANTAMENTO" | "SALARIO";
export type ComponenteFerias = "FERIAS" | "TERCO" | "ABONO";
export type Funcionario = {
  id: number;
  nome: string;
  funcao: string;
  salario: number;
  data_admissao: string;
  data_inativacao: string | null;
  data_aviso_ferias: string | null;
  ativo: boolean;
  observacoes: string;
};
export type CadastroFuncionario = Omit<Funcionario, "id">;
export type PagamentoDP = {
  id: number;
  funcionario_id: number;
  competencia: string;
  tipo: TipoPagamentoDP;
  nome_funcionario: string;
  funcao_funcionario: string;
  salario_base: number;
  valor: number;
  valor_extra: number;
  observacoes_extra: string;
  forma_pagamento: FormaPagamentoDP;
  data_vencimento: string;
  data_pagamento: string | null;
  status: Exclude<StatusPagamentoDP, "PARCIAL">;
};
export type PeriodoFerias = {
  id: number;
  funcionario_id: number;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  data_direito: string;
  limite_concessao: string;
  dias_direito: number;
};
export type PagamentoFerias = {
  id: number;
  ferias_id: number;
  componente: ComponenteFerias;
  valor: number;
  data_pagamento: string;
  forma_pagamento: FormaPagamentoDP;
  observacoes: string;
};
export type Ferias = {
  id: number;
  funcionario_id: number;
  periodo_id: number | null;
  inicio: string;
  fim: string;
  dias_gozo: number;
  abono_dias: number;
  nome_funcionario: string;
  funcao_funcionario: string;
  valor_ferias: number;
  valor_terco: number;
  valor_abono: number;
  data_prevista_pagamento: string;
  data_prevista_terco: string | null;
  data_prevista_abono: string | null;
  data_pagamento: string | null;
  status: StatusPagamentoDP;
  observacoes: string;
  pagamentos: PagamentoFerias[];
};
export type TipoMovimentoFerias =
  | "GOZO"
  | "ABONO"
  | "PAGAMENTO_FERIAS"
  | "PAGAMENTO_TERCO"
  | "PAGAMENTO_ABONO"
  | "AJUSTE"
  | "LEGADO";
export type MovimentoFerias = {
  tipo_movimentacao: TipoMovimentoFerias;
  valor: number;
  id: number;
  periodo_id: number;
  funcionario_id: number;
  descricao: string;
  quantidade_dias: number;
  data_movimentacao: string;
  observacoes: string;
  cancelado_em: string | null;
  created_at: string;
};
export type NovoMovimentoFerias = {
  tipo_movimentacao: TipoMovimentoFerias;
  valor: number;
  periodo_id: number;
  descricao: string;
  quantidade_dias: number;
  data_movimentacao: string;
  observacoes: string;
  idempotencia: string;
};
export type ProgramacaoFerias = {
  periodo_id: number;
  inicio: string;
  fim: string;
  abono_dias: number;
  valor_ferias: number;
  valor_terco: number;
  valor_abono: number;
  data_prevista_pagamento: string;
  data_prevista_terco: string | null;
  data_prevista_abono: string | null;
  observacoes: string;
  idempotencia: string;
};
export const totalFerias = (f: Ferias) =>
  Number(f.valor_ferias) + Number(f.valor_terco) + Number(f.valor_abono);
export const pagoFerias = (f: Ferias) =>
  (f.pagamentos ?? []).reduce((s, p) => s + Number(p.valor), 0);
export const saldoFerias = (f: Ferias) =>
  Math.max(0, totalFerias(f) - pagoFerias(f));
