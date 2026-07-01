export type Movimentacao = {
  codigoProduto: string;
  descricaoProduto: string;
  tipo: "ENTRADA" | "SAIDA";
  quantidade: number;
  data: string;
};
