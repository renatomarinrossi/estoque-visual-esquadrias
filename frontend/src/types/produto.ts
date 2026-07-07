export type Produto = {
  id?: number;

  codigo: string;

  descricao: string;

  categoria: string;

  unidade: string;

  quantidade: number;

  estoqueMinimo: number;

  precoCompra: number;

  fornecedorId?: number | null;

  observacao: string;

  ultimaEntrada?: string | null;
};
