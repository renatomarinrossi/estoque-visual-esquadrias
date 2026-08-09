import { supabase } from "./supabase";
import type { Produto } from "../types/produto";

export type ProdutoLixeira = {
  id: number;
  produto_id: number;
  codigo: string;
  descricao: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  estoque_minimo: number;
  preco_compra: number;
  observacao: string | null;
  fornecedor_id: number | null;
  ultima_entrada: string | null;
  data_exclusao: string;
};

export async function buscarProdutos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .is("excluido_em", null)
    .order("id", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function inserirProduto(produto: Produto) {
  const { error } = await supabase.from("produtos").insert({
    codigo: produto.codigo,
    descricao: produto.descricao,
    categoria: produto.categoria,
    unidade: produto.unidade,
    quantidade: produto.quantidade,
    estoque_minimo: produto.estoqueMinimo,
    preco_compra: produto.precoCompra,
    observacao: produto.observacao,
    fornecedor_id: produto.fornecedorId || null,
    ultima_entrada: produto.ultimaEntrada || null,
  });

  if (error) throw error;
}

export async function atualizarProduto(produto: Produto) {
  if (!produto.id) throw new Error("Produto sem ID.");

  const { error } = await supabase
    .from("produtos")
    .update({
      codigo: produto.codigo,
      descricao: produto.descricao,
      categoria: produto.categoria,
      unidade: produto.unidade,
      quantidade: produto.quantidade,
      estoque_minimo: produto.estoqueMinimo,
      preco_compra: produto.precoCompra,
      observacao: produto.observacao,
      fornecedor_id: produto.fornecedorId || null,
    })
    .eq("id", produto.id);

  if (error) throw error;
}

function validarQuantidade(quantidade: number) {
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    throw new Error("Informe uma quantidade maior que zero.");
  }
}

async function ajustarEstoque(
  produtoId: number,
  variacao: number,
  opcoes: {
    fornecedorId?: number;
    precoCompra?: number;
    registrarEntrada?: boolean;
  } = {}
) {
  const { data, error } = await supabase.rpc("ajustar_estoque", {
    p_produto_id: produtoId,
    p_variacao: variacao,
    p_fornecedor_id: opcoes.fornecedorId ?? null,
    p_preco_compra: opcoes.precoCompra ?? null,
    p_registrar_entrada: opcoes.registrarEntrada ?? false,
  });

  if (error) throw error;

  return data?.[0];
}

export async function registrarEntradaProduto(
  produtoId: number,
  quantidade: number,
  fornecedorId: number,
  precoCompra: number
) {
  validarQuantidade(quantidade);

  return ajustarEstoque(produtoId, quantidade, {
    fornecedorId,
    precoCompra,
    registrarEntrada: true,
  });
}

export async function registrarSaidaProduto(
  produtoId: number,
  quantidade: number
) {
  validarQuantidade(quantidade);

  return ajustarEstoque(produtoId, -quantidade);
}

export async function moverParaLixeira(produto: Produto): Promise<void> {
  if (!produto.id) throw new Error("Produto sem ID.");

  const { error } = await supabase.rpc("mover_produto_para_lixeira", {
    p_produto_id: produto.id,
  });

  if (error) throw error;
}

export async function buscarLixeira(): Promise<ProdutoLixeira[]> {
  const { data, error } = await supabase
    .from("lixeira")
    .select("*")
    .order("id", { ascending: false });

  if (error) throw error;

  return (data ?? []) as ProdutoLixeira[];
}

export async function restaurarProdutoLixeira(
  produto: Pick<ProdutoLixeira, "id">
): Promise<void> {
  const { error } = await supabase.rpc("restaurar_produto_da_lixeira", {
    p_lixeira_id: produto.id,
  });

  if (error) throw error;
}

export async function excluirLixeira(id: number): Promise<void> {
  const { error } = await supabase.from("lixeira").delete().eq("id", id);

  if (error) throw error;
}

