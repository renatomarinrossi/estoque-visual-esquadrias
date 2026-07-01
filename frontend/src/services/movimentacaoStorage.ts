import type { Movimentacao } from "../types/movimentacao";

const CHAVE = "visual_esquadrias_movimentacoes";

export function carregarMovimentacoes(): Movimentacao[] {
  const dados = localStorage.getItem(CHAVE);

  if (!dados) {
    return [];
  }

  return JSON.parse(dados);
}

export function salvarMovimentacoes(
  movimentacoes: Movimentacao[]
) {
  localStorage.setItem(
    CHAVE,
    JSON.stringify(movimentacoes)
  );
}
