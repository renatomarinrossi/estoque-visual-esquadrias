export type ModuloLogFinanceiro =
  | "VENDAS"
  | "RECEBIMENTOS"
  | "CONTAS_A_PAGAR";

export type LogFinanceiro = {
  id: number;
  created_at: string;
  usuario_id: number | null;
  modulo: ModuloLogFinanceiro;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  descricao: string;
  detalhes: Record<string, unknown>;
  usuario_nome: string;
};
