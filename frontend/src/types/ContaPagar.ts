export type ContaPagarStatus = "EM_ABERTO" | "PAGO" | "CANCELADO";

export type FormaPagamentoContaPagar = "PIX" | "BOLETO" | "CHEQUE_FISICA" | "CHEQUE_JURIDICA";

export type ContaPagar = {
  id?: number;
  data_lancamento: string;
  favorecido: string;
  descricao: string;
  valor: number;
  forma_pagamento: FormaPagamentoContaPagar;
  data_vencimento: string;
  data_pagamento?: string | null;
  status: ContaPagarStatus;
  observacoes: string;
  created_at?: string;
};
