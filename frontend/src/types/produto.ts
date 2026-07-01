export type Produto = {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  estoqueMinimo: number;
  precoCompra: number;
  observacao: string;
  ultimaEntrada?: string;
};
