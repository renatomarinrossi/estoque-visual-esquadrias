import type { Produto } from "./produto";

export type ProdutoLixeira = Produto & {
  dataExclusao: string;
};
