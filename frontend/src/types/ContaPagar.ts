import { FormaPagamento } from "./Venda";

export type ContaPagarStatus =
  | "EM_ABERTO"
  | "PAGO"
  | "CANCELADO";

export type ContaPagar = {
  id?: number;

  data_lancamento: string;

  favorecido: string;

  descricao: string;

  valor: number;

  forma_pagamento: FormaPagamento;

  data_vencimento: string;

  status: ContaPagarStatus;

  observacoes: string;

  created_at?: string;
};
