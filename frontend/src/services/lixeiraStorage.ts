import type { ProdutoLixeira } from "../types/produtoLixeira";

const CHAVE = "visual_esquadrias_lixeira";

export function carregarLixeira(): ProdutoLixeira[] {
  const dados = localStorage.getItem(CHAVE);

  if (!dados) {
    return [];
  }

  return JSON.parse(dados);
}

export function salvarLixeira(
  produtos: ProdutoLixeira[]
) {
  localStorage.setItem(
    CHAVE,
    JSON.stringify(produtos)
  );
}
