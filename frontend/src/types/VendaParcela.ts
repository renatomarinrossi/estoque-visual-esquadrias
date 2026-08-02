export type ParcelaStatus =
  | "A_RECEBER"
  | "PARCIALMENTE_RECEBIDO"
  | "RECEBIDO"
  | "CANCELADO";

export type FormaPagamento =
  | "PIX"
  | "DINHEIRO"
  | "CARTAO"
  | "BOLETO"
  | "CHEQUE"
  | "CONDICIONADO_ENTREGA";

export type VendaParcela = {
  id?: number;

  venda_id: number;

  numero_parcela: number;

  total_parcelas: number;

  valor: number;

  data_vencimento: string;

  forma_pagamento: FormaPagamento;

  condicionado_entrega: boolean;

  descricao_entrega: string;

  status: ParcelaStatus;

  valor_recebido?: number;

  created_at?: string;
};
