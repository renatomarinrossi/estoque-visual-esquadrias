export type VendaStatus =
  | "A_RECEBER"
  | "RECEBIDO"
  | "CANCELADO";

export type Venda = {
  id?: number;

  data_venda: string;

  cliente: string;

  valor_total: number;

  responsavel: string;

  status: VendaStatus;

  observacoes: string;

  created_at?: string;
};
