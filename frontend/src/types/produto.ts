export type Produto = {
  codigo: string;

  descricao: string;

  categoria?: string;

  unidade: string;

  quantidade: number;

  estoqueMinimo: number;

  precoCompra: number;

  observacao: string;

  fornecedorId?: number;

  fornecedorNome?: string;

  ultimaEntrada?: string;
};
