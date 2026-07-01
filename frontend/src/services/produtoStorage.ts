import type { Produto } from "../types/produto";

const CHAVE = "visual_esquadrias_produtos";

export function salvarProdutos(produtos: Produto[]) {
  localStorage.setItem(
    CHAVE,
    JSON.stringify(produtos)
  );
}

export function carregarProdutos(): Produto[] {
  const dados = localStorage.getItem(CHAVE);

  if (!dados) {
    return [];
  }

  return JSON.parse(dados);
}
