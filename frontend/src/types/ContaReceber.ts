import type {
  FormaPagamento,
  ParcelaStatus,
} from "./VendaParcela";

export type ContaReceber = {
  parcela_id: number;
  venda_id: number;
  cliente: string;
  numero_parcela: number;
  total_parcelas: number;
  data_vencimento: string;
  forma_pagamento: FormaPagamento;
  descricao_entrega: string;
  valor: number;
  valor_recebido: number;
  saldo: number;
  status: ParcelaStatus;
};

